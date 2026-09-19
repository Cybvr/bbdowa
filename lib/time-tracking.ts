// Simple clock in / clock out tracker.
//
// One document per shift in the `timeEntries` collection: a person clocks in
// (open shift, clockOutAt = null), then clocks out (clockOutAt set). Records
// belong to the person who created them; admins can read everyone's.

export type TimeEntry = {
  id: string;
  /** Firebase uid of the person the shift belongs to. */
  uid: string;
  /** Display name captured at clock-in, for the admin view. */
  name: string | null;
  /** ISO timestamp of clock in. */
  clockInAt: string;
  /** ISO timestamp of clock out, or null while the shift is open. */
  clockOutAt: string | null;
};

export const TIME_ENTRIES_COLLECTION = "timeEntries";

/** The person's currently open shift, if any. */
export function openShift(entries: TimeEntry[]): TimeEntry | null {
  return entries.find((entry) => entry.clockOutAt === null) ?? null;
}

/** Entries newest first, by clock-in time. */
export function sortByClockIn(entries: TimeEntry[]): TimeEntry[] {
  return [...entries].sort((a, b) => b.clockInAt.localeCompare(a.clockInAt));
}

/** Worked milliseconds for one shift; open shifts count up to `now`. */
export function shiftDurationMs(entry: TimeEntry, now: number = Date.now()): number {
  const start = Date.parse(entry.clockInAt);
  const end = entry.clockOutAt ? Date.parse(entry.clockOutAt) : now;
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, end - start);
}

/** "7h 32m" from a millisecond span. */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
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

/** "09:14" from an ISO timestamp. */
export function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
}
