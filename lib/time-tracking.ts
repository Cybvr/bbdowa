// Activity tracker.
//
// One document per activity in the `timeEntries` collection. A person starts an
// activity (what they're doing + which campaign); it runs until they stop it,
// and the app measures how long it took. Admins can read everyone's; each
// person reads and writes only their own.

export type ActivityEntry = {
  id: string;
  /** Firebase uid of the person the activity belongs to. */
  uid: string;
  /** Display name captured at start, for the admin view. */
  name: string | null;
  /** Slug of the campaign this is for, or null. */
  campaignSlug: string | null;
  /** Campaign name captured at start, for display. */
  campaignName: string | null;
  /** What the person is doing. */
  activity: string;
  /** ISO timestamp when the activity was started. */
  startedAt: string;
  /** ISO timestamp when it was stopped, or null while running. */
  endedAt: string | null;
  /** ISO timestamp when the activity was paused, or null while active. */
  pausedAt?: string | null;
  /** Total milliseconds spent paused before the current pause, if any. */
  pausedMs?: number;
};

export const ACTIVITY_COLLECTION = "timeEntries";

/** The person's currently running (unpaused, unfinished) activity, if any. */
export function runningEntry(entries: ActivityEntry[]): ActivityEntry | null {
  return entries.find((entry) => entry.endedAt === null && !entry.pausedAt) ?? null;
}

/** All not-yet-stopped activities (running or paused), oldest first. */
export function openEntries(entries: ActivityEntry[]): ActivityEntry[] {
  return entries
    .filter((entry) => entry.endedAt === null)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

/** Entries newest first, by start time. */
export function sortByStartedAt(entries: ActivityEntry[]): ActivityEntry[] {
  return [...entries].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/** Milliseconds an activity took; a running one counts up to `now`. */
export function elapsedMs(entry: ActivityEntry, now: number = Date.now()): number {
  const start = Date.parse(entry.startedAt);
  const end = entry.endedAt ? Date.parse(entry.endedAt) : now;
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  const pausedBeforeCurrent = entry.pausedMs ?? 0;
  const pauseStart = entry.pausedAt ? Date.parse(entry.pausedAt) : Number.NaN;
  const currentPause = Number.isNaN(pauseStart) ? 0 : Math.max(0, end - pauseStart);
  return Math.max(0, end - start - pausedBeforeCurrent - currentPause);
}

export function isPaused(entry: ActivityEntry): boolean {
  return Boolean(entry.pausedAt) && !entry.endedAt;
}

/** "2h 30m" / "45m" from a millisecond span. */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/** "1:05:23" / "05:23" live clock from a millisecond span. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "01:05:23" full clock — always hours, minutes and seconds. */
export function formatClockFull(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/**
 * Parse a typed duration into minutes. Accepts "1h 30m", "1h", "30m", "1.5h",
 * or a plain number (treated as minutes). Returns null if nothing usable.
 */
export function parseDurationToMinutes(input: string): number | null {
  const value = input.trim().toLowerCase();
  if (!value) return null;

  const clock = value.match(/^(\d{1,2}):([0-5]\d)$/);
  if (clock) {
    const total = Number(clock[1]) * 60 + Number(clock[2]);
    return total > 0 ? total : null;
  }

  const hm = value.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+)\s*m)?$/);
  if (hm && (hm[1] || hm[2])) {
    const hours = parseFloat(hm[1] ?? "0");
    const mins = parseInt(hm[2] ?? "0", 10);
    const total = Math.round(hours * 60 + mins);
    return total > 0 ? total : null;
  }

  const plain = Number(value);
  if (!Number.isNaN(plain) && plain > 0) return Math.round(plain);
  return null;
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
    second: "2-digit",
  }).format(date);
}
