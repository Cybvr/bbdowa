"use client";

import * as React from "react";
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { LuArrowUpRight, LuPause, LuPlay, LuPlus, LuSquare } from "react-icons/lu";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { readMyJobIds } from "@/lib/firebase/job-team";
import { jobTitle, normalizeJob } from "@/lib/jobs";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { DashboardCard } from "@/components/dashboard-card";
import { FilterBar, type FilterTab, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import {
  ACTIVITY_COLLECTION,
  elapsedMs,
  formatClockFull,
  formatTimestamp,
  isPaused,
  openEntries,
  parseDurationToMinutes,
  runningEntry,
  sortByStartedAt,
  startOfToday,
  startOfWeek,
  type ActivityEntry,
} from "@/lib/time-tracking";

// Generic per-entry actions, shared by the full timer view (which only ever
// acts on the one running entry) and the compact multi-timer list (which
// can act on any open entry).

async function pauseEntryDoc(entry: ActivityEntry) {
  await updateDoc(doc(firebaseDb, ACTIVITY_COLLECTION, entry.id), {
    pausedAt: new Date().toISOString(),
  });
}

async function resumeEntryDoc(entry: ActivityEntry) {
  const pausedMs =
    (entry.pausedMs ?? 0) + (entry.pausedAt ? Math.max(0, Date.now() - Date.parse(entry.pausedAt)) : 0);
  await updateDoc(doc(firebaseDb, ACTIVITY_COLLECTION, entry.id), { pausedAt: null, pausedMs });
}

async function stopEntryDoc(entry: ActivityEntry) {
  const endedAt = new Date();
  const pausedMs =
    (entry.pausedMs ?? 0) +
    (entry.pausedAt ? Math.max(0, endedAt.getTime() - Date.parse(entry.pausedAt)) : 0);
  await updateDoc(doc(firebaseDb, ACTIVITY_COLLECTION, entry.id), {
    endedAt: endedAt.toISOString(),
    pausedAt: null,
    pausedMs,
  });
}

type JobOption = { slug: string; name: string };

const TRACKER_STATUS_TABS: FilterTab<"all" | "running" | "paused" | "completed">[] = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "paused", label: "Paused" },
  { key: "completed", label: "Completed" },
];

const TRACKER_SORTS: SortOption<"recent" | "oldest" | "activity" | "duration">[] = [
  { key: "recent", label: "Most recent" },
  { key: "oldest", label: "Oldest" },
  { key: "activity", label: "Activity (A–Z)" },
  { key: "duration", label: "Longest duration" },
];

const NO_JOB = "none";

function durationValueFromMinutes(minutes: number): string {
  const safeMinutes = Math.min(99 * 60 + 59, Math.max(0, minutes));
  return `${String(Math.floor(safeMinutes / 60)).padStart(2, "0")}:${String(safeMinutes % 60).padStart(2, "0")}`;
}

/** `jobSlug` scopes the tracker to one job: only its entries show and new trackers are logged against it. */
// Fired after an entry is saved, so other mounted trackers (e.g. the page
// list behind the header's add-tracker modal) reload.
const TRACKER_CHANGED_EVENT = "tracker:changed";

export function TimeTracker({
  compact = false,
  jobSlug,
  dialogOnly = false,
  open,
  onOpenChange,
}: {
  compact?: boolean;
  jobSlug?: string;
  /** Render only the "Add tracker" modal (used by the mobile header). */
  dialogOnly?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { user, role, loading: authLoading } = useAuth();
  const [entries, setEntries] = React.useState<ActivityEntry[]>([]);
  const [jobs, setJobs] = React.useState<JobOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());

  const [mode, setMode] = React.useState<"timer" | "manual">("timer");
  const [localTrackerOpen, setLocalTrackerOpen] = React.useState(false);
  const trackerOpen = open ?? localTrackerOpen;
  const setTrackerOpen = (next: boolean) => {
    setLocalTrackerOpen(next);
    onOpenChange?.(next);
  };
  const [addingTimer, setAddingTimer] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "running" | "paused" | "completed">("all");
  const [jobFilter, setJobFilter] = React.useState(jobSlug ?? "all");
  const [sort, setSort] = React.useState<"recent" | "oldest" | "activity" | "duration">("recent");
  const [view, setView] = React.useState<ViewMode>("table");
  const [selectedEntryId, setSelectedEntryId] = React.useState<string | null>(null);
  const [activity, setActivity] = React.useState("");
  const [jobId, setJobId] = React.useState<string>(jobSlug ?? NO_JOB);
  const [duration, setDuration] = React.useState("");
  const isStaff = role === "admin" || role === "manager";
  const userId = user?.uid;
  const userEmail = user?.email;

  const load = React.useCallback(async (uid: string) => {
    const snapshot = await getDocs(
      query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", uid)),
    );
    const rows = snapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<ActivityEntry, "id">),
    }));
    setEntries(sortByStartedAt(jobSlug ? rows.filter((row) => row.jobId === jobSlug) : rows));
  }, [jobSlug]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    load(user.uid)
      .catch((cause) => {
        console.error("Unable to load activities from Firestore", cause);
        if (active) setError("Unable to load your activities.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, user, load]);

  React.useEffect(() => {
    if (!userId) return;
    const reload = () => { void load(userId).catch(() => {}); };
    window.addEventListener(TRACKER_CHANGED_EVENT, reload);
    return () => window.removeEventListener(TRACKER_CHANGED_EVENT, reload);
  }, [userId, load]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setJobs([]);
      return;
    }

    let active = true;
    Promise.all([
      jobsCollection(),
      isStaff ? Promise.resolve<Set<string> | null>(null) : readMyJobIds(userId, userEmail),
    ])
      .then(async ([name, assignedJobIds]) => ({
        snapshot: await getDocs(collection(firebaseDb, name)),
        assignedJobIds,
      }))
      .then(({ snapshot, assignedJobIds }) => {
        if (!active) return;
        const rows = snapshot.docs
          .map((document) => ({ documentId: document.id, job: normalizeJob(document.data(), document.id) }))
          .filter(({ documentId, job }) =>
            job.status === "active"
            && (isStaff
              || assignedJobIds?.has(documentId)
              || assignedJobIds?.has(job.slug)),
          )
          .map(({ job }) => ({ slug: job.slug, name: jobTitle(job) }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setJobs(rows);
      })
      .catch((cause) => console.error("Unable to load jobs", cause));
    return () => {
      active = false;
    };
  }, [authLoading, isStaff, userEmail, userId]);

  // The single open (not-yet-stopped) activity, whether running or paused.
  // Compact mode can have several open at once; full mode only ever starts one.
  const openList = openEntries(entries);

  // Tick the live timer once a second while anything is running.
  const anyRunning = openList.some((entry) => !isPaused(entry));
  React.useEffect(() => {
    if (!anyRunning) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [anyRunning]);

  const manualMinutes = parseDurationToMinutes(duration);
  const hasActivity = activity.trim().length > 0;
  const hasJob = jobs.some((job) => job.slug === jobId);
  const canStart = hasActivity && hasJob;
  const canLog = hasActivity && hasJob && manualMinutes !== null;
  const displayedManualMinutes = manualMinutes ?? 0;
  const manualHoursLabel = String(Math.floor(displayedManualMinutes / 60)).padStart(2, "0");
  const manualMinutesLabel = String(displayedManualMinutes % 60).padStart(2, "0");

  const chosenJob = () => jobs.find((option) => option.slug === jobId);

  const resetForm = () => {
    setActivity("");
    setJobId(jobSlug ?? NO_JOB);
    setDuration("");
  };

  const addManualMinutes = (minutes: number) => {
    setDuration(durationValueFromMinutes(displayedManualMinutes + minutes));
  };

  // Timer: start now and run until stopped. Pauses whatever else is
  // currently running first, so only one timer ever ticks at a time.
  const startActivity = async () => {
    if (!user || !canStart || busy) return;
    setBusy(true);
    setError(null);
    try {
      const active = runningEntry(entries);
      if (active) await pauseEntryDoc(active);
      const chosen = chosenJob();
      await addDoc(collection(firebaseDb, ACTIVITY_COLLECTION), {
        uid: user.uid,
        name: user.name ?? user.email ?? null,
        jobId: chosen?.slug ?? null,
        jobName: chosen?.name ?? null,
        activity: activity.trim(),
        startedAt: new Date().toISOString(),
        endedAt: null,
        pausedAt: null,
        pausedMs: 0,
      });
      resetForm();
      setAddingTimer(false);
      setTrackerOpen(false);
      window.dispatchEvent(new Event(TRACKER_CHANGED_EVENT));
    } catch (cause) {
      console.error("Unable to start activity", cause);
      setError("Couldn’t start that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // Play on a stopped entry carries on the same entry: the time it sat
  // stopped counts as a pause, so no duplicate entry is created.
  const restartActivity = async (entry: ActivityEntry) => {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    try {
      const active = runningEntry(entries);
      if (active && active.id !== entry.id) await pauseEntryDoc(active);
      const stoppedAt = entry.endedAt ? Date.parse(entry.endedAt) : Number.NaN;
      const stoppedFor = Number.isNaN(stoppedAt) ? 0 : Math.max(0, Date.now() - stoppedAt);
      await updateDoc(doc(firebaseDb, ACTIVITY_COLLECTION, entry.id), {
        endedAt: null,
        pausedAt: null,
        pausedMs: (entry.pausedMs ?? 0) + stoppedFor,
      });
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to restart activity", cause);
      setError("Couldn’t restart that activity. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // Manual: log a completed activity ending now with the selected duration.
  const logActivity = async () => {
    if (!user || manualMinutes === null || !canLog || busy) return;
    setBusy(true);
    setError(null);
    try {
      const chosen = chosenJob();
      const endedAt = new Date();
      const startedAt = new Date(endedAt.getTime() - manualMinutes * 60000);
      await addDoc(collection(firebaseDb, ACTIVITY_COLLECTION), {
        uid: user.uid,
        name: user.name ?? user.email ?? null,
        jobId: chosen?.slug ?? null,
        jobName: chosen?.name ?? null,
        activity: activity.trim(),
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        pausedAt: null,
        pausedMs: 0,
      });
      resetForm();
      setTrackerOpen(false);
      window.dispatchEvent(new Event(TRACKER_CHANGED_EVENT));
    } catch (cause) {
      console.error("Unable to log activity", cause);
      setError("Couldn’t log that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // Stop a specific entry (running or paused) for good.
  const stopEntry = async (entry: ActivityEntry) => {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    try {
      await stopEntryDoc(entry);
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to stop activity", cause);
      setError("Couldn’t stop that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // Pause or resume a specific entry. Resuming one pauses whatever else is
  // currently running, so only one timer ever ticks at a time.
  const toggleEntry = async (entry: ActivityEntry) => {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (isPaused(entry)) {
        const active = runningEntry(entries);
        if (active && active.id !== entry.id) await pauseEntryDoc(active);
        await resumeEntryDoc(entry);
      } else {
        await pauseEntryDoc(entry);
      }
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to update activity", cause);
      setError("Couldn’t update that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!authLoading && !user) {
    if (dialogOnly) return null;
    return (
      <div className={compact ? "mt-2" : "space-y-4"}>
        {!compact ? <PageHeader title="Tracker" /> : null}
        <EmptyState title="Sign in to track activity" description="Start an activity once you’re signed in." />
      </div>
    );
  }

  const todayStart = startOfToday();
  const done = entries.filter((entry) => entry.endedAt);
  const weekStart = startOfWeek();
  const weekMs = entries
    .filter((entry) => Date.parse(entry.startedAt) >= weekStart)
    .reduce((total, entry) => total + elapsedMs(entry, now), 0);
  const visibleEntries = entries.filter((entry) => {
    if (statusFilter === "running" && (entry.endedAt || isPaused(entry))) return false;
    if (statusFilter === "paused" && (entry.endedAt || !isPaused(entry))) return false;
    if (statusFilter === "completed" && !entry.endedAt) return false;
    if (jobFilter !== "all" && entry.jobId !== jobFilter) return false;
    const needle = search.trim().toLowerCase();
    return !needle || `${entry.activity} ${entry.jobName ?? ""}`.toLowerCase().includes(needle);
  }).sort((a, b) => {
    if (sort === "oldest") return a.startedAt.localeCompare(b.startedAt);
    if (sort === "activity") return a.activity.localeCompare(b.activity);
    if (sort === "duration") return elapsedMs(b, now) - elapsedMs(a, now);
    return b.startedAt.localeCompare(a.startedAt);
  });
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId) ?? null;

  const addTrackerDialog = (
      <Dialog open={trackerOpen} onOpenChange={(open) => { setTrackerOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-h-[92vh] gap-5 overflow-y-auto overflow-x-hidden p-5 sm:max-w-md sm:p-6">
          <DialogHeader className="pr-12">
            <DialogTitle>Add tracker</DialogTitle>
            <DialogDescription className="sr-only">Start a timer or log time you have already spent.</DialogDescription>
          </DialogHeader>
          <div role="group" aria-label="Entry type" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            <button type="button" onClick={() => setMode("timer")} aria-pressed={mode === "timer"} className={`h-10 rounded-lg text-sm font-semibold transition-colors ${mode === "timer" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Timer</button>
            <button type="button" onClick={() => setMode("manual")} aria-pressed={mode === "manual"} className={`h-10 rounded-lg text-sm font-semibold transition-colors ${mode === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Manual</button>
          </div>
          {mode === "timer" ? <div className="py-2 text-center font-mono text-[clamp(2.75rem,10vw,4rem)] font-semibold leading-none tracking-tight tabular-nums" aria-label="Timer at zero hours, zero minutes, zero seconds">00:00:00</div> : (
            <div className="space-y-5 py-1">
              <div className="flex items-baseline justify-center gap-2 font-mono tabular-nums" aria-label={`${displayedManualMinutes} minutes selected`}>
                <span className="text-[clamp(2.75rem,10vw,4rem)] font-semibold leading-none tracking-tight">{manualHoursLabel}</span>
                <span className="text-lg text-muted-foreground">h</span>
                <span className="text-[clamp(2.75rem,10vw,4rem)] font-semibold leading-none tracking-tight">{manualMinutesLabel}</span>
                <span className="text-lg text-muted-foreground">m</span>
              </div>
              <div role="group" aria-label="Adjust time spent" className="flex flex-wrap justify-center gap-2">
                {[{ label: "+15m", minutes: 15 }, { label: "+30m", minutes: 30 }, { label: "+1h", minutes: 60 }, { label: "+2h", minutes: 120 }].map((option) => (
                  <button key={option.label} type="button" onClick={() => addManualMinutes(option.minutes)} disabled={busy} className="h-9 rounded-full border border-border px-4 text-sm text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground disabled:opacity-50">{option.label}</button>
                ))}
                <button type="button" onClick={() => setDuration("")} disabled={busy || displayedManualMinutes === 0} className="h-9 rounded-full border border-border px-4 text-sm text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground disabled:opacity-50">Reset</button>
              </div>
            </div>
          )}
          <form onSubmit={(event) => { event.preventDefault(); void (mode === "timer" ? startActivity() : logActivity()); }} className="space-y-5">
            <div><label htmlFor="tracker-activity" className="sr-only">Activity</label><Input id="tracker-activity" value={activity} onChange={(event) => setActivity(event.target.value)} disabled={busy} placeholder="What are you working on?" required className="h-12 rounded-xl border-0 bg-muted px-4 text-base" /></div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Job</span>
              <Select value={jobId === NO_JOB ? "" : jobId} onValueChange={setJobId} disabled={busy}>
                <SelectTrigger className="h-11 w-full min-w-0 rounded-xl text-sm"><SelectValue placeholder={jobs.length ? "Select a job" : isStaff ? "No active jobs" : "No assigned jobs"} /></SelectTrigger>
                <SelectContent>{jobs.map((option) => <SelectItem key={option.slug} value={option.slug}>{option.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button type="submit" disabled={busy || (mode === "timer" ? !canStart : !canLog)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">{mode === "timer" ? <LuPlay className="h-4 w-4" aria-hidden="true" /> : null}{busy ? "Saving…" : mode === "timer" ? "Start tracker" : "Log time"}</button>
              <button type="button" onClick={() => setTrackerOpen(false)} disabled={busy} className="h-10 self-center rounded-md px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Cancel</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  );

  if (dialogOnly) return addTrackerDialog;

  if (compact) {
    // Today's history: anything still open, plus anything already stopped
    // today, oldest first — so stopping a timer never makes it vanish.
    const todayDone = done.filter((entry) => Date.parse(entry.startedAt) >= todayStart);
    const todayEntries = [...openList, ...todayDone].sort((a, b) => a.startedAt.localeCompare(b.startedAt));

    return (
      <div className="space-y-4">
        {error ? <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px] text-primary">{error}</p> : null}

        <div className="flex flex-wrap items-baseline gap-2">
          <p className="m-0 font-mono text-[32px] font-bold leading-none tabular-nums">{formatClockFull(weekMs)}</p>
          <p className="m-0 text-[13px] text-muted-foreground">tracked this week</p>
        </div>

        {loading ? (
          <div role="status" aria-label="Loading today’s activity" className="space-y-2"><Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-12 w-full rounded-xl" /></div>
        ) : todayEntries.length > 0 ? (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {todayEntries.map((entry) => {
              const open = entry.endedAt === null;
              return (
                <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[14px] font-semibold">{entry.activity}</p>
                    {entry.jobName ? (
                      <p className="m-0 mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted-foreground">
                        <LuArrowUpRight aria-hidden="true" className="h-3 w-3 shrink-0" />
                        <span className="truncate">{entry.jobName}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="m-0 font-mono text-[15px] font-bold tabular-nums">{formatClockFull(elapsedMs(entry, now))}</p>
                      <p
                        className={`m-0 mt-0.5 flex items-center justify-end gap-1.5 text-[11px] ${!open || isPaused(entry) ? "text-muted-foreground" : "text-primary"}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${!open || isPaused(entry) ? "bg-muted-foreground/50" : "bg-primary"}`} />
                        {open ? (isPaused(entry) ? "Paused" : "Running") : "Done"}
                      </p>
                    </div>
                    {open ? (
                      <>
                        <button
                          type="button"
                          aria-label={isPaused(entry) ? "Resume timer" : "Pause timer"}
                          title={isPaused(entry) ? "Resume timer" : "Pause timer"}
                          onClick={() => void toggleEntry(entry)}
                          disabled={busy}
                          className="grid h-10 w-10 place-items-center rounded-lg bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isPaused(entry) ? <LuPlay aria-hidden="true" className="h-4 w-4" /> : <LuPause aria-hidden="true" className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          aria-label="Stop timer"
                          title="Stop timer"
                          onClick={() => void stopEntry(entry)}
                          disabled={busy}
                          className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <LuSquare aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">Nothing tracked yet today.</p>
        )}

        {addingTimer ? (
          <form
            onSubmit={(event) => { event.preventDefault(); void startActivity(); }}
            className="space-y-2 rounded-xl border border-border p-3"
          >
            <div className="flex gap-2">
              <Input
                autoFocus
                value={activity}
                onChange={(event) => setActivity(event.target.value)}
                disabled={busy}
                placeholder="What are you working on?"
                className="h-10 flex-1 text-sm"
              />
              <Select value={jobId === NO_JOB ? "" : jobId} onValueChange={setJobId}>
                <SelectTrigger aria-required className="h-10 w-[38%] text-sm"><SelectValue placeholder="Select a job" /></SelectTrigger>
                <SelectContent>{jobs.map((option) => <SelectItem key={option.slug} value={option.slug}>{option.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setAddingTimer(false); resetForm(); }}
                disabled={busy}
                className="h-10 shrink-0 rounded-lg border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !canStart}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LuPlay aria-hidden="true" className="h-3.5 w-3.5" />
                {busy ? "Starting…" : "Start timer"}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAddingTimer(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-[13px] font-semibold text-foreground transition hover:border-foreground"
          >
            <LuPlus aria-hidden="true" className="h-4 w-4" />
            New timer
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tracker"
        actions={<button type="button" onClick={() => setTrackerOpen(true)} className={LIST_ACTION_CLASS}><LuPlus className="h-4 w-4" aria-hidden="true" />New tracker</button>}
      />
      {error ? <p role="alert" className="text-[13px] text-primary">{error}</p> : null}

      <FilterBar
        panelId={jobSlug ? `tracker-filter-${jobSlug}` : "tracker-filter"}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search activity"
        tabs={TRACKER_STATUS_TABS}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        filters={jobSlug ? [] : [{
          label: "Job",
          value: jobFilter,
          onChange: setJobFilter,
          options: [{ value: "all", label: "All jobs" }, ...jobs.map((item) => ({ value: item.slug, label: item.name }))],
        }]}
        sortOptions={TRACKER_SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={`${visibleEntries.length} ${visibleEntries.length === 1 ? "activity" : "activities"}`}
        view={view}
        onViewChange={setView}
      />

      <section aria-label="Tracked activities">
        {loading ? (
          <div role="status" aria-label="Loading activities" className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : visibleEntries.length === 0 ? (
          <EmptyState title={entries.length ? "No activities match" : "Nothing tracked yet"} description={entries.length ? "Try another search or filter." : "Add a tracker to start recording time."} />
        ) : view === "cards" ? (
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {visibleEntries.map((entry) => {
              const open = !entry.endedAt;
              const paused = open && isPaused(entry);
              return <li key={entry.id}><DashboardCard className="h-full">
                <button type="button" onClick={() => setSelectedEntryId(entry.id)} className="flex min-h-36 w-full flex-col p-4 text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  <span className="line-clamp-2 font-semibold leading-tight">{entry.activity || "Untitled activity"}</span>
                  <span className="mt-1 truncate text-sm text-muted-foreground">{entry.jobName ?? "No job"}</span>
                  <span className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-muted-foreground">
                    <span>{formatTimestamp(entry.startedAt)}</span>
                    <span className={open && !paused ? "text-primary" : ""}>{open ? (paused ? "Paused" : "Running") : "Completed"}</span>
                  </span>
                </button>
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <span className="font-mono text-sm font-semibold tabular-nums">{formatClockFull(elapsedMs(entry, now))}</span>
                  {open ? <div className="flex items-center gap-1">
                    <button type="button" onClick={() => void toggleEntry(entry)} disabled={busy} aria-label={`${paused ? "Play" : "Pause"} ${entry.activity}`} title={paused ? "Play" : "Pause"} className="grid h-9 w-9 place-items-center rounded-md text-foreground transition hover:bg-muted disabled:opacity-50">{paused ? <LuPlay className="h-4 w-4" aria-hidden="true" /> : <LuPause className="h-4 w-4" aria-hidden="true" />}</button>
                    <button type="button" onClick={() => void stopEntry(entry)} disabled={busy} aria-label={`Stop ${entry.activity}`} title="Stop" className="grid h-9 w-9 place-items-center rounded-md text-primary transition hover:bg-primary/10 disabled:opacity-50"><LuSquare className="h-4 w-4" aria-hidden="true" /></button>
                  </div> : <button type="button" onClick={() => void restartActivity(entry)} disabled={busy} aria-label={`Continue ${entry.activity}`} title="Continue" className="grid h-9 w-9 place-items-center rounded-md text-foreground transition hover:bg-muted disabled:opacity-50"><LuPlay className="h-4 w-4" aria-hidden="true" /></button>}
                </div>
              </DashboardCard></li>;
            })}
          </ul>
        ) : (
          <>
          <ul className="m-0 list-none divide-y divide-border p-0 md:hidden">
            {visibleEntries.map((entry) => {
              const open = !entry.endedAt;
              const paused = open && isPaused(entry);
              return (
                <li key={entry.id} className="flex items-center gap-3 py-3">
                  <button type="button" onClick={() => setSelectedEntryId(entry.id)} className="min-w-0 flex-1 text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    <span className="block truncate text-[15px] font-semibold">{entry.activity || "Untitled activity"}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{entry.jobName ?? "No job"}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <span className={open && !paused ? "text-primary" : ""}>{open ? (paused ? "Paused" : "Running") : "Completed"}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{formatTimestamp(entry.startedAt)}</span>
                    </span>
                  </button>
                  <span className="shrink-0 font-mono text-[14px] font-semibold tabular-nums">{formatClockFull(elapsedMs(entry, now))}</span>
                  {open ? <div className="flex shrink-0 items-center">
                    <button type="button" onClick={() => void toggleEntry(entry)} disabled={busy} aria-label={`${paused ? "Play" : "Pause"} ${entry.activity}`} title={paused ? "Play" : "Pause"} className="grid h-9 w-9 place-items-center rounded-md text-foreground transition hover:bg-muted disabled:opacity-50">{paused ? <LuPlay className="h-4 w-4" aria-hidden="true" /> : <LuPause className="h-4 w-4" aria-hidden="true" />}</button>
                    <button type="button" onClick={() => void stopEntry(entry)} disabled={busy} aria-label={`Stop ${entry.activity}`} title="Stop" className="grid h-9 w-9 place-items-center rounded-md text-primary transition hover:bg-primary/10 disabled:opacity-50"><LuSquare className="h-4 w-4" aria-hidden="true" /></button>
                  </div> : <button type="button" onClick={() => void restartActivity(entry)} disabled={busy} aria-label={`Continue ${entry.activity}`} title="Continue" className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-foreground transition hover:bg-muted disabled:opacity-50"><LuPlay className="h-4 w-4" aria-hidden="true" /></button>}
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[700px] w-full border-collapse">
              <TableHeader>
                <TableRow className="text-left font-semibold uppercase text-muted-foreground">
                  <TableHead className="px-4 py-3 font-semibold">Activity</TableHead>
                  <TableHead className="px-4 py-3 font-semibold">Job</TableHead>
                  <TableHead className="px-4 py-3 font-semibold">Started</TableHead>
                  <TableHead className="px-4 py-3 font-semibold">Time</TableHead>
                  <TableHead className="w-28 px-4 py-3 text-right font-semibold">Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleEntries.map((entry) => {
                  const open = !entry.endedAt;
                  const paused = open && isPaused(entry);
                  return (
                    <ClickableTableRow key={entry.id} label={`Open activity ${entry.activity}`} onActivate={() => setSelectedEntryId(entry.id)} className="align-middle">
                      <TableCell className="px-4 py-3">
                        <button type="button" onClick={() => setSelectedEntryId(entry.id)} className="font-semibold hover:text-primary">{entry.activity || "—"}</button>
                        <span className={`ml-2 text-xs ${open && !paused ? "text-primary" : "text-muted-foreground"}`}>{open ? (paused ? "Paused" : "Running") : "Completed"}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3">{entry.jobName ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3">{formatTimestamp(entry.startedAt)}</TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{formatClockFull(elapsedMs(entry, now))}</TableCell>
                      <TableCell className="px-4 py-3">
                        {open ? <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => void toggleEntry(entry)} disabled={busy} aria-label={`${paused ? "Play" : "Pause"} ${entry.activity}`} title={paused ? "Play" : "Pause"} className="grid h-9 w-9 place-items-center rounded-md text-foreground transition hover:bg-muted disabled:opacity-50">{paused ? <LuPlay className="h-4 w-4" aria-hidden="true" /> : <LuPause className="h-4 w-4" aria-hidden="true" />}</button>
                          <button type="button" onClick={() => void stopEntry(entry)} disabled={busy} aria-label={`Stop ${entry.activity}`} title="Stop" className="grid h-9 w-9 place-items-center rounded-md text-primary transition hover:bg-primary/10 disabled:opacity-50"><LuSquare className="h-4 w-4" aria-hidden="true" /></button>
                        </div> : <div className="flex justify-end">
                          <button type="button" onClick={() => void restartActivity(entry)} disabled={busy} aria-label={`Continue ${entry.activity}`} title="Continue" className="grid h-9 w-9 place-items-center rounded-md text-foreground transition hover:bg-muted disabled:opacity-50"><LuPlay className="h-4 w-4" aria-hidden="true" /></button>
                        </div>}
                      </TableCell>
                    </ClickableTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          </>
        )}
      </section>

      <Dialog open={Boolean(selectedEntry)} onOpenChange={(open) => { if (!open) setSelectedEntryId(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pr-10">
            <DialogTitle>{selectedEntry?.activity || "Activity"}</DialogTitle>
            <DialogDescription>{selectedEntry?.jobName || "No job"}</DialogDescription>
          </DialogHeader>
          {selectedEntry ? <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
            <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1 font-semibold">{selectedEntry.endedAt ? "Completed" : isPaused(selectedEntry) ? "Paused" : "Running"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Time</dt><dd className="mt-1 font-semibold tabular-nums">{formatClockFull(elapsedMs(selectedEntry, now))}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Started</dt><dd className="mt-1 font-semibold">{formatTimestamp(selectedEntry.startedAt)}</dd></div>
            {selectedEntry.endedAt ? <div><dt className="text-xs text-muted-foreground">Stopped</dt><dd className="mt-1 font-semibold">{formatTimestamp(selectedEntry.endedAt)}</dd></div> : null}
          </dl> : null}
        </DialogContent>
      </Dialog>

      {addTrackerDialog}
    </div>
  );
}
