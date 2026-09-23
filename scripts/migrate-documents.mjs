// One-time migration from contractTemplates and contracts to documents.
// Run with the service account configured in .env.local. The old collections
// are left intact for backup; the application no longer reads them.
import { createSign } from "node:crypto";

const projectId = process.env.FIREBASE_PROJECT_ID;
const databaseId = process.env.FIREBASE_FIRESTORE_DATABASE_ID || "bbdowa";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) throw new Error("Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY before migrating.");

const encode = (input) => Buffer.from(JSON.stringify(input)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const assertion = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
  iss: clientEmail, scope: "https://www.googleapis.com/auth/datastore",
  aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
})}`;
const signer = createSign("RSA-SHA256");
signer.update(assertion);
const signedAssertion = `${assertion}.${signer.sign(privateKey).toString("base64url")}`;
const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: signedAssertion }),
});
if (!tokenResponse.ok) throw new Error(`Service account authentication failed: ${tokenResponse.status}`);
const { access_token: accessToken } = await tokenResponse.json();

const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents`;
const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

async function readCollection(name) {
  const result = [];
  let pageToken;
  do {
    const url = new URL(`${base}/${name}`);
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Reading ${name} failed: ${response.status} ${await response.text()}`);
    const page = await response.json();
    result.push(...(page.documents || []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return result;
}

function value(field) {
  if (!field) return null;
  if ("nullValue" in field) return null;
  if ("stringValue" in field) return field.stringValue;
  if ("timestampValue" in field) return field.timestampValue;
  if ("booleanValue" in field) return field.booleanValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return field.doubleValue;
  if ("arrayValue" in field) return (field.arrayValue.values || []).map(value);
  if ("mapValue" in field) return Object.fromEntries(Object.entries(field.mapValue.fields || {}).map(([key, nested]) => [key, value(nested)]));
  throw new Error(`Unexpected Firestore field value: ${JSON.stringify(field)}`);
}

function entry(record) {
  return { id: record.name.split("/").at(-1), ...Object.fromEntries(Object.entries(record.fields || {}).map(([key, field]) => [key, value(field)])) };
}

function field(value) {
  return value === null || value === undefined ? { nullValue: null } : { stringValue: String(value) };
}

async function createDocument(id, data) {
  const url = `${base}/documents/${encodeURIComponent(id)}?currentDocument.exists=false`;
  const response = await fetch(url, { method: "PATCH", headers, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([key, item]) => [key, field(item)])) }) });
  if (response.ok) return "created";
  if (response.status === 409 || response.status === 412) return "existing";
  throw new Error(`Writing documents/${id} failed: ${response.status} ${await response.text()}`);
}

const [templates, contracts, users] = await Promise.all([
  readCollection("contractTemplates"), readCollection("contracts"), readCollection("users"),
]);
const people = users.map((record) => ({
  uid: value(record.fields?.uid), slug: value(record.fields?.slug), name: value(record.fields?.name),
}));
const prepared = [];
for (const record of templates.map(entry)) {
  prepared.push({ id: `template-${record.id}`, data: {
    title: record.title, body: record.body, status: "draft",
    createdBy: record.createdBy, createdByName: record.createdByName ?? null,
    createdAt: record.createdAt, updatedAt: record.updatedAt ?? record.createdAt,
    assignedTo: null, assignedToName: null, signedAt: null, signedName: null, sourceDocumentId: null,
  } });
}
const unlinked = [];
for (const record of contracts.map(entry)) {
  const person = people.find((candidate) => candidate.uid === record.assignedTo || candidate.slug === record.assignedTo);
  if (!person?.uid) unlinked.push(`${record.id}: ${record.assignedTo ?? "missing assignee"}`);
  prepared.push({ id: `agreement-${record.id}`, data: {
    title: record.title, body: record.body,
    status: record.status === "signed" ? "signed" : "pending_signature",
    createdBy: record.createdBy, createdByName: record.createdByName ?? null,
    createdAt: record.createdAt, updatedAt: record.updatedAt ?? record.createdAt,
    assignedTo: person?.uid ?? record.assignedTo ?? null, assignedToName: record.assignedToName ?? person?.name ?? null,
    signedAt: record.signedAt ?? null, signedName: record.signedName ?? null,
    sourceDocumentId: record.documentId ? `template-${record.documentId}` : null,
  } });
}
if (process.argv.includes("--dry-run")) {
  console.log(`Ready to migrate ${templates.length} draft documents and ${contracts.length} sent documents. ${unlinked.length} assignee records need a linked sign-in account before signing.`);
  process.exit(0);
}

let created = 0;
let existing = 0;
for (const item of prepared) {
  const result = await createDocument(item.id, item.data);
  if (result === "created") created++;
  else existing++;
}
console.log(`Documents migrated: ${created} created, ${existing} already present. Old collections remain as backup.`);
if (unlinked.length) console.log(`Pending staff reassignment after creator sign-in: ${unlinked.join(", ")}`);
