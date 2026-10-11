import { createSign } from "node:crypto";

process.loadEnvFile(".env.local");
const project = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const database = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || process.env.FIREBASE_FIRESTORE_DATABASE_ID || "bbdowa";
if (project !== "visualhqportfolio" || database !== "bbdowa") throw new Error("Refusing to migrate outside visualhqportfolio/bbdowa.");

const actions = {
  "timesheet-reminder": ["Open time tracker", "/dashboard/tracker"],
  "deadline-heads-up": ["Review my work", "/dashboard/work"],
  "task-follow-up": ["Review tasks", "/dashboard/work"],
  "document-reminder": ["Open documents", "/dashboard/documents"],
  "job-update": ["Open my jobs", "/dashboard/my-jobs"],
  "payment-update": ["View payments", "/dashboard/payments"],
  "service-notice": ["Open Bantaba", "/dashboard"],
  "general-announcement": ["Open Bantaba", "/dashboard"],
};

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
const field = (value) => ({ stringValue: String(value) });
const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const ctaPattern = /<p\b[^>]*data-message-cta=["']true["'][^>]*>[\s\S]*?<\/p>/gi;
const ensureHtml = (value) => /<[a-z][\s\S]*>/i.test(value.trim()) ? value.trim() : value.trim().split(/\n\s*\n/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("");
const buildHtml = (value, label, href) => `${ensureHtml(value).replace(ctaPattern, "").trim()}<p data-message-cta="true"><a data-message-button="true" href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>`;

for (const [key, [defaultLabel, defaultHref]] of Object.entries(actions)) {
  const response = await fetch(`${base}/${key}`, { headers });
  if (!response.ok) throw new Error(`Could not read ${key}: ${response.status}`);
  const document = await response.json();
  const fields = document.fields ?? {};
  const currentMessage = fields.message?.stringValue ?? "";
  if (!currentMessage.trim()) throw new Error(`Refusing to replace an empty message in ${key}.`);
  const actionLabel = fields.actionLabel?.stringValue || defaultLabel;
  const actionHref = fields.actionHref?.stringValue || defaultHref;
  const record = { message: buildHtml(currentMessage, actionLabel, actionHref), actionLabel, actionHref, updatedAt: new Date().toISOString() };
  const params = new URLSearchParams();
  Object.keys(record).forEach((name) => params.append("updateMask.fieldPaths", name));
  const update = await fetch(`${base}/${key}?${params}`, { method: "PATCH", headers, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(record).map(([name, value]) => [name, field(value)])) }) });
  if (!update.ok) throw new Error(`Could not update ${key}: ${update.status} ${await update.text()}`);
  console.log(`Migrated ${key}`);
}
