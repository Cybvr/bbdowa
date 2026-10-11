// Notifications job, run daily at 9am Lagos time by .github/workflows/reminders.yml.
//
// Sends each person one weekly summary (Mondays) and one monthly summary
// (the 1st) covering their tasks, jobs and tracked time, according to the
// admin settings (settings/notifications, edited at Admin → Notifications).
// On other days it does nothing. Each summary is sent once: a
// `reminderLog/{key}` record is created first and skipped if it exists.
//
// Env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY,
// optional FIREBASE_FIRESTORE_DATABASE_ID (default "bbdowa"),
// RESEND_API_KEY + EMAIL_FROM for email, SITE_URL for links in emails.
// --dry-run prints what would be sent without writing anything.
// --weekly / --monthly sends that summary today regardless of the date.
import { createSign } from "node:crypto";
import webPush from "web-push";

const DRY_RUN = process.argv.includes("--dry-run");
const projectId = process.env.FIREBASE_PROJECT_ID;
const databaseId = process.env.FIREBASE_FIRESTORE_DATABASE_ID || "bbdowa";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const resendKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;
const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
const pushPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
const pushPrivateKey = process.env.WEB_PUSH_PRIVATE_KEY;
const pushSubject = process.env.WEB_PUSH_SUBJECT || `mailto:${process.env.EMAIL_REPLY_TO || "notifications@bbdowa.com"}`;
if (!projectId || !clientEmail || !privateKey) throw new Error("Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.");

const TIME_ZONE = "Africa/Lagos";
const DAY_MS = 86_400_000;

// Keep in step with lib/notifications.ts.
const DEFAULTS = {
  digests: { weekly: { inApp: true, email: true, push: true }, monthly: { inApp: true, email: true, push: true } },
  sections: { tasks: true, jobs: true, tracker: true },
};

// --- Firestore REST -------------------------------------------------------

async function accessToken() {
  const encode = (input) => Buffer.from(JSON.stringify(input)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const assertion = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: clientEmail, scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  })}`;
  const signer = createSign("RSA-SHA256");
  signer.update(assertion);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${assertion}.${signer.sign(privateKey).toString("base64url")}`,
    }),
  });
  if (!response.ok) throw new Error(`Service account authentication failed: ${response.status}`);
  return (await response.json()).access_token;
}

const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents`;
const headers = { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" };

function decode(field) {
  if (!field || "nullValue" in field) return null;
  if ("stringValue" in field) return field.stringValue;
  if ("timestampValue" in field) return field.timestampValue;
  if ("booleanValue" in field) return field.booleanValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return field.doubleValue;
  if ("arrayValue" in field) return (field.arrayValue.values || []).map(decode);
  if ("mapValue" in field) return Object.fromEntries(Object.entries(field.mapValue.fields || {}).map(([key, nested]) => [key, decode(nested)]));
  return null;
}

function encode(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  return { stringValue: String(value) };
}

const toRecord = (document) => ({
  id: document.name.split("/").at(-1),
  ...Object.fromEntries(Object.entries(document.fields || {}).map(([key, field]) => [key, decode(field)])),
});
const toFields = (data) => ({ fields: Object.fromEntries(Object.entries(data).map(([key, item]) => [key, encode(item)])) });

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
    result.push(...(page.documents || []).map(toRecord));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return result;
}

async function readDocument(path) {
  const response = await fetch(`${base}/${path}`, { headers });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Reading ${path} failed: ${response.status} ${await response.text()}`);
  return toRecord(await response.json());
}

/** Creates a document only if it doesn't exist. Returns false if it did. */
async function createOnce(path, data) {
  const response = await fetch(`${base}/${path}?currentDocument.exists=false`, { method: "PATCH", headers, body: JSON.stringify(toFields(data)) });
  if (response.ok) return true;
  if (response.status === 409 || response.status === 412) return false;
  throw new Error(`Writing ${path} failed: ${response.status} ${await response.text()}`);
}

async function addDocument(collection, data) {
  const response = await fetch(`${base}/${collection}`, { method: "POST", headers, body: JSON.stringify(toFields(data)) });
  if (!response.ok) throw new Error(`Adding to ${collection} failed: ${response.status} ${await response.text()}`);
}

async function deleteDocument(path) {
  const response = await fetch(`${base}/${path}`, { method: "DELETE", headers });
  if (!response.ok && response.status !== 404) throw new Error(`Deleting ${path} failed: ${response.status}`);
}

// --- Email ----------------------------------------------------------------

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

async function sendEmail(to, title, body, href) {
  const link = siteUrl && href ? `<p><a href="${escapeHtml(siteUrl + href)}">Open in Bantaba</a></p>` : "";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: emailFrom,
      to,
      subject: title,
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111"><p><strong>${escapeHtml(title)}</strong></p>${body ? `<p>${body.split("\n").map(escapeHtml).join("<br>")}</p>` : ""}${link}<p style="color:#888;font-size:12px">Your weekly and monthly summary from Bantaba.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error(`Email to ${to} failed: ${response.status} ${await response.text()}`);
}

async function sendBrowserPush(subscription, title, body, href, tag) {
  if (!pushPublicKey || !pushPrivateKey) return false;
  webPush.setVapidDetails(pushSubject, pushPublicKey, pushPrivateKey);
  try {
    await webPush.sendNotification(
      { endpoint: subscription.endpoint, keys: subscription.keys },
      JSON.stringify({ title, body, url: href, tag }),
      { TTL: 60 * 60 * 24, urgency: "normal" },
    );
    return true;
  } catch (cause) {
    if (cause?.statusCode === 404 || cause?.statusCode === 410) await deleteDocument(`pushSubscriptions/${encodeURIComponent(subscription.id)}`);
    else throw cause;
    return false;
  }
}

// --- Dates (Lagos time) --------------------------------------------------

const now = Date.now();
const lagosDate = (value) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date(value));
const today = lagosDate(now);
const addDays = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
const weekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 Sunday … 1 Monday
const runWeekly = process.argv.includes("--weekly") || weekday === 1;
const runMonthly = process.argv.includes("--monthly") || today.endsWith("-01");
if (!runWeekly && !runMonthly) {
  console.log(`Nothing to send on ${today}. Weekly goes out on Mondays, monthly on the 1st.`);
  process.exit(0);
}

const lastWeek = { from: addDays(today, -7), to: addDays(today, -1) };
const firstOfThisMonth = `${today.slice(0, 7)}-01`;
const lastMonthKey = addDays(firstOfThisMonth, -1).slice(0, 7);
const lastMonthName = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${lastMonthKey}-01T00:00:00Z`));
const inRange = (date, from, to) => Boolean(date) && date >= from && date <= to;

function elapsedMs(entry) {
  const start = Date.parse(entry.startedAt);
  const end = entry.endedAt ? Date.parse(entry.endedAt) : now;
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  const pauseStart = entry.pausedAt ? Date.parse(entry.pausedAt) : Number.NaN;
  return Math.max(0, end - start - (entry.pausedMs ?? 0) - (Number.isNaN(pauseStart) ? 0 : Math.max(0, end - pauseStart)));
}

function duration(ms) {
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

const plural = (count, word, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;
const listNames = (names) => (names.length > 3 ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more` : names.join(", "));

// --- Load -----------------------------------------------------------------

const stored = await readDocument("settings/notifications");
const settings = {
  digests: {
    weekly: { ...DEFAULTS.digests.weekly, ...(stored?.digests?.weekly ?? {}) },
    monthly: { ...DEFAULTS.digests.monthly, ...(stored?.digests?.monthly ?? {}) },
  },
  sections: { ...DEFAULTS.sections, ...(stored?.sections ?? {}) },
};

const migration = await readDocument("migrations/campaignsToJobs");
const jobsCollectionName = migration?.done === true ? "jobs" : "campaigns";
const [users, tasks, jobs, jobTerms, timeEntries, pushSubscriptions] = await Promise.all([
  readCollection("users"), readCollection("creatorTasks"), readCollection(jobsCollectionName),
  readCollection("jobTerms"), readCollection("timeEntries"), readCollection("pushSubscriptions"),
]);
const emailByUid = new Map(users.filter((user) => user.uid && user.email).map((user) => [user.uid, user.email]));
const pushByUid = new Map();
for (const subscription of pushSubscriptions) {
  if (!subscription.uid || !subscription.endpoint || !subscription.keys?.auth || !subscription.keys?.p256dh) continue;
  pushByUid.set(subscription.uid, [...(pushByUid.get(subscription.uid) ?? []), subscription]);
}

const tasksByUid = new Map();
for (const task of tasks) {
  for (const uid of new Set([...(task.assigneeUids ?? []), task.assignedTo].filter(Boolean))) {
    tasksByUid.set(uid, [...(tasksByUid.get(uid) ?? []), task]);
  }
}
const jobBySlug = new Map(jobs.map((job) => [job.slug || job.id, job]));
const jobsByUid = new Map();
for (const terms of jobTerms) {
  const job = jobBySlug.get(terms.id);
  if (!job || job.status === "completed" || job.status === "archived" || job.status === "pitch") continue;
  const named = { ...job, slug: terms.id, displayName: job.title || job.campaign || job.name || "Untitled job" };
  for (const uid of new Set([terms.assignedTo, ...(terms.teamUids ?? [])].filter(Boolean))) {
    jobsByUid.set(uid, [...(jobsByUid.get(uid) ?? []), named]);
  }
}
const entriesByUid = new Map();
for (const entry of timeEntries) entriesByUid.set(entry.uid, [...(entriesByUid.get(entry.uid) ?? []), entry]);
const everyone = new Set([...tasksByUid.keys(), ...jobsByUid.keys(), ...entriesByUid.keys()]);

// --- Build summaries --------------------------------------------------------

function weeklyLines(uid) {
  const lines = [];
  const myTasks = tasksByUid.get(uid) ?? [];
  const open = myTasks.filter((task) => task.status !== "done");
  if (settings.sections.tasks && open.length) {
    const overdue = open.filter((task) => task.dueDate && task.dueDate.slice(0, 10) < today);
    const dueThisWeek = open.filter((task) => inRange(task.dueDate?.slice(0, 10), today, addDays(today, 6)));
    lines.push(`Tasks: ${plural(open.length, "open task")}${overdue.length ? `, ${overdue.length} overdue` : ""}.`);
    if (dueThisWeek.length) lines.push(`Due this week: ${listNames(dueThisWeek.map((task) => task.title || "Untitled task"))}.`);
  }
  const myJobs = jobsByUid.get(uid) ?? [];
  if (settings.sections.jobs && myJobs.length) {
    const ending = myJobs.filter((job) => inRange(job.endDate?.slice(0, 10), today, addDays(today, 6)));
    lines.push(`Jobs: on ${plural(myJobs.length, "active job")}${ending.length ? `. Ending this week: ${listNames(ending.map((job) => job.displayName))}` : ""}.`);
  }
  const myEntries = entriesByUid.get(uid) ?? [];
  if (settings.sections.tracker && myEntries.length) {
    const ms = myEntries.filter((entry) => inRange(lagosDate(entry.startedAt), lastWeek.from, lastWeek.to)).reduce((total, entry) => total + elapsedMs(entry), 0);
    const running = myEntries.filter((entry) => !entry.endedAt);
    lines.push(`Tracker: ${duration(ms)} tracked last week${running.length ? `. ${plural(running.length, "timer")} still open` : ""}.`);
  }
  return lines;
}

function monthlyLines(uid) {
  const lines = [];
  const myEntries = entriesByUid.get(uid) ?? [];
  if (settings.sections.tracker && myEntries.length) {
    const ms = myEntries.filter((entry) => lagosDate(entry.startedAt).startsWith(lastMonthKey)).reduce((total, entry) => total + elapsedMs(entry), 0);
    lines.push(`Tracker: ${duration(ms)} tracked in ${lastMonthName}.`);
  }
  const myTasks = tasksByUid.get(uid) ?? [];
  if (settings.sections.tasks && myTasks.length) {
    const finished = myTasks.filter((task) => task.status === "done" && task.updatedAt && lagosDate(task.updatedAt).startsWith(lastMonthKey));
    const open = myTasks.filter((task) => task.status !== "done");
    const overdue = open.filter((task) => task.dueDate && task.dueDate.slice(0, 10) < today);
    lines.push(`Tasks: ${finished.length} finished last month, ${open.length} still open${overdue.length ? `, ${overdue.length} overdue` : ""}.`);
  }
  const myJobs = jobsByUid.get(uid) ?? [];
  if (settings.sections.jobs && myJobs.length) lines.push(`Jobs: on ${plural(myJobs.length, "active job")}.`);
  return lines;
}

const summaries = [];
for (const uid of everyone) {
  if (runWeekly && (settings.digests.weekly.inApp || settings.digests.weekly.email || settings.digests.weekly.push)) {
    const lines = weeklyLines(uid);
    if (lines.length) summaries.push({ type: "weekly", key: `weekly--${uid}--${today}`, uid, title: "Your week ahead", body: lines.join("\n") });
  }
  if (runMonthly && (settings.digests.monthly.inApp || settings.digests.monthly.email || settings.digests.monthly.push)) {
    const lines = monthlyLines(uid);
    if (lines.length) summaries.push({ type: "monthly", key: `monthly--${uid}--${lastMonthKey}`, uid, title: `Your ${lastMonthName} summary`, body: lines.join("\n") });
  }
}

// --- Send -----------------------------------------------------------------

let sentInApp = 0;
let sentEmail = 0;
let sentPush = 0;
let skipped = 0;
const failures = [];
for (const summary of summaries) {
  const channels = settings.digests[summary.type];
  const email = channels.email && resendKey && emailFrom ? emailByUid.get(summary.uid) : null;
  const subscriptions = channels.push && pushPublicKey && pushPrivateKey ? pushByUid.get(summary.uid) ?? [] : [];
  if (DRY_RUN) {
    console.log(`[dry run] ${summary.key}${channels.inApp ? " in-app" : ""}${email ? ` email:${email}` : ""}${subscriptions.length ? ` push:${subscriptions.length}` : ""}\n  ${summary.title}\n  ${summary.body.replace(/\n/g, "\n  ")}`);
    continue;
  }
  const createdAt = new Date().toISOString();
  if (!await createOnce(`reminderLog/${encodeURIComponent(summary.key)}`, { uid: summary.uid, type: summary.type, createdAt })) {
    skipped++;
    continue;
  }
  try {
    if (channels.inApp) {
      await addDocument("notifications", { uid: summary.uid, type: summary.type, title: summary.title, body: summary.body, href: "/dashboard/notifications", createdAt, readAt: null });
      sentInApp++;
    }
    if (email) {
      await sendEmail(email, summary.title, summary.body, "/dashboard/notifications");
      sentEmail++;
    }
    for (const subscription of subscriptions) {
      if (await sendBrowserPush(subscription, summary.title, summary.body, "/dashboard/notifications", summary.type)) sentPush++;
    }
  } catch (cause) {
    failures.push(`${summary.key}: ${cause.message}`);
  }
}

// Housekeeping: keep a year of notifications and send-once records.
if (!DRY_RUN) {
  const [notifications, log] = await Promise.all([readCollection("notifications"), readCollection("reminderLog")]);
  const yearAgo = now - 366 * DAY_MS;
  for (const item of notifications) if (Date.parse(item.createdAt) < yearAgo) await deleteDocument(`notifications/${item.id}`);
  for (const item of log) if (Date.parse(item.createdAt) < yearAgo) await deleteDocument(`reminderLog/${encodeURIComponent(item.id)}`);
}

if (!resendKey || !emailFrom) console.log("Email is not set up (RESEND_API_KEY / EMAIL_FROM missing); only in-app summaries were sent.");
if (!pushPublicKey || !pushPrivateKey) console.log("Browser push is not set up (NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY missing)." );
console.log(`Summaries: ${summaries.length} due, ${sentInApp} in-app, ${sentEmail} emails, ${sentPush} pushes, ${skipped} already sent.`);
if (failures.length) {
  console.error(`Failed:\n${failures.join("\n")}`);
  process.exit(1);
}
