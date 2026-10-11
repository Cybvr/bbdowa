// Server-only Web Push sender. Subscriptions are stored in Firestore by the
// browser and read here with the Firebase service account.

import { createSign } from "node:crypto";
import webPush, { type PushSubscription } from "web-push";

type StoredSubscription = PushSubscription & { id: string };
export type PushPayload = { title: string; body: string; url: string; tag?: string };
export type PushResult = { sent: number; failed: number; configured: boolean };

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

function config() {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    databaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || "bbdowa",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
    publicKey: process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "",
    privatePushKey: process.env.WEB_PUSH_PRIVATE_KEY || "",
    subject: process.env.WEB_PUSH_SUBJECT || `mailto:${process.env.EMAIL_REPLY_TO || "notifications@bbdowa.com"}`,
  };
}

export function pushConfigured(): boolean {
  const value = config();
  return Boolean(value.projectId && value.clientEmail && value.privateKey && value.publicKey && value.privatePushKey && value.subject);
}

async function accessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) return cachedAccessToken.value;
  const { clientEmail, privateKey } = config();
  const encode = (input: object) => Buffer.from(JSON.stringify(input)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const assertion = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signer = createSign("RSA-SHA256");
  signer.update(assertion);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${assertion}.${signer.sign(privateKey).toString("base64url")}`,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Push service authentication failed (${response.status}).`);
  const data = (await response.json()) as { access_token: string; expires_in?: number };
  cachedAccessToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return data.access_token;
}

function firestoreBase(): string {
  const { projectId, databaseId } = config();
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents`;
}

function stringField(value: unknown): string {
  if (!value || typeof value !== "object" || !("stringValue" in value)) return "";
  return String((value as { stringValue?: unknown }).stringValue ?? "");
}

async function subscriptionsFor(uid: string): Promise<StoredSubscription[]> {
  const token = await accessToken();
  const response = await fetch(`${firestoreBase()}:runQuery`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "pushSubscriptions" }],
        where: { fieldFilter: { field: { fieldPath: "uid" }, op: "EQUAL", value: { stringValue: uid } } },
        limit: 20,
      },
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Reading push subscriptions failed (${response.status}).`);
  const rows = (await response.json()) as Array<{ document?: { name: string; fields?: Record<string, unknown> } }>;
  return rows.flatMap((row) => {
    const document = row.document;
    const fields = document?.fields;
    if (!document || !fields) return [];
    const keys = fields.keys && typeof fields.keys === "object" && "mapValue" in fields.keys
      ? ((fields.keys as { mapValue?: { fields?: Record<string, unknown> } }).mapValue?.fields ?? {})
      : {};
    const endpoint = stringField(fields.endpoint);
    const auth = stringField(keys.auth);
    const p256dh = stringField(keys.p256dh);
    if (!endpoint || !auth || !p256dh) return [];
    return [{ id: document.name.split("/").pop() ?? "", endpoint, keys: { auth, p256dh } }];
  });
}

async function removeSubscription(id: string): Promise<void> {
  if (!id) return;
  const token = await accessToken();
  await fetch(`${firestoreBase()}/pushSubscriptions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function sendPush(uid: string, payload: PushPayload): Promise<PushResult> {
  if (!pushConfigured()) return { sent: 0, failed: 0, configured: false };
  const { subject, publicKey, privatePushKey } = config();
  webPush.setVapidDetails(subject, publicKey, privatePushKey);
  const subscriptions = await subscriptionsFor(uid);
  const results = await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification(subscription, JSON.stringify(payload), { TTL: 60 * 60 * 24, urgency: "normal" });
      return true;
    } catch (cause) {
      const statusCode = typeof cause === "object" && cause && "statusCode" in cause ? Number(cause.statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) await removeSubscription(subscription.id);
      else console.error("Unable to send a browser notification", cause);
      return false;
    }
  }));
  return { sent: results.filter(Boolean).length, failed: results.filter((sent) => !sent).length, configured: true };
}
