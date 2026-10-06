"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { StatItem, StatRow } from "@/components/dashboard/ui";
import { usePortalClient } from "@/components/portal-shell";
import { PostJobButton } from "@/components/portal-job-brief";
import { readJobsFromFirestore } from "@/lib/firebase/client-content";
import { byLastModified, jobTitle, type Job } from "@/lib/jobs";

/** Portal home: a quick count of the company's jobs and the latest active ones. */
export function PortalHome() {
  const { user } = useAuth();
  const portal = usePortalClient();
  const [jobs, setJobs] = React.useState<Job[] | null>(null);
  const clientId = portal?.clientId;

  React.useEffect(() => {
    if (!clientId) return;
    let active = true;
    readJobsFromFirestore()
      .then((all) => { if (active) setJobs(all.filter((job) => job.clientId === clientId).sort(byLastModified)); })
      .catch(() => { if (active) setJobs([]); });
    return () => { active = false; };
  }, [clientId]);

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const activeJobs = (jobs ?? []).filter((job) => job.status === "active");

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="m-0 text-page-title font-bold sm:text-page-title-lg">Welcome{firstName ? `, ${firstName}` : ""}</h1>
        <p className="mb-0 mt-1 text-body text-muted-foreground">Here’s where your work with BBDO West Africa stands.</p>
        <div className="mt-4"><PostJobButton /></div>
      </div>

      <StatRow>
        <StatItem label="Active jobs" value={jobs ? activeJobs.length : "–"} />
        <StatItem label="Completed" value={jobs ? jobs.filter((job) => job.status === "completed").length : "–"} />
        <StatItem label="All jobs" value={jobs ? jobs.length : "–"} />
      </StatRow>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="m-0 text-item-title font-semibold">Active jobs</h2>
          <Link href="/portal/jobs" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">View all<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </div>
        {jobs === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : activeJobs.length ? (
          <ul className="m-0 grid list-none gap-2 p-0">
            {activeJobs.slice(0, 5).map((job) => (
              <li key={job.slug}>
                <Link href={`/portal/jobs/${encodeURIComponent(job.slug)}`} className="block rounded-xl border border-border bg-background p-4 text-foreground no-underline transition hover:border-foreground/30">
                  <span className="block truncate text-body font-semibold">{jobTitle(job)}</span>
                  {job.category ? <span className="mt-1 block text-xs text-muted-foreground">{job.category}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-border bg-background p-6 text-center text-sm text-muted-foreground">No active jobs yet. Post a job to get started.</p>
        )}
      </section>
    </div>
  );
}
