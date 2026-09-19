// Activity tracker.
//
// One document per logged activity in the `timeEntries` collection: the person
// records what they did, which campaign it was for, and how long it took. Admins
// can read everyone's; each person reads and writes only their own.

export type ActivityEntry = {
  id: string;
  /** Firebase uid of the person the activity belongs to. */
  uid: string;
  /** Display name captured when logged, for the admin view. */
  name: string | null;
  /** Slug of the campaign this was for, or null. */
  campaignSlug: string | null;
  /** Campaign name captured when logged, for display. */
  campaignName: string | null;
  /** What the person did. */
  activity: string;
  /** How long it took, in minutes. */
  durationMinutes: number;
  /** ISO timestamp of when it was logged. */
  loggedAt: string;
};

export const ACTIVITY_COLLECTION = "timeEntries";

/** Entries newest first, by logged time. */
export function sortByLoggedAt(entries: ActivityEntry[]): ActivityEntry[] {
  return [...entries].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

/** "2h 30m" from a minute count. */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** "Mon 19 Sep, 09:14" from an ISO timestamp. */
export function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
