// Reminders job, run at 9am and 5pm Lagos time by .github/workflows/reminders.yml.
//
// Reads tasks, jobs and tracked time, works out who needs a reminder, then
// writes in-app notifications and sends emails according to the admin
// settings (settings/notifications, edited at Admin → Notifications).
// Each reminder is sent once: a `reminderLog/{key}` record is created first
// and a reminder whose record already exists is skipped.
//
// Env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY,
// optional FIREBASE_FIRESTORE_DATABASE_ID (default "bbdowa"),
// RESEND_API_KEY + EMAIL_FROM for email, SITE_URL for links in emails.
// Pass --dry-run to print what would be sent without writing anything.
import { createSign } from "node:crypto";

const DRY_RUN = process.argv.includes("--dry-run");
const projectId = process.env.FIREBASE_PROJECT_ID;
const databaseId = process.env.FIREBASE_FIRESTORE_DATABASE_ID || "bbdowa";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const resendKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;
const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
if (!projectId || !clientEmail || !privateKey) throw new Error("Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.");

const TIME_ZONE = "Africa/Lagos";
const DAY_MS = 86_400_000;

// Keep in step with lib/notifications.ts.
const DEFAULTS = {
  reminders: {
    taskAssigned: { inApp: true, email: true },
    taskDueSoon: { inApp: true, email: true },
    taskOverdue: { inApp: true, email: true },
    jobAssigned: { inApp: true, email: true },
    jobEndingSoon: { inApp: true, email: false },
    trackerRunningLong: { inApp: true, email: true },
    trackerNoTimeToday: { inApp: true, email: false },
  },
  taskDueSoonDays: 1,
  jobEndingSoonDays: 3,
  trackerRunningHours: 3,
  trackerNoTimeHour: 17,
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
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111"><p><strong>${escapeHtml(title)}</strong></p>${body ? `<p>${escapeHtml(body)}</p>` : ""}${link}<p style="color:#888;font-size:12px">You're getting this because reminders are on for your team.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error(`Email to ${to} failed: ${response.status} ${await response.text()}`);
}

// --- Dates ----------------------------------------------------------------

const now = Date.now();
const lagosParts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "short",
}).formatToParts(new Date(now)).map((part) => [part.type, part.value]));
const today = `${lagosParts.year}-${lagosParts.month}-${lagosParts.day}`;
const lagosHour = Number(lagosParts.hour);
const isWeekday = !["Sat", "Sun"].includes(lagosParts.weekday);
const lagosDate = (iso) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date(iso));
/** Whole days from today (Lagos) to a yyyy-mm-dd date; negative when past. */
const daysUntil = (date) => Math.round((Date.parse(`${date.slice(0, 10)}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS);
const isRecent = (iso, ms) => Boolean(iso) && now - Date.parse(iso) <= ms;

function elapsedMs(entry) {
  const start = Date.parse(entry.startedAt);
  const end = entry.endedAt ? Date.parse(entry.endedAt) : now;
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  const pauseStart = entry.pausedAt ? Date.parse(entry.pausedAt) : Number.NaN;
  return Math.max(0, end - start - (entry.pausedMs ?? 0) - (Number.isNaN(pauseStart) ? 0 : Math.max(0, end - pauseStart)));
}

// --- Work out reminders ---------------------------------------------------

const stored = await readDocument("settings/notifications");
const settings = { ...DEFAULTS, ...(stored ?? {}), reminders: { ...DEFAULTS.reminders } };
for (const key of Object.keys(DEFAULTS.reminders)) settings.reminders[key] = { ...DEFAULTS.reminders[key], ...(stored?.reminders?.[key] ?? {}) };

const migration = await readDocument("migrations/campaignsToJobs");
const jobsCollectionName = migration?.done === true ? "jobs" : "campaigns";
const [users, tasks, jobs, jobTerms, timeEntries] = await Promise.all([
  readCollection("users"), readCollection("creatorTasks"), readCollection(jobsCollectionName),
  readCollection("jobTerms"), readCollection("timeEntries"),
]);
const emailByUid = new Map(users.filter((user) => user.uid && user.email).map((user) => [user.uid, user.email]));

/** @type {{ key: string; type: string; uid: string; title: string; body: string; href: string }[]} */
const reminders = [];
const add = (type, key, uid, title, body, href) => {
  const channels = settings.reminders[type];
  if (uid && (channels?.inApp || channels?.email)) reminders.push({ type, key: `${type}--${key}`, uid, title, body, href });
};

// Tasks
for (const task of tasks) {
  if (task.status === "done") continue;
  const uids = [...new Set([...(task.assigneeUids ?? []), task.assignedTo].filter(Boolean))];
  const title = task.title || "Untitled task";
  for (const uid of uids) {
    if (isRecent(task.updatedAt || task.createdAt, 2 * DAY_MS)) {
      add("taskAssigned", `${task.id}--${uid}`, uid, `New task: ${title}`, task.jobName ? `For ${task.jobName}.` : "", "/dashboard/my-jobs/tasks");
    }
    if (!task.dueDate) continue;
    const days = daysUntil(task.dueDate);
    if (days >= 0 && days <= settings.taskDueSoonDays) {
      add("taskDueSoon", `${task.id}--${uid}--${task.dueDate}`, uid, `${title} is due ${days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}`, task.jobName ? `For ${task.jobName}.` : "", "/dashboard/my-jobs/tasks");
    } else if (days < 0) {
      add("taskOverdue", `${task.id}--${uid}--${task.dueDate}`, uid, `${title} is overdue`, `It was due ${task.dueDate}.`, "/dashboard/my-jobs/tasks");
    }
  }
}

// Jobs
const jobBySlug = new Map(jobs.map((job) => [job.slug || job.id, job]));
for (const terms of jobTerms) {
  const job = jobBySlug.get(terms.id);
  if (!job) continue;
  const status = job.status === "completed" || job.status === "archived" || job.status === "pitch" ? "inactive" : "active";
  if (status !== "active") continue;
  const name = job.title || job.campaign || job.name || "a job";
  const uids = [...new Set([terms.assignedTo, ...(terms.teamUids ?? [])].filter(Boolean))];
  for (const uid of uids) {
    if (isRecent(terms.updatedAt, 2 * DAY_MS)) {
      add("jobAssigned", `${terms.id}--${uid}`, uid, `You've been added to ${name}`, "", `/dashboard/my-jobs/${encodeURIComponent(terms.id)}`);
    }
    if (job.endDate) {
      const days = daysUntil(job.endDate);
      if (days >= 0 && days <= settings.jobEndingSoonDays) {
        add("jobEndingSoon", `${terms.id}--${uid}--${job.endDate.slice(0, 10)}`, uid, `${name} ends ${days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}`, "", `/dashboard/my-jobs/${encodeURIComponent(terms.id)}`);
      }
    }
  }
}

// Tracker
for (const entry of timeEntries) {
  if (entry.endedAt || entry.pausedAt) continue;
  const hours = elapsedMs(entry) / 3_600_000;
  if (hours >= settings.trackerRunningHours) {
    add("trackerRunningLong", entry.id, entry.uid, `Timer still running: ${entry.activity || "activity"}`, `It has run for ${Math.floor(hours)} hours. Stop it if you're done.`, "/dashboard/tracker");
  }
}
if (isWeekday && lagosHour >= settings.trackerNoTimeHour) {
  const trackers = new Set(timeEntries.filter((entry) => isRecent(entry.startedAt, 14 * DAY_MS)).map((entry) => entry.uid));
  const activeToday = new Set(timeEntries.filter((entry) => !entry.endedAt || lagosDate(entry.startedAt) === today).map((entry) => entry.uid));
  for (const uid of trackers) {
    if (!activeToday.has(uid)) add("trackerNoTimeToday", `${uid}--${today}`, uid, "No time logged today", "Add what you worked on before you finish.", "/dashboard/tracker");
  }
}

// --- Send -----------------------------------------------------------------

let sentInApp = 0;
let sentEmail = 0;
let skipped = 0;
const failures = [];
for (const reminder of reminders) {
  const channels = settings.reminders[reminder.type];
  const email = channels.email && resendKey && emailFrom ? emailByUid.get(reminder.uid) : null;
  if (DRY_RUN) {
    console.log(`[dry run] ${reminder.key} → ${reminder.uid}${channels.inApp ? " in-app" : ""}${email ? ` email:${email}` : ""}: ${reminder.title}`);
    continue;
  }
  const createdAt = new Date().toISOString();
  if (!await createOnce(`reminderLog/${encodeURIComponent(reminder.key)}`, { uid: reminder.uid, type: reminder.type, createdAt })) {
    skipped++;
    continue;
  }
  try {
    if (channels.inApp) {
      await addDocument("notifications", { uid: reminder.uid, type: reminder.type, title: reminder.title, body: reminder.body, href: reminder.href, createdAt, readAt: null });
      sentInApp++;
    }
    if (email) {
      await sendEmail(email, reminder.title, reminder.body, reminder.href);
      sentEmail++;
    }
  } catch (cause) {
    failures.push(`${reminder.key}: ${cause.message}`);
  }
}

// Housekeeping: drop notifications after 30 days and send-once records after 60.
if (!DRY_RUN) {
  const [notifications, log] = await Promise.all([readCollection("notifications"), readCollection("reminderLog")]);
  for (const item of notifications) if (!isRecent(item.createdAt, 30 * DAY_MS)) await deleteDocument(`notifications/${item.id}`);
  for (const item of log) if (!isRecent(item.createdAt, 60 * DAY_MS)) await deleteDocument(`reminderLog/${encodeURIComponent(item.id)}`);
}

if (!resendKey || !emailFrom) console.log("Email is not set up (RESEND_API_KEY / EMAIL_FROM missing); only in-app reminders were sent.");
console.log(`Reminders: ${reminders.length} due, ${sentInApp} in-app, ${sentEmail} emails, ${skipped} already sent.`);
if (failures.length) {
  console.error(`Failed:\n${failures.join("\n")}`);
  process.exit(1);
}
