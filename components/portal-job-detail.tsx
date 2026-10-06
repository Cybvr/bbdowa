"use client";

import * as React from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, Pencil } from "lucide-react";
import { usePortalClient } from "@/components/portal-shell";
import { CreatorThumbnail } from "@/components/creator-thumbnail";
import { RichTextContent, richTextHasContent } from "@/components/rich-text-editor";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { longDate } from "@/lib/format";
import { JOB_STATUS_LABELS, jobTitle, normalizeJob, type Job } from "@/lib/jobs";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-1.5 text-body">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 break-words font-medium">{children}</dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
      <h2 className="m-0 text-item-title font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** A client's read-only view of one of their jobs. Nothing about pay or internal work. */
export function PortalJobDetail({ jobId }: { jobId: string }) {
  const portal = usePortalClient();
  const { users } = useFirestoreUsers();
  const [job, setJob] = React.useState<Job | null | undefined>(undefined);

  React.useEffect(() => {
    let active = true;
    jobsCollection()
      .then((name) => getDoc(doc(firebaseDb, name, jobId)))
      .then((snapshot) => { if (active) setJob(snapshot.exists() ? normalizeJob(snapshot.data() as Record<string, unknown>, snapshot.id) : null); })
      .catch(() => { if (active) setJob(null); });
    return () => { active = false; };
  }, [jobId]);

  const back = <Link href="/portal/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Jobs</Link>;
  if (job === undefined) return <div>{back}<p className="mt-6 text-sm text-muted-foreground">Loading…</p></div>;
  // Only this company's jobs, even if someone guesses another job's link.
  if (!job || job.clientId !== portal?.clientId) return <div>{back}<p className="mt-6 text-sm text-muted-foreground">This job doesn’t exist or isn’t yours.</p></div>;

  const lead = users.find((person) => person.slug === job.leadUserId);
  const team = users.filter((person) => person.slug && (job.creatorSlugs ?? []).includes(person.slug));

  return (
    <div className="grid gap-3">
      {back}
      <div>
        {job.campaignTitle && job.campaignTitle !== jobTitle(job) ? <p className="m-0 text-sm font-medium text-muted-foreground">{job.campaignTitle}</p> : null}
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="m-0 min-w-0 text-page-title font-semibold sm:text-page-title-lg">{jobTitle(job)}</h1>
          <Link href={`/portal/jobs/${encodeURIComponent(job.slug)}/edit`} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground no-underline hover:border-foreground"><Pencil aria-hidden="true" className="h-3.5 w-3.5" />Edit</Link>
        </div>
      </div>

      <Card title="About the job">
        {richTextHasContent(job.summary ?? "") ? <RichTextContent value={job.summary ?? ""} className="mt-3 text-body text-muted-foreground" /> : <p className="mb-0 mt-3 text-body text-muted-foreground">No description yet.</p>}
      </Card>

      <Card title="Details">
        <dl className="m-0 mt-3">
          <Row label="Status">{JOB_STATUS_LABELS[job.status]}</Row>
          <Row label="Category">{job.category || "—"}</Row>
          <Row label="Start">{job.startDate ? longDate(job.startDate) : "—"}</Row>
          <Row label="End">{job.endDate ? longDate(job.endDate) : "—"}</Row>
          <Row label="Est. length">{job.estimatedLength || "—"}</Row>
          <Row label="Work setup">{job.workSetup || "—"}</Row>
          <Row label="Budget">{job.fee || "—"}</Row>
        </dl>
      </Card>

      {job.requiredSkills?.length ? (
        <Card title="Tags">
          <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">{job.requiredSkills.map((tag) => <li key={tag} className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{tag}</li>)}</ul>
        </Card>
      ) : null}

      <Card title="Your team">
        {lead || team.length ? (
          <ul className="m-0 mt-3 grid list-none gap-2 p-0">
            {[...(lead ? [lead] : []), ...team.filter((person) => person.slug !== lead?.slug)].map((person) => (
              <li key={person.slug} className="flex min-w-0 items-center gap-3 text-body">
                <CreatorThumbnail imageSrc={person.profileImage} avatarSeed={person.name} className="h-8 w-8 shrink-0" />
                <span className="truncate font-medium">{person.name}</span>
                {person.slug === lead?.slug ? <span className="shrink-0 text-xs text-muted-foreground">Team lead</span> : null}
              </li>
            ))}
          </ul>
        ) : <p className="mb-0 mt-3 text-body text-muted-foreground">We’re putting the team together.</p>}
      </Card>
    </div>
  );
}
