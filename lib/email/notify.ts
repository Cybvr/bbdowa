import { firebaseAuth } from "@/lib/firebase/client";

export type NotifyEvent =
  | { event: "task.assigned"; id: string; uids?: string[] }
  | { event: "document.sent"; id: string }
  | { event: "document.signed"; id: string }
  | { event: "appraisal.assigned"; id: string }
  | { event: "appraisal.submitted"; id: string }
  | { event: "invoice.sent"; id: string }
  | { event: "payment.paid"; id: string }
  | { event: "job.assigned"; id: string; uids: string[] }
  | { event: "message.sent"; id: string }
  | { event: "client.invite"; email: string }
  | { event: "welcome" }
  | { event: "test" };

/**
 * Tells the server something happened so it can email the right people. Fire and
 * forget: it never throws, so a mail problem can't break the action that caused it.
 * Returns whether the server accepted it, for the one place that shows a result.
 */
export async function notify(payload: NotifyEvent): Promise<{ ok: boolean; sent: number; error?: string }> {
  try {
    const token = await firebaseAuth.currentUser?.getIdToken();
    if (!token) return { ok: false, sent: 0, error: "Not signed in." };
    const response = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    const data = (await response.json().catch(() => null)) as { sent?: number; error?: string } | null;
    return response.ok ? { ok: true, sent: data?.sent ?? 0 } : { ok: false, sent: 0, error: data?.error ?? `Email failed (${response.status}).` };
  } catch (cause) {
    console.warn("Unable to send notification", cause);
    return { ok: false, sent: 0, error: "Couldn't reach the email service." };
  }
}
