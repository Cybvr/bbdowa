// Server-only helpers for the email routes (app/api/email, app/api/message):
// checking a Firebase ID token, reading and writing Firestore as the signed-in
// person (so security rules still apply), and sending email through Resend.
import "server-only";
import { createVerify } from "node:crypto";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const DATABASE_ID = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || "bbdowa";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

export type Fields = Record<string, unknown>;
export type Doc = Fields & { id: string };

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
function encode(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  return { stringValue: String(value) };
}

const toFields = (data: Fields) => Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encode(value)]));

export function firestoreAs(idToken: string) {
  const headers = { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" };
  return {
    async list(collection: string): Promise<Doc[]> {
      const result: Doc[] = [];
      let pageToken = "";
      do {
        const url = new URL(`${BASE}/${collection}`);
        url.searchParams.set("pageSize", "1000");
        if (pageToken) url.searchParams.set("pageToken", pageToken);
        const response = await fetch(url, { headers, cache: "no-store" });
        if (!response.ok) throw new Error(`Reading ${collection} failed: ${response.status}`);
        const page = (await response.json()) as { documents?: { name: string; fields?: Record<string, Record<string, unknown>> }[]; nextPageToken?: string };
        result.push(...(page.documents ?? []).map(toDoc));
        pageToken = page.nextPageToken ?? "";
      } while (pageToken);
      return result;
    },
    async add(collection: string, data: Fields): Promise<void> {
      const response = await fetch(`${BASE}/${collection}`, { method: "POST", headers, body: JSON.stringify({ fields: toFields(data) }) });
      if (!response.ok) throw new Error(`Adding to ${collection} failed: ${response.status} ${await response.text()}`);
    },
    /** Adds many documents, up to 400 per request. */
    async addMany(collection: string, rows: Fields[]): Promise<void> {
      const root = BASE.replace(/^https:\/\/firestore\.googleapis\.com\/v1\//, "");
      for (let start = 0; start < rows.length; start += 400) {
        const writes = rows.slice(start, start + 400).map((data) => ({
          update: { name: `${root}/${collection}/${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`, fields: toFields(data) },
          currentDocument: { exists: false },
        }));
        const response = await fetch(`${BASE}:commit`, { method: "POST", headers, body: JSON.stringify({ writes }) });
        if (!response.ok) throw new Error(`Writing ${collection} failed: ${response.status} ${await response.text()}`);
      }
    },
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

/** The account behind a valid Firebase ID token, or null. */
const CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
let certCache: { certs: Record<string, string>; expires: number } | null = null;

async function googleCerts(): Promise<Record<string, string>> {
  if (certCache && certCache.expires > Date.now()) return certCache.certs;
  const response = await fetch(CERTS_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Couldn't load sign-in certificates: ${response.status}`);
  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "")?.[1] ?? 3600);
  certCache = { certs: (await response.json()) as Record<string, string>, expires: Date.now() + maxAge * 1000 };
  return certCache.certs;
}

/**
 * The account behind a valid Firebase ID token, or null. Checks the token's
 * signature against Google's public certificates, so no API key is needed.
 */
export async function verifyIdToken(idToken: string): Promise<{ uid: string; email: string | null } | null> {
  try {
    const [headerPart, payloadPart, signaturePart] = idToken.split(".");
    if (!headerPart || !payloadPart || !signaturePart) return null;
    const header = JSON.parse(Buffer.from(headerPart, "base64url").toString()) as { alg?: string; kid?: string };
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString()) as {
      aud?: string; iss?: string; sub?: string; exp?: number; iat?: number; email?: string;
    };
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== "RS256" || !header.kid) return null;
    if (payload.aud !== PROJECT_ID || payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`) return null;
    if (!payload.sub || !payload.exp || payload.exp < now || (payload.iat ?? 0) > now + 300) return null;
    const cert = (await googleCerts())[header.kid];
    if (!cert) return null;
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${headerPart}.${payloadPart}`);
    if (!verifier.verify(cert, Buffer.from(signaturePart, "base64url"))) return null;
    return { uid: payload.sub, email: payload.email ?? null };
  } catch (cause) {
    console.error("Unable to verify sign-in", cause);
    return null;
  }
}

export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

export type Email = { to: string[]; subject: string; lines: string[]; href: string; action: string };

export function emailHtml(email: Email): string {
  const site = (process.env.SITE_URL || "").replace(/\/$/, "");
  const link = site && email.href ? `<p><a href="${escapeHtml(site + email.href)}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">${escapeHtml(email.action)}</a></p>` : "";
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111"><p><strong>${escapeHtml(email.subject)}</strong></p>${email.lines.map((line) => `<p>${escapeHtml(line).replace(/\n/g, "<br>")}</p>`).join("")}${link}<p style="color:#888;font-size:12px">Sent by Bantaba.</p></div>`;
}

export async function send(email: Email) {
  const html = emailHtml(email);
  for (const to of email.to) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject: email.subject, html }),
    });
    if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
  }
}


/** Sends one email per address through Resend's batch endpoint, 100 at a time. */
export async function sendMany(email: Email) {
  const html = emailHtml(email);
  for (let start = 0; start < email.to.length; start += 100) {
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(email.to.slice(start, start + 100).map((to) => ({ from: process.env.EMAIL_FROM, to, subject: email.subject, html }))),
    });
    if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
  }
}
