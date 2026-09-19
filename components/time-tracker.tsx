"use client";

import * as React from "react";
import { collection, getDocs } from "firebase/firestore";
import { useTimeClock } from "@/components/use-time-clock";
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
import { formatDuration, formatTime, formatTimestamp, shiftDurationMs } from "@/lib/time-tracking";

type CampaignOption = { slug: string; name: string };

const NO_CAMPAIGN = "none";

function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export function TimeTracker() {
  const { authLoading, signedIn, entries, current, loading, error, busy, now, clockIn, clockOut } = useTimeClock();
  const [campaigns, setCampaigns] = React.useState<CampaignOption[]>([]);
  const [campaignSlug, setCampaignSlug] = React.useState<string>(NO_CAMPAIGN);
  const [description, setDescription] = React.useState("");

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

  const handleClockIn = () => {
    const chosen = campaigns.find((option) => option.slug === campaignSlug);
    void clockIn({
      campaignSlug: chosen?.slug ?? null,
      campaignName: chosen?.name ?? null,
      description: description.trim(),
    });
    setDescription("");
    setCampaignSlug(NO_CAMPAIGN);
  };

  if (!authLoading && !signedIn) {
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

      <Panel>
        {current ? (
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">On the clock</span>
              <p className="m-0 mt-1 text-[20px] font-bold leading-tight">
                {current.campaignName ?? "No campaign"}
              </p>
              <p className="mb-0 mt-1 text-[13px] text-muted-foreground">
                {current.description ? `${current.description} · ` : ""}
                Since {formatTime(current.clockInAt)} · {formatDuration(shiftDurationMs(current, now))}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void clockOut()}
              disabled={busy}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background px-6 text-[14px] font-semibold text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {busy ? "Saving…" : "Clock out"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Clocked out</span>
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
                <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Doing</span>
                <Input value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} placeholder="What are you working on?" />
              </div>
            </div>
            <button
              type="button"
              onClick={handleClockIn}
              disabled={busy}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {busy ? "Saving…" : "Clock in"}
            </button>
          </div>
        )}
      </Panel>

      <StatRow>
        <StatItem label="Today" value={formatDuration(todayMs)} />
        <StatItem label="Status" value={current ? "In" : "Out"} />
        <StatItem label="Shifts" value={entries.length} />
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
                  <th className="px-4 py-3 font-semibold">Campaign</th>
                  <th className="px-4 py-3 font-semibold">Work</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">In</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">Out</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-b-0 align-top">
                    <td className="px-4 py-3">{entry.campaignName ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3">{entry.description ? entry.description : <span className="text-muted-foreground">—</span>}</td>
                    <td className="hidden px-4 py-3 whitespace-nowrap sm:table-cell">{formatTimestamp(entry.clockInAt)}</td>
                    <td className="hidden px-4 py-3 whitespace-nowrap sm:table-cell">
                      {entry.clockOutAt ? (
                        formatTimestamp(entry.clockOutAt)
                      ) : (
                        <span className="font-semibold text-primary">In progress</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDuration(shiftDurationMs(entry, now))}</td>
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
