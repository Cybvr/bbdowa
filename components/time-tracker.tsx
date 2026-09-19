"use client";

import * as React from "react";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
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
  formatDuration,
  formatTimestamp,
  sortByLoggedAt,
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

  const [activity, setActivity] = React.useState("");
  const [campaignSlug, setCampaignSlug] = React.useState<string>(NO_CAMPAIGN);
  const [hours, setHours] = React.useState("");
  const [minutes, setMinutes] = React.useState("");

  const load = React.useCallback(async (uid: string) => {
    const snapshot = await getDocs(
      query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", uid)),
    );
    const rows = snapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<ActivityEntry, "id">),
    }));
    setEntries(sortByLoggedAt(rows));
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

  const durationMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  const canLog = activity.trim().length > 0 && durationMinutes > 0;

  const logActivity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !canLog || busy) return;
    setBusy(true);
    setError(null);
    try {
      const chosen = campaigns.find((option) => option.slug === campaignSlug);
      await addDoc(collection(firebaseDb, ACTIVITY_COLLECTION), {
        uid: user.uid,
        name: user.name ?? user.email ?? null,
        campaignSlug: chosen?.slug ?? null,
        campaignName: chosen?.name ?? null,
        activity: activity.trim(),
        durationMinutes,
        loggedAt: new Date().toISOString(),
      });
      setActivity("");
      setCampaignSlug(NO_CAMPAIGN);
      setHours("");
      setMinutes("");
      await load(user.uid);
    } catch (cause) {
      console.error("Unable to log activity", cause);
      setError("Couldn’t log that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="mt-8">
        <EmptyState title="Sign in to track activity" description="Log what you’re working on once you’re signed in." />
      </div>
    );
  }

  const todayStart = startOfToday();
  const todayMinutes = entries
    .filter((entry) => Date.parse(entry.loggedAt) >= todayStart)
    .reduce((total, entry) => total + (entry.durationMinutes || 0), 0);
  const recent = entries.slice(0, 30);

  return (
    <div className="mt-8 space-y-8">
      {error ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px] text-primary">{error}</p>
      ) : null}

      <Panel>
        <form onSubmit={logActivity} className="space-y-4">
          <div className="space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Activity</span>
            <Input value={activity} onChange={(event) => setActivity(event.target.value)} disabled={busy} placeholder="What did you work on?" />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
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
              <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Hours</span>
              <Input type="number" min={0} inputMode="numeric" value={hours} onChange={(event) => setHours(event.target.value)} disabled={busy} placeholder="0" className="w-full sm:w-20" />
            </div>
            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Minutes</span>
              <Input type="number" min={0} max={59} inputMode="numeric" value={minutes} onChange={(event) => setMinutes(event.target.value)} disabled={busy} placeholder="0" className="w-full sm:w-20" />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy || !canLog}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {busy ? "Saving…" : "Log activity"}
          </button>
        </form>
      </Panel>

      <StatRow>
        <StatItem label="Today" value={formatDuration(todayMinutes)} />
        <StatItem label="Entries" value={entries.length} />
        <StatItem label="Campaigns" value={new Set(entries.map((entry) => entry.campaignSlug).filter(Boolean)).size} />
      </StatRow>

      <section aria-labelledby="recent-activity">
        <SectionHeading id="recent-activity">Recent activity</SectionHeading>
        {loading ? (
          <p className="text-[14px] text-muted-foreground">Loading…</p>
        ) : recent.length === 0 ? (
          <EmptyState title="Nothing logged yet" description="Add your first activity above." />
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
                    <td className="hidden px-4 py-3 whitespace-nowrap sm:table-cell">{formatTimestamp(entry.loggedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDuration(entry.durationMinutes || 0)}</td>
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
