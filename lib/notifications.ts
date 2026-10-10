// Notifications: a weekly and a monthly summary per person, nothing more.
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

export type NotificationSettings = {
  digests: Record<DigestKey, Channels>;
  /** What the summaries cover. */
  sections: Record<DigestSection, boolean>;
};

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
};

/** Stored settings merged over the defaults. */
export function withDefaults(stored: Partial<NotificationSettings> | undefined | null): NotificationSettings {
  return {
    digests: {
      weekly: { ...DEFAULT_NOTIFICATION_SETTINGS.digests.weekly, ...(stored?.digests?.weekly ?? {}) },
      monthly: { ...DEFAULT_NOTIFICATION_SETTINGS.digests.monthly, ...(stored?.digests?.monthly ?? {}) },
    },
    sections: { ...DEFAULT_NOTIFICATION_SETTINGS.sections, ...(stored?.sections ?? {}) },
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
