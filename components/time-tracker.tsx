"use client";

import * as React from "react";
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { EmptyState, Panel, SectionHeading, StatItem, StatRow } from "@/components/dashboard/ui";
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
  formatDuration,
  formatTimestamp,
  parseDurationToMinutes,
  runningEntry,
  sortByStartedAt,
  type ActivityEntry,
} from "@/lib/time-tracking";

type CampaignOption = { slug: string; name: string };

const NO_CAMPAIGN = "none";

function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export function TimeTracker() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = React.useState<ActivityEntry[]>([]);
  const [campaigns, setCampaigns] = React.useState<CampaignOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());

  const [activity, setActivity] = React.useState("");
  const [campaignSlug, setCampaignSlug] = React.useState<string>(NO_CAMPAIGN);
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
    if (!running) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const manualMinutes = parseDurationToMinutes(duration);
  const canStart = activity.trim().length > 0;
  const canLog = canStart && manualMinutes !== null;

  const chosenCampaign = () => campaigns.find((option) => option.slug === campaignSlug);

  const resetForm = () => {
    setActivity("");
    setCampaignSlug(NO_CAMPAIGN);
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
      const startedAt = new Date();
      const endedAt = new Date(startedAt.getTime() + manualMinutes * 60000);
      await addDoc(collection(firebaseDb, ACTIVITY_COLLECTION), {
        uid: user.uid,
        name: user.name ?? user.email ?? null,
        campaignSlug: chosen?.slug ?? null,
        campaignName: chosen?.name ?? null,
        activity: activity.trim(),
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
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
      await updateDoc(doc(firebaseDb, ACTIVITY_COLLECTION, running.id), {
        endedAt: new Date().toISOString(),
      });
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to stop activity", cause);
      setError("Couldn’t stop that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="mt-8">
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

  return (
    <div className="mt-8 space-y-8">
      {error ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px] text-primary">{error}</p>
      ) : null}

      <Panel>
        {running ? (
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Now tracking</span>
              <p className="m-0 mt-1 truncate text-[20px] font-bold leading-tight">{running.activity}</p>
              <p className="mb-0 mt-1 text-[13px] text-muted-foreground">
                {running.campaignName ? `${running.campaignName} · ` : ""}
                Started {formatTimestamp(running.startedAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="font-mono text-[22px] font-bold tabular-nums">{formatClock(elapsedMs(running, now))}</span>
              <button
                type="button"
                onClick={stopActivity}
                disabled={busy}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-[14px] font-semibold text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {busy ? "Saving…" : "Stop"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); void startActivity(); }} className="space-y-4">
            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Activity</span>
              <Input value={activity} onChange={(event) => setActivity(event.target.value)} disabled={busy} placeholder="What are you working on?" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Campaign</span>
                <Select value={campaignSlug} onValueChange={setCampaignSlug}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CAMPAIGN}>No campaign</SelectItem>
                    {campaigns.map((option) => (
                      <SelectItem key={option.slug} value={option.slug}>{option.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Time spent (optional)</span>
                <Input value={duration} onChange={(event) => setDuration(event.target.value)} disabled={busy} placeholder="e.g. 1h 30m" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={busy || !canStart}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {busy ? "Saving…" : "Start timer"}
              </button>
              <button
                type="button"
                onClick={() => void logActivity()}
                disabled={busy || !canLog}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-[14px] font-semibold text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Log time
              </button>
            </div>
            <p className="m-0 text-[12px] text-muted-foreground">Start the timer, or enter the time and log it.</p>
          </form>
        )}
      </Panel>

      <StatRow>
        <StatItem label="Today" value={formatDuration(todayMs)} />
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
                        formatDuration(elapsedMs(entry, now))
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
    </div>
  );
}
