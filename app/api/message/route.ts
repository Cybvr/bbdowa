// Messages written by admins and managers (Admin → Send message).
//
// Checks the sender is staff, works out who it goes to, then writes in-app
// notifications and/or sends emails, and keeps a record in `sentMessages`.
// All Firestore reads and writes are made as the sender, so security rules
// still apply.
import { NextResponse } from "next/server";
import { firestoreAs, sendMany, verifyIdToken } from "@/lib/server/email";
import { MESSAGE_AUDIENCES, type MessageAudience } from "@/lib/notifications";

export const runtime = "nodejs";

type Body = {
  audience: MessageAudience;
  uids?: string[];
  /** For the "Email addresses" choice. */
  addresses?: string[];
  /** Send only to the sender, as a test. */
  test?: boolean;
  subject: string;
  message: string;
  email: boolean;
  inApp: boolean;
};

const str = (value: unknown) => (typeof value === "string" ? value : "");

export async function POST(request: Request) {
  const idToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const account = idToken ? await verifyIdToken(idToken) : null;
  if (!account) return NextResponse.json({ error: "Your sign-in has expired. Refresh the page and try again." }, { status: 401 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const db = firestoreAs(idToken);
  let users;
  try {
    users = await db.list("users");
  } catch (cause) {
    console.error("Unable to read people", cause);
    return NextResponse.json({ error: "Couldn’t load the list of people. Try again." }, { status: 502 });
  }
  // Same record the app reads for someone's role: users/{uid}.
  const sender = users.find((user) => user.id === account.uid) ?? users.find((user) => user.uid === account.uid);
  const senderRole = str(sender?.role);
  if (senderRole !== "admin" && senderRole !== "manager") return NextResponse.json({ error: "Only admins and managers can send messages." }, { status: 403 });

  const subject = str(body.subject).trim().slice(0, 200);
  const message = str(body.message).trim().slice(0, 5000);
  if (!body.test && !MESSAGE_AUDIENCES.some((item) => item.key === body.audience)) return NextResponse.json({ error: "Choose who it goes to." }, { status: 400 });
  if (!subject || !message) return NextResponse.json({ error: "Add a subject and a message." }, { status: 400 });

  // Typed-in addresses can only be emailed: they have no account to notify.
  const toAddresses = !body.test && body.audience === "emails";
  const sendEmail = toAddresses || Boolean(body.email);
  const sendInApp = !toAddresses && Boolean(body.inApp);
  if (!sendEmail && !sendInApp) return NextResponse.json({ error: "Choose email, in-app or both." }, { status: 400 });

  // People who have joined (signed in at least once). A person can have more
  // than one record; their main one is users/{uid}.
  const joined = new Map<string, { uid: string; email: string; role: string }>();
  const ordered = [...users].sort((a, b) => Number(b.id === str(b.uid)) - Number(a.id === str(a.uid)));
  for (const user of ordered) {
    const uid = str(user.uid);
    if (!uid || joined.has(uid)) continue;
    joined.set(uid, { uid, email: str(user.email).toLowerCase(), role: str(user.role) });
  }

  let recipients: { uid: string; email: string; role: string }[] = [];
  let emails: string[] = [];
  if (body.test) {
    const me = joined.get(account.uid) ?? { uid: account.uid, email: (account.email ?? "").toLowerCase(), role: senderRole };
    recipients = [me];
  } else if (toAddresses) {
    const typed = (Array.isArray(body.addresses) ? body.addresses : []).map((item) => str(item).trim().toLowerCase());
    const invalid = typed.filter((item) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
    if (invalid.length) return NextResponse.json({ error: `Check these addresses: ${invalid.slice(0, 3).join(", ")}` }, { status: 400 });
    emails = [...new Set(typed)].slice(0, 100);
    if (!emails.length) return NextResponse.json({ error: "Add at least one email address." }, { status: 400 });
  } else {
    const chosen = new Set(Array.isArray(body.uids) ? body.uids : []);
    recipients = [...joined.values()].filter((person) => {
      if (person.role === "pending") return false;
      if (body.audience === "team") return person.role === "admin" || person.role === "manager";
      if (body.audience === "creators") return person.role === "creator";
      if (body.audience === "clients") return person.role === "client";
      if (body.audience === "people") return chosen.has(person.uid);
      return true;
    });
  }
  if (!toAddresses) emails = [...new Set(recipients.map((person) => person.email).filter(Boolean))];
  if (!recipients.length && !emails.length) return NextResponse.json({ error: "Nobody matches that choice." }, { status: 400 });

  const senderName = str(sender?.preferredName) || str(sender?.name) || "Bantaba";
  const createdAt = new Date().toISOString();
  let emailed = 0;
  let notified = 0;
  const problems: string[] = [];

  if (sendInApp && recipients.length) {
    try {
      await db.addMany("notifications", recipients.map((person) => ({
        uid: person.uid, type: "message", title: subject, body: message, href: null, createdAt, readAt: null,
      })));
      notified = recipients.length;
    } catch (cause) {
      console.error("Unable to write notifications", cause);
      const text = cause instanceof Error ? cause.message : "";
      problems.push(/\b403\b|PERMISSION_DENIED/.test(text)
        ? "In-app notifications are blocked until the latest Firebase rules are published."
        : "In-app notifications didn’t go through.");
    }
  }

  if (sendEmail) {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      problems.push("Email isn’t set up yet. Add RESEND_API_KEY and EMAIL_FROM in Vercel, then redeploy.");
    } else if (!emails.length) {
      problems.push("None of these people have an email address.");
    } else {
      try {
        await sendMany({ to: emails, subject, lines: [message, `From ${senderName}`], href: toAddresses ? "" : "/dashboard/notifications", action: "Open Bantaba" });
        emailed = emails.length;
      } catch (cause) {
        console.error("Unable to send email", cause);
        problems.push(`Email didn’t go through: ${resendReason(cause)}`);
      }
    }
  }

  if ((notified || emailed) && !body.test) {
    await db.add("sentMessages", {
      subject, message, audience: body.audience, sentBy: account.uid, sentByName: senderName,
      createdAt, people: toAddresses ? emails.length : recipients.length, emailed, notified,
    }).catch((cause) => console.error("Unable to record sent message", cause));
  }

  if (problems.length) return NextResponse.json({ error: problems.join(" "), notified, emailed }, { status: notified || emailed ? 207 : 502 });
  return NextResponse.json({ notified, emailed });
}

/** Resend's own explanation, e.g. an unverified domain, in plain words. */
function resendReason(cause: unknown): string {
  const text = cause instanceof Error ? cause.message : String(cause);
  const json = text.slice(text.indexOf("{"));
  try {
    const parsed = JSON.parse(json) as { message?: string };
    if (parsed.message) return parsed.message;
  } catch {
    // Not JSON; fall through.
  }
  return text.replace(/^Resend \d+:\s*/, "") || "unknown error";
}
