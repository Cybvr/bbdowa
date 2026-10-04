"use client";

import * as React from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { EmptyState } from "@/components/dashboard/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

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
  const selected = entries.find((entry) => entry.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      {recent.length === 0 ? (
        <EmptyState title="Nothing logged yet" description={`${creatorName} hasn’t tracked any time yet.`} />
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[560px] w-full border-collapse">
            <TableHeader>
              <TableRow className="text-left font-semibold uppercase text-muted-foreground">
                <TableHead className="px-4 py-3">Activity</TableHead>
                <TableHead className="px-4 py-3">Job</TableHead>
                <TableHead className="px-4 py-3">When</TableHead>
                <TableHead className="px-4 py-3">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((entry) => (
                <ClickableTableRow key={entry.id} label={`Open activity ${entry.activity}`} onActivate={() => setSelectedId(entry.id)} className="align-middle">
                  <TableCell className="px-4 py-3">{entry.activity || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="px-4 py-3">{entry.jobName ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3">{formatTimestamp(entry.startedAt)}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3">
                    {entry.endedAt ? formatClockFull(elapsedMs(entry, now)) : <span className="font-semibold text-primary">Running…</span>}
                  </TableCell>
                </ClickableTableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pr-10"><DialogTitle>{selected?.activity || "Activity"}</DialogTitle><DialogDescription>{selected?.jobName || "No job"}</DialogDescription></DialogHeader>
          {selected ? <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs text-muted-foreground">Started</dt><dd className="mt-1 font-semibold">{formatTimestamp(selected.startedAt)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Time</dt><dd className="mt-1 font-semibold tabular-nums">{formatClockFull(elapsedMs(selected, now))}</dd></div>
            {selected.endedAt ? <div><dt className="text-xs text-muted-foreground">Stopped</dt><dd className="mt-1 font-semibold">{formatTimestamp(selected.endedAt)}</dd></div> : null}
          </dl> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
