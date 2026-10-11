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
  subject: string;
  message: string;
  email: boolean;
  inApp: boolean;
  /** Only count who it would go to; don't send. */
  preview?: boolean;
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
  const sender = users.find((user) => user.uid === account.uid || user.id === account.uid);
  const senderRole = str(sender?.role);
  if (senderRole !== "admin" && senderRole !== "manager") return NextResponse.json({ error: "Only admins and managers can send messages." }, { status: 403 });

  const subject = str(body.subject).trim().slice(0, 200);
  const message = str(body.message).trim().slice(0, 5000);
  if (!MESSAGE_AUDIENCES.some((item) => item.key === body.audience)) return NextResponse.json({ error: "Choose who it goes to." }, { status: 400 });
  if (!body.preview && (!subject || !message)) return NextResponse.json({ error: "Add a subject and a message." }, { status: 400 });
  if (!body.preview && !body.email && !body.inApp) return NextResponse.json({ error: "Choose email, in-app or both." }, { status: 400 });

  // Only people who have joined (signed in at least once) get messages.
  const joined = new Map<string, { uid: string; email: string; role: string }>();
  for (const user of users) {
    const uid = str(user.uid);
    if (!uid || joined.has(uid)) continue;
    joined.set(uid, { uid, email: str(user.email).toLowerCase(), role: str(user.role) });
  }
  const chosen = new Set(Array.isArray(body.uids) ? body.uids : []);
  const recipients = [...joined.values()].filter((person) => {
    if (person.role === "pending") return false;
    if (body.audience === "team") return person.role === "admin" || person.role === "manager";
    if (body.audience === "creators") return person.role === "creator";
    if (body.audience === "clients") return person.role === "client";
    if (body.audience === "people") return chosen.has(person.uid);
    return true;
  });
  const emails = [...new Set(recipients.map((person) => person.email).filter(Boolean))];

  if (body.preview) return NextResponse.json({ people: recipients.length, emails: emails.length });
  if (!recipients.length) return NextResponse.json({ error: "Nobody matches that choice." }, { status: 400 });

  const senderName = str(sender?.preferredName) || str(sender?.name) || "Bantaba";
  const createdAt = new Date().toISOString();
  let emailed = 0;
  let notified = 0;
  try {
    if (body.inApp) {
      await db.addMany("notifications", recipients.map((person) => ({
        uid: person.uid, type: "message", title: subject, body: message, href: null, createdAt, readAt: null,
      })));
      notified = recipients.length;
    }
    if (body.email && emails.length) {
      if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error("Email is not set up yet.");
      await sendMany({ to: emails, subject, lines: [message, `From ${senderName}`], href: "/dashboard/notifications", action: "Open Bantaba" });
      emailed = emails.length;
    }
  } catch (cause) {
    console.error("Unable to send message", cause);
    const reason = cause instanceof Error && cause.message === "Email is not set up yet." ? cause.message : "Couldn’t send the message.";
    return NextResponse.json({ error: reason, notified, emailed }, { status: 502 });
  } finally {
    if (notified || emailed) {
      await db.add("sentMessages", {
        subject, message, audience: body.audience, sentBy: account.uid, sentByName: senderName,
        createdAt, people: recipients.length, emailed, notified,
      }).catch((cause) => console.error("Unable to record sent message", cause));
    }
  }
  return NextResponse.json({ notified, emailed });
}
