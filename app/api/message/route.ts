// Messages written by admins and managers (Admin → Send message).
//
// Checks the sender is staff, works out who it goes to (groups, chosen people
// and typed email addresses, combined), then writes in-app notifications
// and/or sends emails, and keeps a record in `sentMessages`. All Firestore
// reads and writes are made as the sender, so security rules still apply.
import { NextResponse } from "next/server";
import { firestoreAs, sendMany, verifyIdToken } from "@/lib/server/email";
import { MESSAGE_GROUPS, type MessageGroup } from "@/lib/notifications";
import { pushConfigured, sendPush } from "@/lib/push/send";
import { buildMessageHtml, extractMessageCta, messageHtmlToPlainText, stripMessageCta } from "@/lib/message-html";

export const runtime = "nodejs";

type Body = {
  groups?: MessageGroup[];
  uids?: string[];
  /** Typed email addresses. These can only be emailed. */
  addresses?: string[];
  /** Send only to the sender, as a test. */
  test?: boolean;
  /** Only work out how many it reaches; send nothing. */
  preview?: boolean;
  subject?: string;
  message?: string;
  email?: boolean;
  inApp?: boolean;
  push?: boolean;
};

const MAX_MESSAGE_HTML = 20000;
const MAX_MESSAGE_TEXT = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (value: unknown) => (typeof value === "string" ? value : "");
const list = (value: unknown) => (Array.isArray(value) ? value.map(str).filter(Boolean) : []);

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

  // People who have joined (signed in at least once). A person can have more
  // than one record; their main one is users/{uid}.
  const joined = new Map<string, { uid: string; email: string; role: string; name: string }>();
  const ordered = [...users].sort((a, b) => Number(b.id === str(b.uid)) - Number(a.id === str(a.uid)));
  for (const user of ordered) {
    const uid = str(user.uid);
    if (!uid || joined.has(uid)) continue;
    joined.set(uid, { uid, email: str(user.email).toLowerCase(), role: str(user.role), name: str(user.preferredName) || str(user.name) });
  }

  const groups = new Set(list(body.groups).filter((group): group is MessageGroup => MESSAGE_GROUPS.some((item) => item.key === group)));
  const chosen = new Set(list(body.uids));
  const typed = [...new Set(list(body.addresses).map((item) => item.trim().toLowerCase()))].slice(0, 100);
  const invalid = typed.filter((item) => !EMAIL_PATTERN.test(item));
  if (invalid.length) return NextResponse.json({ error: `Check these addresses: ${invalid.slice(0, 3).join(", ")}` }, { status: 400 });

  const inGroup = (person: { role: string }) =>
    groups.has("everyone")
    || (groups.has("team") && (person.role === "admin" || person.role === "manager"))
    || (groups.has("creators") && person.role === "creator")
    || (groups.has("clients") && person.role === "client");
  const recipients = body.test
    ? [joined.get(account.uid) ?? { uid: account.uid, email: (account.email ?? "").toLowerCase(), role: senderRole, name: "" }]
    : [...joined.values()].filter((person) => person.role !== "pending" && (chosen.has(person.uid) || inGroup(person)));
  const recipientEmails = new Set(recipients.map((person) => person.email).filter(Boolean));
  const extraAddresses = body.test ? [] : typed.filter((address) => !recipientEmails.has(address));

  if (body.preview) return NextResponse.json({ people: recipients.length + extraAddresses.length });

  const subject = str(body.subject).trim().slice(0, 200);
  const rawMessage = str(body.message).trim().slice(0, MAX_MESSAGE_HTML);
  const embeddedAction = extractMessageCta(rawMessage);
  const actionLabel = embeddedAction?.label.trim().slice(0, 80) || "";
  const actionHref = embeddedAction?.href.trim().slice(0, 500) || "";
  const plainMessage = messageHtmlToPlainText(rawMessage).slice(0, MAX_MESSAGE_TEXT);
  if (!subject || !plainMessage) return NextResponse.json({ error: "Add a subject and a message." }, { status: 400 });
  if (embeddedAction && (!actionLabel || !actionHref.startsWith("/") || actionHref.startsWith("//"))) return NextResponse.json({ error: "Complete the message button and use a Bantaba link beginning with /." }, { status: 400 });
  const messageHtml = buildMessageHtml(stripMessageCta(rawMessage), actionLabel, actionHref);
  const destination = actionHref || "/dashboard/notifications";
  const action = actionLabel || "Open Bantaba";
  const sendEmail = Boolean(body.email) || extraAddresses.length > 0;
  const sendInApp = Boolean(body.inApp);
  const sendBrowserPush = Boolean(body.push);
  if (!body.email && !sendInApp && !sendBrowserPush) return NextResponse.json({ error: "Choose email, in-app, push or a combination." }, { status: 400 });
  if (!recipients.length && !extraAddresses.length) return NextResponse.json({ error: "Add at least one person." }, { status: 400 });

  const emails = [...new Set([...(body.email ? recipientEmails : []), ...extraAddresses])];
  const senderName = str(sender?.preferredName) || str(sender?.name) || "Bantaba";
  const createdAt = new Date().toISOString();
  let emailed = 0;
  let notified = 0;
  let pushed = 0;
  const problems: string[] = [];

  if (sendInApp && recipients.length) {
    try {
      await db.addMany("notifications", recipients.map((person) => ({
        uid: person.uid, type: "message", title: subject, body: plainMessage, href: destination, createdAt, readAt: null,
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
        await sendMany({ to: emails, subject, lines: [plainMessage, `From ${senderName}`], messageHtml, href: destination, action });
        emailed = emails.length;
      } catch (cause) {
        console.error("Unable to send email", cause);
        problems.push(`Email didn’t go through: ${resendReason(cause)}`);
      }
    }
  }

  if (sendBrowserPush && recipients.length) {
    if (!pushConfigured()) {
      problems.push("Push notifications aren’t set up yet.");
    } else {
      const results = await Promise.all(recipients.map((person) => sendPush(person.uid, {
        title: subject,
        body: plainMessage.slice(0, 240),
        url: destination,
        tag: "admin-message",
      })));
      pushed = results.reduce((total, result) => total + result.sent, 0);
      const failed = results.reduce((total, result) => total + result.failed, 0);
      if (failed) problems.push(`${failed} push ${failed === 1 ? "notification" : "notifications"} didn’t go through.`);
      else if (!pushed) problems.push("No recipients have push notifications enabled yet.");
    }
  }

  if ((notified || emailed || pushed) && !body.test) {
    const names = recipients.filter((person) => chosen.has(person.uid)).map((person) => person.name || person.email);
    const toLabel = [
      ...MESSAGE_GROUPS.filter((item) => groups.has(item.key)).map((item) => item.label),
      ...names,
      ...typed,
    ];
    await db.add("sentMessages", {
      subject, message: messageHtml, toLabel: toLabel.length > 4 ? `${toLabel.slice(0, 4).join(", ")} and ${toLabel.length - 4} more` : toLabel.join(", "),
      sentBy: account.uid, sentByName: senderName, createdAt,
      people: recipients.length + extraAddresses.length, emailed, notified, pushed,
    }).catch((cause) => console.error("Unable to record sent message", cause));
  }

  if (problems.length) return NextResponse.json({ error: problems.join(" "), notified, emailed, pushed }, { status: notified || emailed || pushed ? 207 : 502 });
  return NextResponse.json({ notified, emailed, pushed });
}

/** Resend's own explanation, e.g. an unverified domain, in plain words. */
function resendReason(cause: unknown): string {
  const text = cause instanceof Error ? cause.message : String(cause);
  try {
    const parsed = JSON.parse(text.slice(text.indexOf("{"))) as { message?: string };
    if (parsed.message) return parsed.message;
  } catch {
    // Not JSON; fall through.
  }
  return text.replace(/^Resend \d+:\s*/, "") || "unknown error";
}
