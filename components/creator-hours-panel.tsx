"use client";

import * as React from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { EmptyState } from "@/components/dashboard/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ACTIVITY_COLLECTION,
  elapsedMs,
  formatClockFull,
  formatTimestamp,
  sortByStartedAt,
  type ActivityEntry,
} from "@/lib/time-tracking";

/**
 * Hours logged, shown on a creator's profile page. Read-only summary and
 * table — starting/stopping a timer happens on the dedicated Tracker page,
 * not here.
 */
export function CreatorHoursPanel({ creatorUid, creatorName }: { creatorUid: string | null | undefined; creatorName: string }) {
  const [entries, setEntries] = React.useState<ActivityEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!creatorUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getDocs(query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", creatorUid)))
      .then((snapshot) => {
        if (!active) return;
        const rows = snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<ActivityEntry, "id">) }));
        setEntries(sortByStartedAt(rows));
      })
      .catch((cause) => {
        console.error("Unable to load tracked hours", cause);
        if (active) setError("Unable to load tracked hours.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [creatorUid]);

  const anyRunning = entries.some((entry) => entry.endedAt === null && !entry.pausedAt);
  React.useEffect(() => {
    if (!anyRunning) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [anyRunning]);

  if (!creatorUid) {
    return <EmptyState title="No account yet" description={`${creatorName} hasn’t signed in yet, so there’s no tracked time.`} />;
  }

  if (loading) {
    return (
      <div role="status" aria-label="Loading tracked hours" className="space-y-2">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return <p className="m-0 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px] text-primary">{error}</p>;
  }

  const recent = entries.slice(0, 20);

  return (
    <div className="space-y-4">
      {recent.length === 0 ? (
        <EmptyState title="Nothing logged yet" description={`${creatorName} hasn’t tracked any time yet.`} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table className="min-w-[560px] w-full border-collapse">
            <TableHeader>
              <TableRow className="bg-muted/40 text-left font-semibold uppercase text-muted-foreground">
                <TableHead className="px-4 py-3">Activity</TableHead>
                <TableHead className="px-4 py-3">Campaign</TableHead>
                <TableHead className="px-4 py-3">When</TableHead>
                <TableHead className="px-4 py-3">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((entry) => (
                <TableRow key={entry.id} className="align-top">
                  <TableCell className="px-4 py-3">{entry.activity || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="px-4 py-3">{entry.campaignName ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3">{formatTimestamp(entry.startedAt)}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3">
                    {entry.endedAt ? formatClockFull(elapsedMs(entry, now)) : <span className="font-semibold text-primary">Running…</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
