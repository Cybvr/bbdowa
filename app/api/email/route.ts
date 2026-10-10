// Transactional emails sent by the app (see lib/app-email.ts for the client side).
//
// The browser posts what just happened (a task id, a document id, …) with the
// signed-in person's Firebase ID token. This route checks the token, re-reads
// the record from Firestore *as that person* (so security rules still apply),
// works out who to email, and sends through Resend. Callers never choose the
// recipients or the wording, so the route can't be used to send arbitrary mail.
//
// Env: RESEND_API_KEY, EMAIL_FROM, optional SITE_URL (links), plus the
// NEXT_PUBLIC_FIREBASE_* values the app already uses.
import { NextResponse } from "next/server";
import { DEFAULT_NOTIFICATION_SETTINGS, type TransactionalEmailKey } from "@/lib/notifications";
import { firestoreAs, send, verifyIdToken, type Email } from "@/lib/server/email";

export const runtime = "nodejs";

const str = (value: unknown) => (typeof value === "string" ? value : "");
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item)) : []);

type Body =
  | { type: "welcome" }
  | { type: "task"; taskId: string; uids?: string[] }
  | { type: "job"; jobSlug: string; uids: string[] }
  | { type: "document"; documentId: string }
  | { type: "invoice"; invoiceId: string }
  | { type: "invite"; email: string };

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return NextResponse.json({ sent: 0, reason: "Email is not set up." });
  const idToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const account = idToken ? await verifyIdToken(idToken) : null;
  const callerUid = account?.uid ?? null;
  if (!callerUid) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const db = firestoreAs(idToken);
  const settings = await db.get("settings/notifications");
  const enabled = { ...DEFAULT_NOTIFICATION_SETTINGS.transactional, ...((settings?.transactional as Partial<Record<TransactionalEmailKey, boolean>> | undefined) ?? {}) };
  if (!enabled[body.type]) return NextResponse.json({ sent: 0, reason: "Turned off in settings." });

  const callerProfile = (await db.get(`users/${callerUid}`)) ?? (await db.where("users", [["uid", callerUid]]))[0] ?? null;
  const callerRole = str(callerProfile?.role);
  const callerName = str(callerProfile?.preferredName) || str(callerProfile?.name) || "Someone";
  const isStaff = callerRole === "admin" || callerRole === "manager";

  const emailsFor = async (keys: string[]) => {
    const found = new Set<string>();
    for (const key of [...new Set(keys)]) {
      const people = [...await db.where("users", [["uid", key]]), ...await db.where("users", [["slug", key]])];
      const direct = people.length ? null : await db.get(`users/${key}`);
      for (const person of direct ? [direct] : people) if (str(person.email)) found.add(str(person.email).toLowerCase());
    }
    return [...found];
  };

  let email: Email | null = null;
  if (body.type === "task" && isStaff) {
    const task = await db.get(`creatorTasks/${encodeURIComponent(body.taskId)}`);
    if (task && task.status !== "done") {
      const assignees = [...strings(task.assigneeUids), str(task.assignedTo)].filter(Boolean);
      const targets = body.uids?.length ? assignees.filter((uid) => body.uids!.includes(uid)) : assignees;
      const due = str(task.dueDate);
      email = {
        to: await emailsFor(targets.filter((uid) => uid !== callerUid)),
        subject: `New task: ${str(task.title) || "Untitled task"}`,
        lines: [`${callerName} gave you a task${str(task.jobName) ? ` on ${str(task.jobName)}` : ""}.`, ...(due ? [`Due ${due}.`] : [])],
        href: `/dashboard/work/${encodeURIComponent(body.taskId)}`,
        action: "Open task",
      };
    }
  } else if (body.type === "job" && isStaff) {
    const [terms, job] = await Promise.all([
      db.get(`jobTerms/${encodeURIComponent(body.jobSlug)}`),
      db.get(`jobs/${encodeURIComponent(body.jobSlug)}`).then((found) => found ?? db.get(`campaigns/${encodeURIComponent(body.jobSlug)}`)),
    ]);
    const members = new Set([str(terms?.assignedTo), ...strings(terms?.teamUids)].filter(Boolean));
    const name = str(job?.title) || str(job?.campaign) || str(job?.name) || "a job";
    email = {
      to: await emailsFor(strings(body.uids).filter((uid) => members.has(uid) && uid !== callerUid)),
      subject: `You've been added to ${name}`,
      lines: [`${callerName} added you to ${name}${str(job?.clientName) ? ` for ${str(job?.clientName)}` : ""}.`],
      href: `/dashboard/my-jobs/${encodeURIComponent(body.jobSlug)}`,
      action: "Open job",
    };
  } else if (body.type === "document" && isStaff) {
    const document = await db.get(`documents/${encodeURIComponent(body.documentId)}`);
    if (document?.status === "pending_signature" && str(document.assignedTo)) {
      email = {
        to: await emailsFor([str(document.assignedTo)]),
        subject: `Please sign: ${str(document.title) || "a document"}`,
        lines: [`${callerName} sent you a document to read and sign.`],
        href: `/dashboard/documents/${encodeURIComponent(body.documentId)}`,
        action: "Read and sign",
      };
    }
  } else if (body.type === "invoice" && isStaff) {
    const invoice = await db.get(`invoices/${encodeURIComponent(body.invoiceId)}`);
    if (invoice?.status === "sent" && str(invoice.clientId)) {
      const clientUsers = await db.where("users", [["clientId", str(invoice.clientId)], ["role", "client"]]);
      let amount = "";
      if (typeof invoice.amount === "number") {
        try {
          amount = new Intl.NumberFormat("en-GB", { style: "currency", currency: str(invoice.currency) || "NGN" }).format(invoice.amount);
        } catch {
          amount = `${str(invoice.currency)} ${invoice.amount}`.trim();
        }
      }
      email = {
        to: [...new Set(clientUsers.map((person) => str(person.email).toLowerCase()).filter(Boolean))],
        subject: `Invoice ${str(invoice.number)} from BBDO West Africa`,
        lines: [
          `${amount ? `${amount} ` : ""}${str(invoice.description) ? `for ${str(invoice.description)}` : ""}`.trim() || "A new invoice is ready.",
          ...(str(invoice.dueDate) ? [`Due ${str(invoice.dueDate)}.`] : []),
        ],
        href: "/portal/payments",
        action: "View invoice",
      };
    }
  } else if (body.type === "welcome") {
    // Only to the person signing up, and only for a profile made in the last hour.
    const createdAt = Date.parse(str(callerProfile?.createdAt));
    if (account?.email && Number.isFinite(createdAt) && Date.now() - createdAt < 3_600_000) {
      const firstName = (str(callerProfile?.preferredName) || str(callerProfile?.name)).split(/\s+/)[0];
      const lines = callerRole === "client"
        ? ["Your company's Bantaba portal is ready. You can see your jobs, invoices and messages there."]
        : callerRole === "creator"
          ? ["Your Bantaba account is ready. Browse jobs, track your time and keep your profile up to date."]
          : ["Thanks for signing up to Bantaba, BBDO West Africa's workspace.", "An admin will confirm your access shortly. We'll be in touch."];
      email = {
        to: [account.email.toLowerCase()],
        subject: `Welcome to Bantaba${firstName ? `, ${firstName}` : ""}`,
        lines,
        href: callerRole === "client" ? "/portal" : "/dashboard",
        action: callerRole === "client" ? "Open the portal" : "Open Bantaba",
      };
    }
  } else if (body.type === "invite") {
    const address = str(body.email).trim().toLowerCase();
    const staffInvite = isStaff ? (await db.where("users", [["email", address]]))[0] ?? (await db.where("users", [["email", str(body.email).trim()]]))[0] : null;
    const clientInvite = staffInvite ? null : await db.get(`clientInvites/${encodeURIComponent(address)}`);
    if (staffInvite) {
      email = {
        to: [address],
        subject: "You're invited to Bantaba",
        lines: [`${callerName} added you to Bantaba, BBDO West Africa's workspace.`, "Sign in with this email address to get started."],
        href: "/auth/login",
        action: "Sign in",
      };
    } else if (clientInvite) {
      email = {
        to: [address],
        subject: `${callerName} invited you to Bantaba`,
        lines: [`You've been invited to your company's Bantaba portal${str(clientInvite.clientName) ? ` for ${str(clientInvite.clientName)}` : ""}.`, "Sign in with this email address to get started."],
        href: "/portal/login",
        action: "Open the portal",
      };
    }
  }

  if (!email || !email.to.length) return NextResponse.json({ sent: 0 });
  try {
    await send(email);
    return NextResponse.json({ sent: email.to.length });
  } catch (cause) {
    console.error("Unable to send email", cause);
    return NextResponse.json({ error: "Couldn’t send the email." }, { status: 502 });
  }
}
