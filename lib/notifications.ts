// Notifications: a weekly and a monthly summary per person, plus a few
// instant emails for things people need to act on (a new task, a document to
// sign, …), sent by app/api/email.
//
// Admins choose which summaries go out, how (in-app, email) and what they
// cover (Admin → Notifications). Settings live in `settings/notifications`.
// A daily job (scripts/send-reminders.mjs, GitHub Actions, 9am Lagos time)
// sends the weekly summary on Mondays and the monthly one on the 1st. In-app
// copies go to `notifications`; everyone sees theirs at /dashboard/notifications.
//
// Keep the keys and defaults here in step with scripts/send-reminders.mjs.

export const NOTIFICATION_COLLECTION = "notifications";
export const NOTIFICATION_SETTINGS_DOC = { collection: "settings", id: "notifications" } as const;

export type DigestKey = "weekly" | "monthly";
export type DigestSection = "tasks" | "jobs" | "tracker";
export type Channels = { inApp: boolean; email: boolean };
/** Emails the app sends straight away when something happens (app/api/email). */
export type InstantEmailKey = "task" | "job" | "document" | "invoice" | "invite";

export type NotificationSettings = {
  digests: Record<DigestKey, Channels>;
  /** What the summaries cover. */
  sections: Record<DigestSection, boolean>;
  /** Which instant emails are on. */
  instant: Record<InstantEmailKey, boolean>;
};

export const INSTANT_EMAILS: { key: InstantEmailKey; label: string; description: string }[] = [
  { key: "task", label: "New task", description: "To the people a task is given to." },
  { key: "job", label: "Added to a job", description: "To people added to a job's team." },
  { key: "document", label: "Document to sign", description: "To the person a document is sent to." },
  { key: "invoice", label: "Invoice sent", description: "To the client's portal users." },
  { key: "invite", label: "Invite", description: "To new people and client colleagues, asking them to sign in." },
];

export const DIGESTS: { key: DigestKey; label: string; description: string }[] = [
  { key: "weekly", label: "Weekly summary", description: "Mondays at 9am: open and overdue tasks, what's due this week, jobs ending soon, last week's tracked time." },
  { key: "monthly", label: "Monthly summary", description: "The 1st of each month at 9am: last month's tracked time, tasks finished, and what's still open." },
];

export const SECTIONS: { key: DigestSection; label: string }[] = [
  { key: "tasks", label: "Tasks" },
  { key: "jobs", label: "Jobs" },
  { key: "tracker", label: "Tracker" },
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  digests: {
    weekly: { inApp: true, email: true },
    monthly: { inApp: true, email: true },
  },
  sections: { tasks: true, jobs: true, tracker: true },
  instant: { task: true, job: true, document: true, invoice: true, invite: true },
};

/** Stored settings merged over the defaults. */
export function withDefaults(stored: Partial<NotificationSettings> | undefined | null): NotificationSettings {
  return {
    digests: {
      weekly: { ...DEFAULT_NOTIFICATION_SETTINGS.digests.weekly, ...(stored?.digests?.weekly ?? {}) },
      monthly: { ...DEFAULT_NOTIFICATION_SETTINGS.digests.monthly, ...(stored?.digests?.monthly ?? {}) },
    },
    sections: { ...DEFAULT_NOTIFICATION_SETTINGS.sections, ...(stored?.sections ?? {}) },
    instant: { ...DEFAULT_NOTIFICATION_SETTINGS.instant, ...(stored?.instant ?? {}) },
  };
}

export type AppNotification = {
  id: string;
  uid: string;
  type: DigestKey;
  title: string;
  /** One line per point, separated by newlines. */
  body: string;
  /** Dashboard path to open. */
  href: string | null;
  createdAt: string;
  readAt: string | null;
};
