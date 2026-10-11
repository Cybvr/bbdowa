// Server-only. Sends through Resend's REST API so no extra package is needed.
// Set RESEND_API_KEY and EMAIL_FROM (e.g. "Bantaba <hello@yourdomain.com>") in the environment.
// EMAIL_REPLY_TO is optional.

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag?: string;
};

export type SendResult = { ok: true; id: string | null } | { ok: false; reason: string };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { ok: false, reason: "Email isn't configured (RESEND_API_KEY and EMAIL_FROM)." };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
        ...(email.tag ? { tags: [{ name: "event", value: email.tag.replace(/[^a-zA-Z0-9_-]/g, "_") }] } : {}),
      }),
    });
    const data = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (!response.ok) {
      console.error("Resend rejected an email", response.status, data);
      return { ok: false, reason: data?.message ?? `Resend responded ${response.status}` };
    }
    return { ok: true, id: data?.id ?? null };
  } catch (cause) {
    console.error("Unable to reach Resend", cause);
    return { ok: false, reason: "Couldn't reach Resend." };
  }
}
