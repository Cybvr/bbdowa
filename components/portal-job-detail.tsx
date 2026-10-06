"use client";

import * as React from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, Eye, Pencil } from "lucide-react";
import { usePortalClient } from "@/components/portal-shell";
import { CreatorThumbnail } from "@/components/creator-thumbnail";
import { BasicsFields, BriefPreview, DetailsFields, TimingFields } from "@/components/portal-job-brief";
import { ShareCreatorDialog } from "@/components/share-creator-dialog";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { JOB_STATUS_LABELS, normalizeJob, type Job } from "@/lib/jobs";
import { briefFromJob, updateClientJob, type JobBrief } from "@/lib/portal-jobs";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
      <h2 className="m-0 text-item-title font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * A client's job page. It opens ready to edit; Preview shows the read-only
 * version and Share sends a link to a colleague.
 */
export function PortalJobDetail({ jobId }: { jobId: string }) {
  const portal = usePortalClient();
  const { users } = useFirestoreUsers();
  const [job, setJob] = React.useState<Job | null | undefined>(undefined);
  const [brief, setBrief] = React.useState<JobBrief | null>(null);
  const [saved, setSaved] = React.useState<JobBrief | null>(null);
  const [preview, setPreview] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    jobsCollection()
      .then((name) => getDoc(doc(firebaseDb, name, jobId)))
      .then((snapshot) => {
        if (!active) return;
        const loaded = snapshot.exists() ? normalizeJob(snapshot.data() as Record<string, unknown>, snapshot.id) : null;
        setJob(loaded);
        if (loaded) {
          setBrief(briefFromJob(loaded));
          setSaved(briefFromJob(loaded));
        }
      })
      .catch(() => { if (active) setJob(null); });
    return () => { active = false; };
  }, [jobId]);

  const back = <Link href="/portal/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Jobs</Link>;
  if (job === undefined) return <div>{back}<p className="mt-6 text-sm text-muted-foreground">Loading…</p></div>;
  // Only this company's jobs, even if someone guesses another job's link.
  if (!job || !brief || job.clientId !== portal?.clientId) return <div>{back}<p className="mt-6 text-sm text-muted-foreground">This job doesn’t exist or isn’t yours.</p></div>;

  const dirty = JSON.stringify(brief) !== JSON.stringify(saved);
  const change = <K extends keyof JobBrief>(key: K, value: JobBrief[K]) => setBrief((current) => (current ? { ...current, [key]: value } : current));

  const save = async () => {
    if (!brief.title.trim()) return setError("Give the job a title.");
    if (brief.startDate && brief.endDate && brief.endDate < brief.startDate) return setError("The end date must be after the start date.");
    setSaving(true);
    setError(null);
    try {
      await updateClientJob(job.slug, brief);
      setSaved(brief);
    } catch (cause) {
      console.error("Unable to save job", cause);
      setError("Couldn’t save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const lead = users.find((person) => person.slug === job.leadUserId);
  const team = users.filter((person) => person.slug && (job.creatorSlugs ?? []).includes(person.slug) && person.slug !== lead?.slug);

  return (
    <div className="grid gap-3">
      {back}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="m-0 truncate text-page-title font-semibold sm:text-page-title-lg">{brief.title || "Untitled job"}</h1>
          <p className="m-0 mt-1 text-sm text-muted-foreground">{JOB_STATUS_LABELS[job.status]}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setPreview((value) => !value)} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-semibold hover:border-foreground">
            {preview ? <><Pencil aria-hidden="true" className="h-3.5 w-3.5" />Edit</> : <><Eye aria-hidden="true" className="h-3.5 w-3.5" />Preview</>}
          </button>
          <ShareCreatorDialog creatorName={brief.title || "this job"} path={`/portal/jobs/${encodeURIComponent(job.slug)}`} kind="job" showLabel className="border border-border" />
        </div>
      </div>

      {preview ? (
        <BriefPreview brief={saved ?? brief} />
      ) : (
        <>
          <Card title="Basics"><BasicsFields brief={brief} change={change} /></Card>
          <Card title="Details"><DetailsFields brief={brief} change={change} /></Card>
          <Card title="Timing and budget"><TimingFields brief={brief} change={change} /></Card>
          {error ? <p role="alert" className="m-0 text-sm text-destructive">{error}</p> : null}
          <div className="sticky bottom-20 z-10 flex items-center justify-end gap-3 nav:bottom-4">
            {dirty ? <button type="button" onClick={() => setBrief(saved)} className="h-10 rounded-md bg-background px-4 text-sm font-semibold text-muted-foreground hover:text-foreground">Discard</button> : null}
            <button type="button" onClick={() => void save()} disabled={!dirty || saving} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50">{saving ? "Saving…" : dirty ? "Save changes" : "Saved"}</button>
          </div>
        </>
      )}

      <Card title="Your team">
        {lead || team.length ? (
          <ul className="m-0 grid list-none gap-2 p-0">
            {[...(lead ? [lead] : []), ...team].map((person) => (
              <li key={person.slug} className="flex min-w-0 items-center gap-3 text-body">
                <CreatorThumbnail imageSrc={person.profileImage} avatarSeed={person.name} className="h-8 w-8 shrink-0" />
                <span className="truncate font-medium">{person.name}</span>
                {person.slug === lead?.slug ? <span className="shrink-0 text-xs text-muted-foreground">Team lead</span> : null}
              </li>
            ))}
          </ul>
        ) : <p className="m-0 text-body text-muted-foreground">We’re putting the team together.</p>}
      </Card>
    </div>
  );
}
