"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { previewTeamMigration, runTeamMigration, type TeamMigrationCounts } from "@/lib/firebase/run-team-migration";

function CountList({ counts }: { counts: TeamMigrationCounts }) {
  const rows: [string, number][] = [
    ["Job teams updated", counts.jobTeams],
    ["People added to job teams", counts.peopleAdded],
    ["Jobs created for client tasks", counts.jobsCreated],
    ["Tasks moved onto jobs", counts.tasksMoved],
    ["Jobs with client media", counts.jobsWithMedia],
    ["Media items moved", counts.mediaMoved],
    ["Jobs given team access", counts.jobAccess],
  ];
  return <dl className="m-0 mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1 text-sm">
    {rows.map(([label, value]) => <React.Fragment key={label}><dt className="text-muted-foreground">{label}</dt><dd className="m-0 text-right font-semibold tabular-nums">{value}</dd></React.Fragment>)}
  </dl>;
}

/** Client teams, client-only tasks and client media → jobs. Admins only. */
export function TeamMigrationPanel() {
  const { isAdmin, isViewingAs } = useAuth();
  const [preview, setPreview] = React.useState<TeamMigrationCounts | null>(null);
  const [result, setResult] = React.useState<TeamMigrationCounts | null>(null);
  const [busy, setBusy] = React.useState<null | "preview" | "run">(null);
  const [error, setError] = React.useState<string | null>(null);

  if (!isAdmin || isViewingAs) return null;

  const run = async (kind: "preview" | "run", task: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await task();
    } catch (cause) {
      console.error(`Team migration ${kind} failed`, cause);
      setError(cause instanceof Error ? cause.message : "Something went wrong. You can run it again safely.");
    } finally {
      setBusy(null);
    }
  };

  const nothingToDo = preview && !preview.jobTeams && !preview.jobsCreated && !preview.jobsWithMedia && !preview.jobAccess;

  return <section className="rounded-xl border border-border p-5">
    <h2 className="m-0 text-base font-semibold">Move client teams, tasks and media to jobs</h2>
    <p className="mb-0 mt-2 text-sm text-muted-foreground">
      Adds each client&apos;s team to every one of its jobs, creates a job for each task that only names a client (named after the task), moves client media onto the job it was saved on, and gives everyone on a job&apos;s team access to it so it shows on their dashboard. Safe to run more than once.
    </p>

    {preview && !result ? nothingToDo ? <p className="mb-0 mt-4 text-sm font-medium">Nothing left to move.</p> : <><p className="mb-0 mt-4 text-sm font-semibold">This will change:</p><CountList counts={preview} /></> : null}
    {result ? <><p className="mb-0 mt-4 text-sm font-semibold">Migration finished:</p><CountList counts={result} /></> : null}

    <div className="mt-4 flex flex-wrap gap-2">
      {!preview || result ? (
        <Button type="button" variant="outline" disabled={Boolean(busy)} onClick={() => void run("preview", async () => { setResult(null); setPreview(await previewTeamMigration()); })}>
          {busy === "preview" ? "Checking…" : result ? "Check again" : "Check what will move"}
        </Button>
      ) : (
        <>
          {!nothingToDo ? <Button type="button" disabled={Boolean(busy)} onClick={() => void run("run", async () => setResult(await runTeamMigration()))}>
            {busy === "run" ? "Moving…" : "Run migration"}
          </Button> : null}
          <Button type="button" variant="outline" disabled={Boolean(busy)} onClick={() => setPreview(null)}>Cancel</Button>
        </>
      )}
    </div>

    {error ? <p role="alert" className="mb-0 mt-3 text-sm text-destructive">{error}</p> : null}
  </section>;
}
