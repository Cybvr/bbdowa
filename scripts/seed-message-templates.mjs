import { createSign } from "node:crypto";
import { TEMPLATE_DEFAULTS } from "../lib/email/template-definitions.ts";
import { buildMessageHtml, extractMessageCta } from "../lib/message-html.ts";

process.loadEnvFile(".env.local");
const project = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const database = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || process.env.FIREBASE_FIRESTORE_DATABASE_ID || "bbdowa";
if (project !== "visualhqportfolio" || database !== "bbdowa") throw new Error("Refusing to seed outside visualhqportfolio/bbdowa.");
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const email = process.env.FIREBASE_CLIENT_EMAIL;
if (!privateKey || !email) throw new Error("Firebase service-account credentials are missing.");
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const payload = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
const signer = createSign("RSA-SHA256"); signer.update(payload);
const auth = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${payload}.${signer.sign(privateKey).toString("base64url")}` }) });
if (!auth.ok) throw new Error(`Authentication failed: ${auth.status}`);
const { access_token: token } = await auth.json();
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/${database}/documents/messageTemplates`;
const field = (value) => typeof value === "boolean" ? { booleanValue: value } : Array.isArray(value) ? { arrayValue: { values: value.map(field) } } : { stringValue: String(value) };
for (const template of TEMPLATE_DEFAULTS) {
  const existing = await fetch(`${base}/${template.key}`, { headers });
  if (existing.ok) {
    if (template.kind !== "message") { console.log(`Preserved ${template.key}`); continue; }
    const document = await existing.json();
    const fields = document.fields ?? {};
    const currentMessage = fields.message?.stringValue || template.message;
    const embedded = extractMessageCta(currentMessage);
    const actionLabel = fields.actionLabel?.stringValue || embedded?.label || template.actionLabel || "";
    const actionHref = fields.actionHref?.stringValue || embedded?.href || template.actionHref || "";
    const record = {
      message: buildMessageHtml(currentMessage, actionLabel, actionHref),
      actionLabel,
      actionHref,
      updatedAt: new Date().toISOString(),
    };
    const params = new URLSearchParams();
    Object.keys(record).forEach((key) => params.append("updateMask.fieldPaths", key));
    const response = await fetch(`${base}/${template.key}?${params}`, { method: "PATCH", headers, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(record).map(([key, value]) => [key, field(value)])) }) });
    if (!response.ok) throw new Error(`Migration failed for ${template.key}: ${response.status} ${await response.text()}`);
    console.log(`Migrated ${template.key}`);
    continue;
  }
  if (existing.status !== 404) throw new Error(`Read failed: ${existing.status}`);
  const record = { ...template, updatedAt: new Date().toISOString() };
  const response = await fetch(`${base}?documentId=${template.key}`, { method: "POST", headers, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(record).map(([key, value]) => [key, field(value)])) }) });
  if (!response.ok && response.status !== 409) throw new Error(`Seed failed for ${template.key}: ${response.status}`);
  console.log(`${response.status === 409 ? "Preserved" : "Seeded"} ${template.key}`);
}
