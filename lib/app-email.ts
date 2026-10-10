"use client";

// Asks the server (app/api/email) to send a transactional email about something
// that just happened. A failed email never blocks or fails the action.
// The returned promise resolves once the request is on its way (it's sent
// with keepalive), so callers that reload the page can await it first.
import { firebaseAuth } from "@/lib/firebase/client";

export type AppEmail =
  | { type: "welcome" }
  | { type: "task"; taskId: string; uids?: string[] }
  | { type: "job"; jobSlug: string; uids: string[] }
  | { type: "document"; documentId: string }
  | { type: "invoice"; invoiceId: string }
  | { type: "invite"; email: string };

export async function sendAppEmail(email: AppEmail): Promise<void> {
  try {
    const token = await firebaseAuth.currentUser?.getIdToken();
    if (!token) return;
    void fetch("/api/email", {
      method: "POST",
      keepalive: true,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(email),
    })
      .then(async (response) => { if (!response.ok) console.error("Email not sent", await response.text()); })
      .catch((cause) => console.error("Email not sent", cause));
  } catch (cause) {
    console.error("Email not sent", cause);
  }
}
