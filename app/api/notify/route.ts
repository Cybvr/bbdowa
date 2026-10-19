import { NextResponse } from "next/server";
import { getDocument, queryEquals, type PlainDoc } from "@/lib/email/firestore-rest";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { templates, applySavedTemplate, type EmailContent } from "@/lib/email/templates";
import { pushConfigured, sendPush, type PushPayload } from "@/lib/push/send";

// Transactional email for the dashboard. The browser says what happened (an event
// and a record id) and this route works out who to email and what to say from
// Firestore itself, reading with the caller's own token. Nothing the client sends
// is used as an address or as message text, so it can't be used to mail strangers.

export const runtime = "nodejs";

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const sends = new Map<string, number[]>();

type Actor = { uid: string; email: string | null; token: string; staff: boolean; admin: boolean; name: string | null };

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function validEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function rolesOf(user: PlainDoc | null): string[] {
  if (!user) return [];
  const roles = strings(user.roles);
  return roles.length ? roles : str(user.role) ? [str(user.role)] : [];
}

async function userByUid(uid: string, token: string): Promise<PlainDoc | null> {
  if (!uid) return null;
  return (await getDocument(`users/${uid}`, token)) ?? (await queryEquals("users", "uid", uid, token, 1))[0] ?? null;
}

async function verify(request: Request): Promise<Actor | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token || !apiKey) return null;
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { users?: Array<{ localId?: string; email?: string }> };
  const account = data.users?.[0];
  if (!account?.localId) return null;
  const profile = await userByUid(account.localId, token);
  const roles = rolesOf(profile);
  return {
    uid: account.localId,
    email: account.email ?? null,
    token,
    admin: roles.includes("admin"),
    staff: roles.includes("admin") || roles.includes("manager"),
    name: str(profile?.name) || null,
  };
}

function overRate(uid: string, count: number): boolean {
  const now = Date.now();
  const recent = (sends.get(uid) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length + count > RATE_LIMIT) {
    sends.set(uid, recent);
    return true;
  }
  sends.set(uid, [...recent, ...Array(count).fill(now)]);
  return false;
}

type Recipient = { uid: string; email: string | null; name: string | null; role: string | null };

/** People to notify. Email opt-out does not disable browser push. */
async function recipientsFor(uids: string[], actor: Actor): Promise<Recipient[]> {
  const people = await Promise.all([...new Set(uids)].filter((uid) => uid && uid !== actor.uid).map((uid) => userByUid(uid, actor.token)));
  return people.flatMap((person) => {
    if (!person) return [];
    return [{
      uid: str(person.uid) || person.id,
      email: person.emailNotifications !== false && validEmail(person.email) ? person.email : null,
      name: str(person.name) || null,
      role: str(person.role) || null,
    }];
  });
}

const BAD = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function POST(request: Request) {
  if (!emailConfigured() && !pushConfigured()) return BAD("Notifications aren't set up yet.", 503);
  const actor = await verify(request);
  if (!actor) return BAD("Sign in to send notifications.", 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return BAD("Invalid request.");
  }

  const event = str(body.event);
  const id = str(body.id);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const link = (path: string) => `${origin}${path}`;
  const batch: Array<{ to: string; content: EmailContent }> = [];
  const pushBatch: Array<{ uid: string; payload: PushPayload }> = [];
  // The pulled /api/email route owns email for these events. This route adds
  // browser push without sending a second copy of the same email.
  const primaryEmailEvents = new Set(["task.assigned", "document.sent", "invoice.sent", "job.assigned"]);
  const queue = (person: Recipient, content: EmailContent, path: string, body: string) => {
    if (person.email && !primaryEmailEvents.has(event)) batch.push({ to: person.email, content });
    pushBatch.push({ uid: person.uid, payload: { title: content.subject, body, url: path, tag: event } });
  };

  if (event === "task.assigned") {
    const task = await getDocument(`creatorTasks/${id}`, actor.token);
    if (!task || !(actor.staff || task.createdBy === actor.uid)) return BAD("Not allowed.", 403);
    const assignees = Array.isArray(task.assignees) ? (task.assignees as Array<{ uid?: string }>).map((person) => str(person.uid)) : [];
    const everyone = assignees.length ? assignees : [str(task.assignedTo)];
    const wanted = strings(body.uids);
    const uids = everyone.filter((uid) => uid && (!wanted.length || wanted.includes(uid)));
    for (const person of await recipientsFor(uids, actor)) {
      const path = `/dashboard/work/${encodeURIComponent(id)}`;
      queue(person, templates.taskAssigned({ to: person.name, by: actor.name, title: str(task.title), description: str(task.description), client: str(task.clientName) || null, job: str(task.jobName) || null, due: str(task.dueDate) || null, url: link(path) }), path, `${actor.name ?? "A teammate"} assigned you “${str(task.title)}”.`);
    }
  } else if (event === "document.sent") {
    const document = await getDocument(`documents/${id}`, actor.token);
    if (!document || document.status !== "pending_signature" || !(actor.staff || document.createdBy === actor.uid)) return BAD("Not allowed.", 403);
    for (const person of await recipientsFor([str(document.assignedTo)], actor)) {
      const path = `/dashboard/documents/${encodeURIComponent(id)}`;
      queue(person, templates.documentSent({ to: person.name, by: actor.name, title: str(document.title), url: link(path) }), path, `“${str(document.title)}” is ready for your signature.`);
    }
  } else if (event === "document.signed") {
    const document = await getDocument(`documents/${id}`, actor.token);
    if (!document || document.status !== "signed" || document.assignedTo !== actor.uid) return BAD("Not allowed.", 403);
    for (const person of await recipientsFor([str(document.createdBy)], actor)) {
      const path = `/dashboard/documents/${encodeURIComponent(id)}`;
      queue(person, templates.documentSigned({ to: person.name, signer: str(document.signedName) || actor.name, title: str(document.title), signedAt: str(document.signedAt) || null, url: link(path) }), path, `${str(document.signedName) || actor.name || "The recipient"} signed “${str(document.title)}”.`);
    }
  } else if (event === "appraisal.assigned") {
    const appraisal = await getDocument(`appraisals/${id}`, actor.token);
    if (!appraisal || !actor.staff) return BAD("Not allowed.", 403);
    for (const person of await recipientsFor([str(appraisal.assignedTo)], actor)) {
      const path = `/dashboard/appraisals/${encodeURIComponent(id)}`;
      queue(person, templates.appraisalAssigned({ to: person.name, by: actor.name, period: str(appraisal.period), message: str(appraisal.message), url: link(path) }), path, `Please complete your appraisal for ${str(appraisal.period)}.`);
    }
  } else if (event === "appraisal.submitted") {
    const appraisal = await getDocument(`appraisals/${id}`, actor.token);
    if (!appraisal || appraisal.status !== "submitted" || appraisal.assignedTo !== actor.uid) return BAD("Not allowed.", 403);
    for (const person of await recipientsFor([str(appraisal.createdBy)], actor)) {
      const path = `/admin/appraisals/${encodeURIComponent(id)}/edit`;
      queue(person, templates.appraisalSubmitted({ to: person.name, person: str(appraisal.assignedToName) || actor.name, period: str(appraisal.period), url: link(path) }), path, `${str(appraisal.assignedToName) || actor.name || "A team member"} submitted an appraisal.`);
    }
  } else if (event === "invoice.sent") {
    const invoice = await getDocument(`invoices/${id}`, actor.token);
    if (!invoice || invoice.status !== "sent" || !actor.staff) return BAD("Not allowed.", 403);
    const clientId = str(invoice.clientId);
    const clientUsers = await queryEquals("users", "clientId", clientId, actor.token, 25);
    for (const person of clientUsers) {
      const recipient: Recipient = {
        uid: str(person.uid) || person.id,
        email: person.emailNotifications !== false && validEmail(person.email) ? person.email : null,
        name: str(person.name) || null,
        role: str(person.role) || null,
      };
      const path = "/portal/payments";
      queue(recipient, templates.invoiceSent({ to: recipient.name, number: str(invoice.number), client: str(invoice.clientName), amount: Number(invoice.amount) || 0, currency: str(invoice.currency), description: str(invoice.description), due: str(invoice.dueDate) || null, url: link(path) }), path, `Invoice ${str(invoice.number)} is ready.`);
    }
  } else if (event === "payment.paid") {
    const payment = await getDocument(`payments/${id}`, actor.token);
    if (!payment || payment.status !== "paid" || !actor.staff) return BAD("Not allowed.", 403);
    for (const person of await recipientsFor([str(payment.payeeUid)], actor)) {
      const path = "/dashboard/payments";
      queue(person, templates.paymentPaid({ to: person.name, amount: Number(payment.amount) || 0, currency: str(payment.currency), description: str(payment.description), job: str(payment.jobName) || null, url: link(path) }), path, `A payment for ${str(payment.description) || "your work"} was marked as paid.`);
    }
  } else if (event === "job.assigned") {
    const terms = await getDocument(`jobTerms/${id}`, actor.token);
    if (!terms || !actor.staff) return BAD("Not allowed.", 403);
    const onJob = new Set<string>([str(terms.assignedTo), ...strings(terms.teamUids), ...(Array.isArray(terms.assignees) ? (terms.assignees as Array<{ uid?: string }>).map((person) => str(person.uid)) : [])]);
    const uids = strings(body.uids).filter((uid) => onJob.has(uid));
    const job = (await getDocument(`jobs/${id}`, actor.token)) ?? (await getDocument(`campaigns/${id}`, actor.token));
    const jobName = str(job?.name) || str(job?.title) || id;
    for (const person of await recipientsFor(uids, actor)) {
      const path = `/dashboard/my-jobs/${encodeURIComponent(id)}`;
      queue(person, templates.jobAssigned({ to: person.name, job: jobName, url: link(path) }), path, `You were added to “${jobName}”.`);
    }
  } else if (event === "message.sent") {
    const conversation = await getDocument(`conversations/${id}`, actor.token);
    const participants = strings(conversation?.participants);
    if (!conversation || !participants.includes(actor.uid) || conversation.lastSenderId !== actor.uid) return BAD("Not allowed.", 403);
    const recipientUid = participants.find((uid) => uid !== actor.uid) ?? "";
    for (const person of await recipientsFor([recipientUid], actor)) {
      const path = person.role === "client" ? "/portal/messages" : "/dashboard/messages";
      const preview = str(conversation.lastMessage).slice(0, 240);
      queue(person, templates.messageReceived({ to: person.name, from: actor.name, preview, url: link(path) }), path, preview || `${actor.name ?? "Someone"} sent you a message.`);
    }
  } else if (event === "application.submitted") {
    // The applicant tells whoever made the posting. Only their own, freshly sent application counts.
    const application = await getDocument(`jobApplications/${id}`, actor.token);
    if (!application || application.uid !== actor.uid || application.status !== "submitted") return BAD("Not allowed.", 403);
    const posting = await getDocument(`jobPostings/${str(application.postingId)}`, actor.token);
    if (!posting) return BAD("Not allowed.", 403);
    const headline = str(posting.headline) || "your job posting";
    // Applicants needn't have an account, so the name comes from the form.
    const applicant = str(application.name) || actor.name;
    for (const person of await recipientsFor([str(posting.createdBy)], actor)) {
      // The applicant can't read which job the posting is for, so link to the admin jobs list.
      const path = "/admin/jobs";
      queue(person, templates.applicationReceived({ to: person.name, applicant, job: headline, url: link(path) }), path, `${applicant ?? "Someone"} applied to “${headline}”.`);
    }
  } else if (event === "client.invite") {
    const email = str(body.email).trim().toLowerCase();
    const invite = await getDocument(`clientInvites/${email}`, actor.token);
    if (!invite || invite.invitedBy !== actor.uid || !validEmail(invite.email)) return BAD("Not allowed.", 403);
    batch.push({ to: invite.email, content: templates.clientInvite({ to: str(invite.name) || null, by: actor.name, company: str(invite.clientName) || "your company", url: link("/portal/signup") }) });
  } else if (event === "welcome") {
    if (!validEmail(actor.email)) return BAD("No email on this account.");
    batch.push({ to: actor.email, content: templates.welcome({ to: actor.name, url: link("/dashboard") }) });
  } else if (event === "test") {
    if (!actor.admin) return BAD("Only admins can send a test email.", 403);
    if (!validEmail(actor.email)) return BAD("No email on this account.");
    batch.push({ to: actor.email, content: templates.test({ to: actor.name }) });
  } else {
    return BAD("Unknown event.");
  }

  if (!batch.length && !pushBatch.length) return NextResponse.json({ sent: 0, pushed: 0 });
  if (overRate(actor.uid, Math.max(batch.length, pushBatch.length))) return BAD("Too many notifications sent recently. Try again later.", 429);

  const results = emailConfigured()
    ? await Promise.all(batch.map(async (item) => {
      let content = item.content;
      try {
        const saved = content.templateKey ? await getDocument(`messageTemplates/${content.templateKey}`, actor.token) : null;
        content = applySavedTemplate(content, saved);
      } catch (cause) { console.warn("Template load failed; using default", cause); }
      return sendEmail({ to: item.to, subject: content.subject, html: content.html, text: content.text, tag: event });
    }))
    : [];
  const pushResults = await Promise.all(pushBatch.map((item) => sendPush(item.uid, item.payload)));
  const sent = results.filter((result) => result.ok).length;
  const pushed = pushResults.reduce((total, result) => total + result.sent, 0);
  const failure = results.find((result) => !result.ok);
  if (!sent && !pushed && failure && !failure.ok) return BAD(failure.reason, 502);
  return NextResponse.json({ sent, pushed, failed: results.length - sent + pushResults.reduce((total, result) => total + result.failed, 0) });
}
