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
import { DEFAULT_NOTIFICATION_SETTINGS, type InstantEmailKey } from "@/lib/notifications";

export const runtime = "nodejs";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const DATABASE_ID = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || "(default)";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

type Fields = Record<string, unknown>;
type Doc = Fields & { id: string };

function decode(field: Record<string, unknown> | undefined): unknown {
  if (!field || "nullValue" in field) return null;
  if ("stringValue" in field) return field.stringValue;
  if ("timestampValue" in field) return field.timestampValue;
  if ("booleanValue" in field) return field.booleanValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return field.doubleValue;
  if ("arrayValue" in field) return ((field.arrayValue as { values?: Record<string, unknown>[] }).values ?? []).map(decode);
  if ("mapValue" in field) {
    const fields = (field.mapValue as { fields?: Record<string, Record<string, unknown>> }).fields ?? {};
    return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decode(value)]));
  }
  return null;
}

const toDoc = (document: { name: string; fields?: Record<string, Record<string, unknown>> }): Doc => ({
  id: document.name.split("/").at(-1) ?? "",
  ...Object.fromEntries(Object.entries(document.fields ?? {}).map(([key, value]) => [key, decode(value)])),
});

/** Firestore reads made as the signed-in person, so their security rules apply. */
function firestoreAs(idToken: string) {
  const headers = { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" };
  return {
    async get(path: string): Promise<Doc | null> {
      const response = await fetch(`${BASE}/${path}`, { headers, cache: "no-store" });
      if (!response.ok) return null;
      return toDoc(await response.json());
    },
    async where(collection: string, filters: [string, string | number | boolean][]): Promise<Doc[]> {
      const value = (item: string | number | boolean) =>
        typeof item === "boolean" ? { booleanValue: item } : typeof item === "number" ? { integerValue: String(item) } : { stringValue: item };
      const clauses = filters.map(([field, item]) => ({ fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: value(item) } }));
      const response = await fetch(`${BASE}:runQuery`, {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: collection }],
            where: clauses.length === 1 ? clauses[0] : { compositeFilter: { op: "AND", filters: clauses } },
          },
        }),
      });
      if (!response.ok) return [];
      const rows = (await response.json()) as { document?: { name: string; fields?: Record<string, Record<string, unknown>> } }[];
      return rows.filter((row) => row.document).map((row) => toDoc(row.document!));
    },
  };
}

/** The uid behind a valid Firebase ID token, or null. */
async function verifyIdToken(idToken: string): Promise<string | null> {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { users?: { localId: string }[] };
  return data.users?.[0]?.localId ?? null;
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

type Email = { to: string[]; subject: string; lines: string[]; href: string; action: string };

async function send(email: Email) {
  const site = (process.env.SITE_URL || "").replace(/\/$/, "");
  const link = site ? `<p><a href="${escapeHtml(site + email.href)}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">${escapeHtml(email.action)}</a></p>` : "";
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111"><p><strong>${escapeHtml(email.subject)}</strong></p>${email.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}${link}<p style="color:#888;font-size:12px">Sent by Bantaba.</p></div>`;
  for (const to of email.to) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject: email.subject, html }),
    });
    if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
  }
}

const str = (value: unknown) => (typeof value === "string" ? value : "");
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item)) : []);

type Body =
  | { type: "task"; taskId: string; uids?: string[] }
  | { type: "job"; jobSlug: string; uids: string[] }
  | { type: "document"; documentId: string }
  | { type: "invoice"; invoiceId: string }
  | { type: "invite"; email: string };

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return NextResponse.json({ sent: 0, reason: "Email is not set up." });
  const idToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const callerUid = idToken ? await verifyIdToken(idToken) : null;
  if (!callerUid) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const db = firestoreAs(idToken);
  const settings = await db.get("settings/notifications");
  const instant = { ...DEFAULT_NOTIFICATION_SETTINGS.instant, ...((settings?.instant as Partial<Record<InstantEmailKey, boolean>> | undefined) ?? {}) };
  if (!instant[body.type]) return NextResponse.json({ sent: 0, reason: "Turned off in settings." });

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
