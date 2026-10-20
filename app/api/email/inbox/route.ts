import { NextResponse } from "next/server";
import { firestoreAs, verifyIdToken } from "@/lib/server/email";
import { richTextToPlainText } from "@/lib/rich-text";
import type { ReceivedEmailDetail, ReceivedEmailSummary } from "@/lib/email/received-email";

export const runtime = "nodejs";

const str = (value: unknown) => typeof value === "string" ? value : "";
const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const validId = (value: string) => /^[a-f0-9-]{36}$/i.test(value);

export async function GET(request: Request) {
  const idToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const account = idToken ? await verifyIdToken(idToken) : null;
  if (!account) return NextResponse.json({ error: "Sign in to read email." }, { status: 401 });

  try {
    const db = firestoreAs(idToken);
    const profile = await db.get(`users/${account.uid}`) ?? (await db.where("users", [["uid", account.uid]]))[0];
    if (profile?.role !== "admin" && profile?.role !== "manager") {
      return NextResponse.json({ error: "Only admins and managers can read this inbox." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Couldn’t verify email access. Try again." }, { status: 503 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "The Resend API key is unavailable to this app." }, { status: 503 });

  const params = new URL(request.url).searchParams;
  const id = params.get("id") ?? "";
  const after = params.get("after") ?? "";
  if ((id && !validId(id)) || (after && !validId(after))) {
    return NextResponse.json({ error: "Invalid email ID." }, { status: 400 });
  }

  const url = new URL(id ? `https://api.resend.com/emails/receiving/${encodeURIComponent(id)}` : "https://api.resend.com/emails/receiving");
  if (!id) {
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);
  }

  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" });
    if (!response.ok) {
      const error = response.status === 401 || response.status === 403
        ? "The Resend API key cannot read received email. Check its permissions."
        : `Couldn’t load received email (Resend ${response.status}).`;
      return NextResponse.json({ error }, { status: response.status === 404 ? 404 : 502 });
    }

    const data = await response.json() as Record<string, unknown>;
    if (id) {
      const attachments = Array.isArray(data.attachments) ? data.attachments.map((item) => item as Record<string, unknown>) : [];
      const detail: ReceivedEmailDetail = {
        id: str(data.id),
        from: str(data.from),
        to: strings(data.to),
        subject: str(data.subject),
        createdAt: str(data.created_at),
        attachmentCount: attachments.length,
        body: (str(data.text) || richTextToPlainText(str(data.html))).slice(0, 100_000),
        cc: strings(data.cc),
        replyTo: strings(data.reply_to),
        attachments: attachments.map((item) => ({ id: str(item.id), filename: str(item.filename) })).filter((item) => item.id),
      };
      return NextResponse.json({ email: detail }, { headers: { "Cache-Control": "no-store" } });
    }

    const items = Array.isArray(data.data) ? data.data.map((item) => item as Record<string, unknown>) : [];
    const emails: ReceivedEmailSummary[] = items.map((item) => ({
      id: str(item.id),
      from: str(item.from),
      to: strings(item.to),
      subject: str(item.subject),
      preview: (str(item.text) || richTextToPlainText(str(item.html))).slice(0, 300),
      createdAt: str(item.created_at),
      attachmentCount: Array.isArray(item.attachments) ? item.attachments.length : 0,
    })).filter((item) => item.id);
    return NextResponse.json({ emails, hasMore: data.has_more === true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Couldn’t reach Resend. Try again later." }, { status: 502 });
  }
}
