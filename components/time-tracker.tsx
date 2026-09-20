"use client";

import * as React from "react";
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { LuArrowUpRight, LuPause, LuPlay, LuPlus, LuSquare } from "react-icons/lu";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { EmptyState, SectionHeading, StatItem, StatRow } from "@/components/dashboard/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

type CampaignOption = { slug: string; name: string };

const NO_CAMPAIGN = "none";

function localDateValue(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localTimeValue(date: Date = new Date()): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function localDateTimeToDate(date: string, time: string): Date | null {
  const value = new Date(`${date}T${time}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function TimeTracker({ compact = false }: { compact?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = React.useState<ActivityEntry[]>([]);
  const [campaigns, setCampaigns] = React.useState<CampaignOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());

  const [mode, setMode] = React.useState<"timer" | "manual">("timer");
  const [addingTimer, setAddingTimer] = React.useState(false);
  const [activity, setActivity] = React.useState("");
  const [campaignSlug, setCampaignSlug] = React.useState<string>(NO_CAMPAIGN);
  const [entryDate, setEntryDate] = React.useState(() => localDateValue());
  const [entryTime, setEntryTime] = React.useState(() => localTimeValue());
  const [duration, setDuration] = React.useState("");

  const load = React.useCallback(async (uid: string) => {
    const snapshot = await getDocs(
      query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", uid)),
    );
    const rows = snapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<ActivityEntry, "id">),
    }));
    setEntries(sortByStartedAt(rows));
  }, []);

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
    let active = true;
    getDocs(collection(firebaseDb, "campaigns"))
      .then((snapshot) => {
        if (!active) return;
        const rows = snapshot.docs
          .map((document) => {
            const data = document.data() as { slug?: string; campaign?: string; name?: string };
            return { slug: data.slug ?? document.id, name: data.campaign ?? data.name ?? document.id };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        setCampaigns(rows);
      })
      .catch((cause) => console.error("Unable to load campaigns", cause));
    return () => {
      active = false;
    };
  }, []);

  // The single open (not-yet-stopped) activity, whether running or paused.
  // Compact mode can have several open at once; full mode only ever starts one.
  const openList = openEntries(entries);
  const current = openList[0] ?? null;

  // Tick the live timer once a second while anything is running.
  const anyRunning = openList.some((entry) => !isPaused(entry));
  React.useEffect(() => {
    if (!anyRunning) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [anyRunning]);

  const manualMinutes = parseDurationToMinutes(duration);
  const hasActivity = activity.trim().length > 0;
  const hasCampaign = campaignSlug !== NO_CAMPAIGN;
  const canStart = hasActivity && hasCampaign;
  const canLog = hasActivity && hasCampaign && manualMinutes !== null && Boolean(localDateTimeToDate(entryDate, entryTime));

  const chosenCampaign = () => campaigns.find((option) => option.slug === campaignSlug);

  const resetForm = () => {
    setActivity("");
    setCampaignSlug(NO_CAMPAIGN);
    setEntryDate(localDateValue());
    setEntryTime(localTimeValue());
    setDuration("");
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
      const chosen = chosenCampaign();
      await addDoc(collection(firebaseDb, ACTIVITY_COLLECTION), {
        uid: user.uid,
        name: user.name ?? user.email ?? null,
        campaignSlug: chosen?.slug ?? null,
        campaignName: chosen?.name ?? null,
        activity: activity.trim(),
        startedAt: new Date().toISOString(),
        endedAt: null,
        pausedAt: null,
        pausedMs: 0,
      });
      resetForm();
      setAddingTimer(false);
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to start activity", cause);
      setError("Couldn’t start that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // Manual: log a completed activity with a typed duration.
  const logActivity = async () => {
      if (!user || manualMinutes === null || !canLog || busy) return;
    setBusy(true);
    setError(null);
    try {
      const chosen = chosenCampaign();
      const startedAt = localDateTimeToDate(entryDate, entryTime);
      if (!startedAt) return;
      const endedAt = new Date(startedAt.getTime() + manualMinutes * 60000);
      await addDoc(collection(firebaseDb, ACTIVITY_COLLECTION), {
        uid: user.uid,
        name: user.name ?? user.email ?? null,
        campaignSlug: chosen?.slug ?? null,
        campaignName: chosen?.name ?? null,
        activity: activity.trim(),
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        pausedAt: null,
        pausedMs: 0,
      });
      resetForm();
      await load(user.uid);
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
    return (
      <div className={compact ? "mt-2" : "mt-8"}>
        <EmptyState title="Sign in to track activity" description="Start an activity once you’re signed in." />
      </div>
    );
  }

  const todayStart = startOfToday();
  const done = entries.filter((entry) => entry.endedAt);
  const todayMs = done
    .filter((entry) => Date.parse(entry.startedAt) >= todayStart)
    .reduce((total, entry) => total + elapsedMs(entry, now), 0);
  const weekStart = startOfWeek();
  const weekMs = entries
    .filter((entry) => Date.parse(entry.startedAt) >= weekStart)
    .reduce((total, entry) => total + elapsedMs(entry, now), 0);
  const recent = entries.slice(0, 30);

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
                    {entry.campaignName ? (
                      <p className="m-0 mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted-foreground">
                        <LuArrowUpRight aria-hidden="true" className="h-3 w-3 shrink-0" />
                        <span className="truncate">{entry.campaignName}</span>
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
              <Select value={campaignSlug === NO_CAMPAIGN ? "" : campaignSlug} onValueChange={setCampaignSlug}>
                <SelectTrigger aria-required="true" className="h-10 w-[38%] text-sm"><SelectValue placeholder="Select a campaign" /></SelectTrigger>
                <SelectContent>{campaigns.map((option) => <SelectItem key={option.slug} value={option.slug}>{option.name}</SelectItem>)}</SelectContent>
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
    <div className={compact ? "space-y-6" : "mt-8 space-y-8"}>
      {error ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px] text-primary">{error}</p>
      ) : null}

      <div className="mx-auto w-full max-w-md border-b border-border pb-10">
        {current ? (
          <div className="flex flex-col items-center gap-7 py-4 text-center">
            <span
              className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] ${isPaused(current) ? "text-muted-foreground" : "text-primary"}`}
            >
              <span className={`h-2 w-2 rounded-full ${isPaused(current) ? "bg-muted-foreground/50" : "animate-pulse bg-primary"}`} />
              {isPaused(current) ? "Paused" : "Now tracking"}
            </span>
            <p className="m-0 font-mono text-[56px] font-bold leading-none tabular-nums sm:text-[68px]">
              {formatClockFull(elapsedMs(current, now))}
            </p>
            <div className="min-w-0 px-2">
              <p className="m-0 truncate text-[18px] font-bold leading-tight">{current.activity}</p>
              <p className="mb-0 mt-1 text-[13px] text-muted-foreground">
                {current.campaignName ? `${current.campaignName} · ` : ""}
                Started {formatTimestamp(current.startedAt)}
              </p>
            </div>
            <div className="flex items-center gap-5">
              <button
                type="button"
                aria-label={isPaused(current) ? "Resume timer" : "Pause timer"}
                title={isPaused(current) ? "Resume timer" : "Pause timer"}
                onClick={() => void toggleEntry(current)}
                disabled={busy}
                className="grid h-16 w-16 place-items-center rounded-full border border-border bg-background text-foreground transition hover:border-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {isPaused(current) ? <LuPlay aria-hidden="true" className="h-6 w-6" /> : <LuPause aria-hidden="true" className="h-6 w-6" />}
              </button>
              <button
                type="button"
                aria-label="Stop timer"
                title="Stop timer"
                onClick={() => void stopEntry(current)}
                disabled={busy}
                className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <LuSquare aria-hidden="true" className="h-6 w-6" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-1 rounded-full border border-border bg-muted/40 p-1 text-[13px] font-semibold">
              <button
                type="button"
                onClick={() => setMode("timer")}
                className={`rounded-full py-2 transition ${mode === "timer" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Timer
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`rounded-full py-2 transition ${mode === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Manual
              </button>
            </div>

            {mode === "timer" ? (
              <form onSubmit={(event) => { event.preventDefault(); void startActivity(); }} className="mt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    value={activity}
                    onChange={(event) => setActivity(event.target.value)}
                    disabled={busy}
                    placeholder="What are you working on?"
                    className="h-14 flex-1 rounded-xl text-[15px]"
                  />
                  <button
                    type="submit"
                    aria-label="Start timer"
                    title="Start timer"
                    disabled={busy || !canStart}
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <LuPlay aria-hidden="true" className="h-6 w-6" />
                  </button>
                </div>
                <Select value={campaignSlug === NO_CAMPAIGN ? "" : campaignSlug} onValueChange={setCampaignSlug}>
                  <SelectTrigger aria-required="true" className="h-12 w-full rounded-xl">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((option) => (
                      <SelectItem key={option.slug} value={option.slug}>{option.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="m-0 pt-1 text-center text-[12px] text-muted-foreground">Pick a campaign, then hit play to start the clock.</p>
              </form>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); void logActivity(); }} className="mt-6 space-y-3">
                <Input
                  value={activity}
                  onChange={(event) => setActivity(event.target.value)}
                  disabled={busy}
                  placeholder="What did you work on?"
                  className="h-12 rounded-xl text-[15px]"
                />
                <Select value={campaignSlug === NO_CAMPAIGN ? "" : campaignSlug} onValueChange={setCampaignSlug}>
                  <SelectTrigger aria-required="true" className="h-12 w-full rounded-xl">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((option) => (
                      <SelectItem key={option.slug} value={option.slug}>{option.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Date</span>
                    <Input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} disabled={busy} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Start time</span>
                    <Input type="time" step={60} value={entryTime} onChange={(event) => setEntryTime(event.target.value)} disabled={busy} className="h-12 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Time spent</span>
                  <Input type="time" step={60} value={duration} onChange={(event) => setDuration(event.target.value)} disabled={busy} className="h-12 rounded-xl" />
                </div>
                <button
                  type="submit"
                  disabled={busy || !canLog}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Log time
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {!compact ? (
        <>
          <StatRow>
            <StatItem label="Today" value={formatClockFull(todayMs)} />
            <StatItem label="Activities" value={done.length} />
            <StatItem label="Campaigns" value={new Set(entries.map((entry) => entry.campaignSlug).filter(Boolean)).size} />
          </StatRow>

          <section aria-labelledby="recent-activity">
            <SectionHeading id="recent-activity">Recent activity</SectionHeading>
            {loading ? (
              <div role="status" aria-label="Loading recent activity" className="overflow-hidden rounded-xl border border-border"><Skeleton className="h-12 w-full rounded-none" /><Skeleton className="h-12 w-full rounded-none" /><Skeleton className="h-12 w-full rounded-none" /></div>
            ) : recent.length === 0 ? (
              <EmptyState title="Nothing logged yet" description="Start your first activity above." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="min-w-[680px] w-full border-collapse text-[14px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Activity</th>
                      <th className="px-4 py-3 font-semibold">Campaign</th>
                      <th className="px-4 py-3 font-semibold">When</th>
                      <th className="px-4 py-3 font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((entry) => (
                      <tr key={entry.id} className="border-b border-border last:border-b-0 align-top">
                        <td className="px-4 py-3">{entry.activity || <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-3">{entry.campaignName ?? <span className="text-muted-foreground">—</span>}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatTimestamp(entry.startedAt)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {entry.endedAt ? (
                            formatClockFull(elapsedMs(entry, now))
                          ) : (
                            <span className="font-semibold text-primary">Running…</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
