"use client";

import * as React from "react";
import { confirmDialog } from "@/components/confirm-dialog";
import { useAuth } from "@/components/auth-provider";
import { isSuperAdminEmail, type MigrationState } from "@/lib/job-migration";
import {
  countLegacyCampaigns,
  deleteLegacyCampaigns,
  previewJobMigration,
  readJobMigrationState,
  runJobMigration,
  type JobMigrationCounts,
} from "@/lib/firebase/run-job-migration";

const BUTTON = "h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50";

function CountList({ counts }: { counts: JobMigrationCounts }) {
  const rows: [string, number][] = [
    ["Campaigns copied to jobs", counts.jobs],
    ["Already in jobs (skipped)", counts.jobsAlreadyMoved],
    ["Careers openings moved", counts.openings],
    ["Tasks relinked", counts.tasks],
    ["Time entries relinked", counts.timeEntries],
    ["Payments relinked", counts.payments],
  ];
  return <dl className="m-0 mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1 text-sm">
    {rows.map(([label, value]) => <React.Fragment key={label}><dt className="text-muted-foreground">{label}</dt><dd className="m-0 text-right font-semibold tabular-nums">{value}</dd></React.Fragment>)}
  </dl>;
}

/** One-off campaigns → jobs move. Only shown to super admins (NEXT_PUBLIC_SUPER_ADMIN_EMAILS). */
export function JobMigrationPanel() {
  const { actualUser, isAdmin, isViewingAs } = useAuth();
  const allowed = isAdmin && !isViewingAs && isSuperAdminEmail(actualUser?.email);
  const [state, setState] = React.useState<MigrationState | null>(null);
  const [legacyCount, setLegacyCount] = React.useState<number | null>(null);
  const [preview, setPreview] = React.useState<JobMigrationCounts | null>(null);
  const [result, setResult] = React.useState<JobMigrationCounts | null>(null);
  const [busy, setBusy] = React.useState<null | "preview" | "run" | "delete">(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const [nextState, nextCount] = await Promise.all([readJobMigrationState(), countLegacyCampaigns()]);
    setState(nextState);
    setLegacyCount(nextCount);
  }, []);

  React.useEffect(() => {
    if (!allowed) return;
    refresh().catch((cause) => { console.error("Unable to read migration state", cause); setError("Couldn’t check the migration state."); });
  }, [allowed, refresh]);

  if (!allowed) return null;

  const run = async (kind: "preview" | "run" | "delete", task: () => Promise<void>) => {
    setBusy(kind); setError(null); setMessage(null);
    try { await task(); } catch (cause) {
      console.error(`Job migration ${kind} failed`, cause);
      setError(cause instanceof Error ? cause.message : "Something went wrong. Nothing after the failed step was changed; you can run it again.");
    } finally { setBusy(null); }
  };

  return <section className="rounded-xl border border-border p-5">
    <h2 className="m-0 text-base font-semibold">Move campaigns to jobs</h2>
    <p className="mb-0 mt-2 text-sm text-muted-foreground">
      Copies every campaign into the new jobs collection, moves careers openings to their own collection, and relinks tasks, time entries and payments. Old campaigns are kept as a backup. Safe to run more than once.
    </p>
    {state?.done ? <p className="mb-0 mt-3 text-sm font-medium">Done{state.ranAt ? ` on ${new Date(state.ranAt).toLocaleString("en-GB")}` : ""}. The app now uses jobs.</p> : null}

    {preview && !result ? <><p className="mb-0 mt-4 text-sm font-semibold">This will change:</p><CountList counts={preview} /></> : null}
    {result ? <><p className="mb-0 mt-4 text-sm font-semibold">Migration finished:</p><CountList counts={result} /></> : null}

    <div className="mt-4 flex flex-wrap gap-2">
      {!preview ? (
        <button type="button" disabled={Boolean(busy)} onClick={() => void run("preview", async () => setPreview(await previewJobMigration()))} className={`${BUTTON} border border-border hover:bg-muted`}>
          {busy === "preview" ? "Checking…" : state?.done ? "Check again" : "Check what will move"}
        </button>
      ) : !result ? (
        <button type="button" disabled={Boolean(busy)} onClick={() => void run("run", async () => {
          if (!actualUser) return;
          setResult(await runJobMigration(actualUser.email ?? actualUser.uid));
          await refresh();
        })} className={`${BUTTON} bg-primary text-primary-foreground`}>
          {busy === "run" ? "Moving…" : "Run migration"}
        </button>
      ) : null}
      {preview && !result ? <button type="button" disabled={Boolean(busy)} onClick={() => setPreview(null)} className={`${BUTTON} border border-border hover:bg-muted`}>Cancel</button> : null}
    </div>

    {state?.done && legacyCount ? <div className="mt-5 border-t border-border pt-4">
      <p className="m-0 text-sm text-muted-foreground">{legacyCount} old campaign {legacyCount === 1 ? "record is" : "records are"} still kept as a backup. Delete them once you’ve checked the jobs look right.</p>
      <button type="button" disabled={Boolean(busy)} onClick={async () => {
        if (!await confirmDialog(`Delete ${legacyCount} old campaign records? This can’t be undone.`)) return;
        void run("delete", async () => { const removed = await deleteLegacyCampaigns(); setMessage(`Deleted ${removed} old campaign records.`); await refresh(); });
      }} className={`${BUTTON} mt-3 border border-destructive text-destructive hover:bg-destructive/10`}>
        {busy === "delete" ? "Deleting…" : "Delete old campaigns"}
      </button>
    </div> : null}

    {message ? <p className="mb-0 mt-3 text-sm font-medium">{message}</p> : null}
    {error ? <p role="alert" className="mb-0 mt-3 text-sm text-destructive">{error}</p> : null}
  </section>;
}
