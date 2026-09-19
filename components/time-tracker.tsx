"use client";

import * as React from "react";
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { EmptyState, Panel, SectionHeading, StatItem, StatRow } from "@/components/dashboard/ui";
import {
  TIME_ENTRIES_COLLECTION,
  formatDuration,
  formatTime,
  formatTimestamp,
  openShift,
  shiftDurationMs,
  sortByClockIn,
  type TimeEntry,
} from "@/lib/time-tracking";

function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export function TimeTracker() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = React.useState<TimeEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());

  const load = React.useCallback(async (uid: string) => {
    const snapshot = await getDocs(
      query(collection(firebaseDb, TIME_ENTRIES_COLLECTION), where("uid", "==", uid)),
    );
    const rows = snapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<TimeEntry, "id">),
    }));
    setEntries(sortByClockIn(rows));
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
        console.error("Unable to load time entries from Firestore", cause);
        if (active) setError("Unable to load your time entries.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, user, load]);

  // Tick the live "on the clock" duration once a minute.
  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const current = openShift(entries);

  const clockIn = React.useCallback(async () => {
    if (!user || current || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addDoc(collection(firebaseDb, TIME_ENTRIES_COLLECTION), {
        uid: user.uid,
        name: user.name ?? user.email ?? null,
        clockInAt: new Date().toISOString(),
        clockOutAt: null,
      });
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to clock in", cause);
      setError("Unable to clock in. Try again.");
    } finally {
      setBusy(false);
    }
  }, [user, current, busy, load]);

  const clockOut = React.useCallback(async () => {
    if (!user || !current || busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, TIME_ENTRIES_COLLECTION, current.id), {
        clockOutAt: new Date().toISOString(),
      });
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to clock out", cause);
      setError("Unable to clock out. Try again.");
    } finally {
      setBusy(false);
    }
  }, [user, current, busy, load]);

  if (!authLoading && !user) {
    return (
      <div className="mt-8">
        <EmptyState title="Sign in to track time" description="Clock in and out once you are signed in." />
      </div>
    );
  }

  const todayStart = startOfToday();
  const todayMs = entries
    .filter((entry) => Date.parse(entry.clockInAt) >= todayStart)
    .reduce((total, entry) => total + shiftDurationMs(entry, now), 0);
  const recent = entries.slice(0, 20);

  return (
    <div className="mt-8 space-y-8">
      {error ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px] text-primary">{error}</p>
      ) : null}

      <Panel className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</span>
          <p className="m-0 mt-1 text-[20px] font-bold leading-tight">
            {current ? "On the clock" : "Clocked out"}
          </p>
          <p className="mb-0 mt-1 text-[13px] text-muted-foreground">
            {current
              ? `Clocked in at ${formatTime(current.clockInAt)} · ${formatDuration(shiftDurationMs(current, now))} so far`
              : "You are not clocked in."}
          </p>
        </div>
        {current ? (
          <button
            type="button"
            onClick={clockOut}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-[14px] font-semibold text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {busy ? "Saving…" : "Clock out"}
          </button>
        ) : (
          <button
            type="button"
            onClick={clockIn}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {busy ? "Saving…" : "Clock in"}
          </button>
        )}
      </Panel>

      <StatRow>
        <StatItem label="Today" value={formatDuration(todayMs)} detail="Hours logged today" />
        <StatItem label="Status" value={current ? "In" : "Out"} detail={current ? "Currently working" : "Not working"} />
        <StatItem label="Shifts" value={entries.length} detail="Total recorded" />
      </StatRow>

      <section aria-labelledby="recent-shifts">
        <SectionHeading id="recent-shifts">Recent shifts</SectionHeading>
        {loading ? (
          <p className="text-[14px] text-muted-foreground">Loading…</p>
        ) : recent.length === 0 ? (
          <EmptyState title="No shifts yet" description="Clock in to record your first shift." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Clock in</th>
                  <th className="px-4 py-3 font-semibold">Clock out</th>
                  <th className="px-4 py-3 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">{formatTimestamp(entry.clockInAt)}</td>
                    <td className="px-4 py-3">
                      {entry.clockOutAt ? (
                        formatTimestamp(entry.clockOutAt)
                      ) : (
                        <span className="font-semibold text-primary">In progress</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatDuration(shiftDurationMs(entry, now))}</td>
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
