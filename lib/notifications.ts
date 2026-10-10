// Reminders and notifications.
//
// Admins choose which reminders go out and how (Admin → Notifications). The
// settings live in `settings/notifications`. A job that runs at
// 9am and 5pm Lagos time (scripts/send-reminders.mjs, GitHub Actions) checks tasks, jobs and
// the tracker, writes in-app notifications to `notifications` and sends
// emails. Each person reads and marks their own notifications as read.
//
// Keep the keys and defaults here in step with scripts/send-reminders.mjs.

export const NOTIFICATION_COLLECTION = "notifications";
export const NOTIFICATION_SETTINGS_DOC = { collection: "settings", id: "notifications" } as const;

export type ReminderKey =
  | "taskAssigned"
  | "taskDueSoon"
  | "taskOverdue"
  | "jobAssigned"
  | "jobEndingSoon"
  | "trackerRunningLong"
  | "trackerNoTimeToday";

export type ReminderChannels = { inApp: boolean; email: boolean };

export type NotificationSettings = {
  reminders: Record<ReminderKey, ReminderChannels>;
  /** Days before a task's due date to send the "due soon" reminder. */
  taskDueSoonDays: number;
  /** Days before a job's end date to send the "ending soon" reminder. */
  jobEndingSoonDays: number;
  /** Hours a timer can run before the "still running" reminder. */
  trackerRunningHours: number;
  /** Hour of the day (Lagos time, 0–23) for the "no time logged" reminder. */
  trackerNoTimeHour: number;
};

export const REMINDER_GROUPS: { title: string; items: { key: ReminderKey; label: string; description: string }[] }[] = [
  {
    title: "Tasks",
    items: [
      { key: "taskAssigned", label: "New task", description: "When someone is given a task." },
      { key: "taskDueSoon", label: "Due soon", description: "Before a task's due date." },
      { key: "taskOverdue", label: "Overdue", description: "When a task passes its due date and isn't done." },
    ],
  },
  {
    title: "Jobs",
    items: [
      { key: "jobAssigned", label: "Added to a job", description: "When someone joins a job's team." },
      { key: "jobEndingSoon", label: "Job ending soon", description: "Before an active job's end date." },
    ],
  },
  {
    title: "Tracker",
    items: [
      { key: "trackerRunningLong", label: "Timer still running", description: "When a timer has run for a long time." },
      { key: "trackerNoTimeToday", label: "No time logged", description: "Weekdays at 5pm, for people who track time but logged nothing today." },
    ],
  },
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
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

/** Stored settings merged over the defaults, so new reminder types start on. */
export function withDefaults(stored: Partial<NotificationSettings> | undefined | null): NotificationSettings {
  const reminders = { ...DEFAULT_NOTIFICATION_SETTINGS.reminders };
  for (const key of Object.keys(reminders) as ReminderKey[]) {
    reminders[key] = { ...reminders[key], ...(stored?.reminders?.[key] ?? {}) };
  }
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...(stored ?? {}), reminders };
}

export type AppNotification = {
  id: string;
  uid: string;
  type: ReminderKey;
  title: string;
  body: string;
  /** Dashboard path to open, e.g. /dashboard/tasks. */
  href: string | null;
  createdAt: string;
  readAt: string | null;
};
