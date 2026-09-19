"use client";

import * as React from "react";
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { LuPause, LuPlay, LuSquare } from "react-icons/lu";
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
import {
  ACTIVITY_COLLECTION,
  elapsedMs,
  formatClock,
  formatClockFull,
  formatTimestamp,
  isPaused,
  parseDurationToMinutes,
  runningEntry,
  sortByStartedAt,
  type ActivityEntry,
} from "@/lib/time-tracking";

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

function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
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

  // Tick the live timer once a second while something is running.
  const running = runningEntry(entries);
  React.useEffect(() => {
    if (!running || isPaused(running)) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const manualMinutes = parseDurationToMinutes(duration);
  const hasActivity = activity.trim().length > 0;
  const canStart = hasActivity && campaignSlug !== NO_CAMPAIGN;
  const canLog = hasActivity && manualMinutes !== null && Boolean(localDateTimeToDate(entryDate, entryTime));

  const chosenCampaign = () => campaigns.find((option) => option.slug === campaignSlug);

  const resetForm = () => {
    setActivity("");
    setCampaignSlug(NO_CAMPAIGN);
    setEntryDate(localDateValue());
    setEntryTime(localTimeValue());
    setDuration("");
  };

  // Timer: start now and run until stopped.
  const startActivity = async () => {
    if (!user || !canStart || running || busy) return;
    setBusy(true);
    setError(null);
    try {
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

  const stopActivity = async () => {
    if (!user || !running || busy) return;
    setBusy(true);
    setError(null);
    try {
      const endedAt = new Date();
      const pausedMs = (running.pausedMs ?? 0) + (running.pausedAt ? Math.max(0, endedAt.getTime() - Date.parse(running.pausedAt)) : 0);
      await updateDoc(doc(firebaseDb, ACTIVITY_COLLECTION, running.id), {
        endedAt: endedAt.toISOString(),
        pausedAt: null,
        pausedMs,
      });
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to stop activity", cause);
      setError("Couldn’t stop that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const pauseActivity = async () => {
    if (!user || !running || isPaused(running) || busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, ACTIVITY_COLLECTION, running.id), { pausedAt: new Date().toISOString() });
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to pause activity", cause);
      setError("Couldn’t pause that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const resumeActivity = async () => {
    if (!user || !running || !isPaused(running) || busy || !running.pausedAt) return;
    setBusy(true);
    setError(null);
    try {
      const pausedMs = (running.pausedMs ?? 0) + Math.max(0, Date.now() - Date.parse(running.pausedAt));
      await updateDoc(doc(firebaseDb, ACTIVITY_COLLECTION, running.id), { pausedAt: null, pausedMs });
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to resume activity", cause);
      setError("Couldn’t resume that. Try again.");
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
  const recent = entries.slice(0, 30);

  if (compact) {
    return (
      <div className="space-y-4">
        {error ? <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px] text-primary">{error}</p> : null}
        {running ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full table-fixed border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="w-[30%] px-3 py-2.5">Activity</th>
                  <th className="w-[26%] px-3 py-2.5">Campaign</th>
                  <th className="w-[18%] px-3 py-2.5">Time</th>
                  <th className="w-[26%] px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="max-w-0 px-3 py-3 font-semibold"><span className="block truncate" title={running.activity}>{running.activity}</span></td>
                  <td className="max-w-0 px-3 py-3 text-muted-foreground"><span className="block truncate" title={running.campaignName ?? undefined}>{running.campaignName ?? "—"}</span></td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono tabular-nums">{formatClock(elapsedMs(running, now))}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" aria-label={isPaused(running) ? "Resume timer" : "Pause timer"} title={isPaused(running) ? "Resume timer" : "Pause timer"} onClick={() => void (isPaused(running) ? resumeActivity() : pauseActivity())} disabled={busy} className="grid h-8 w-8 place-items-center rounded-md border border-border text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60">{isPaused(running) ? <LuPlay aria-hidden="true" className="h-3.5 w-3.5" /> : <LuPause aria-hidden="true" className="h-3.5 w-3.5" />}</button>
                      <button type="button" aria-label="Stop timer" title="Stop timer" onClick={() => void stopActivity()} disabled={busy} className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"><LuSquare aria-hidden="true" className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); void startActivity(); }} className="overflow-hidden rounded-lg border border-border">
            <table className="w-full table-fixed border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="w-[42%] px-3 py-2.5">Activity</th>
                  <th className="w-[38%] px-3 py-2.5">Campaign</th>
                  <th className="w-[20%] px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="max-w-0 px-3 py-3"><Input value={activity} onChange={(event) => setActivity(event.target.value)} disabled={busy} placeholder="What are you working on?" className="h-8 min-w-0 text-xs" /></td>
                  <td className="max-w-0 px-3 py-3">
                    <Select value={campaignSlug === NO_CAMPAIGN ? "" : campaignSlug} onValueChange={setCampaignSlug}>
                      <SelectTrigger className="h-8 w-full text-xs"><SelectValue placeholder="Select campaign" /></SelectTrigger>
                      <SelectContent>{campaigns.map((option) => <SelectItem key={option.slug} value={option.slug}>{option.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-3 text-right"><button type="submit" disabled={busy || !canStart} className="h-8 rounded-md bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Saving…" : "Start"}</button></td>
                </tr>
              </tbody>
            </table>
          </form>
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
        {running ? (
          <div className="flex flex-col items-center gap-7 py-4 text-center">
            <span
              className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] ${isPaused(running) ? "text-muted-foreground" : "text-primary"}`}
            >
              <span className={`h-2 w-2 rounded-full ${isPaused(running) ? "bg-muted-foreground/50" : "animate-pulse bg-primary"}`} />
              {isPaused(running) ? "Paused" : "Now tracking"}
            </span>
            <p className="m-0 font-mono text-[56px] font-bold leading-none tabular-nums sm:text-[68px]">
              {formatClockFull(elapsedMs(running, now))}
            </p>
            <div className="min-w-0 px-2">
              <p className="m-0 truncate text-[18px] font-bold leading-tight">{running.activity}</p>
              <p className="mb-0 mt-1 text-[13px] text-muted-foreground">
                {running.campaignName ? `${running.campaignName} · ` : ""}
                Started {formatTimestamp(running.startedAt)}
              </p>
            </div>
            <div className="flex items-center gap-5">
              <button
                type="button"
                aria-label={isPaused(running) ? "Resume timer" : "Pause timer"}
                title={isPaused(running) ? "Resume timer" : "Pause timer"}
                onClick={() => void (isPaused(running) ? resumeActivity() : pauseActivity())}
                disabled={busy}
                className="grid h-16 w-16 place-items-center rounded-full border border-border bg-background text-foreground transition hover:border-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {isPaused(running) ? <LuPlay aria-hidden="true" className="h-6 w-6" /> : <LuPause aria-hidden="true" className="h-6 w-6" />}
              </button>
              <button
                type="button"
                aria-label="Stop timer"
                title="Stop timer"
                onClick={stopActivity}
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
                <Select value={campaignSlug} onValueChange={setCampaignSlug}>
                  <SelectTrigger className="h-12 w-full rounded-xl">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CAMPAIGN}>No campaign</SelectItem>
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
                <Select value={campaignSlug} onValueChange={setCampaignSlug}>
                  <SelectTrigger className="h-12 w-full rounded-xl">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CAMPAIGN}>No campaign</SelectItem>
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
              <p className="text-[14px] text-muted-foreground">Loading…</p>
            ) : recent.length === 0 ? (
              <EmptyState title="Nothing logged yet" description="Start your first activity above." />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full border-collapse text-[14px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Activity</th>
                      <th className="hidden px-4 py-3 font-semibold sm:table-cell">Campaign</th>
                      <th className="hidden px-4 py-3 font-semibold sm:table-cell">When</th>
                      <th className="px-4 py-3 font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((entry) => (
                      <tr key={entry.id} className="border-b border-border last:border-b-0 align-top">
                        <td className="px-4 py-3">{entry.activity || <span className="text-muted-foreground">—</span>}</td>
                        <td className="hidden px-4 py-3 sm:table-cell">{entry.campaignName ?? <span className="text-muted-foreground">—</span>}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap sm:table-cell">{formatTimestamp(entry.startedAt)}</td>
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
