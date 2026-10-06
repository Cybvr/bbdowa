"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { usePortalClient } from "@/components/portal-shell";
import { readJobsFromFirestore } from "@/lib/firebase/client-content";
import { longDate } from "@/lib/format";
import { JOB_STATUS_LABELS, byLastModified, jobRecentDate, jobTitle, type Job } from "@/lib/jobs";

const TABS = ["active", "completed", "archived"] as const;

/** Every job for the signed-in client's company. */
export function PortalJobs() {
  const portal = usePortalClient();
  const [jobs, setJobs] = React.useState<Job[] | null>(null);
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("active");
  const [search, setSearch] = React.useState("");
  const clientId = portal?.clientId;

  React.useEffect(() => {
    if (!clientId) return;
    let active = true;
    readJobsFromFirestore()
      .then((all) => { if (active) setJobs(all.filter((job) => job.clientId === clientId).sort(byLastModified)); })
      .catch(() => { if (active) setJobs([]); });
    return () => { active = false; };
  }, [clientId]);

  const term = search.trim().toLowerCase();
  const visible = (jobs ?? []).filter((job) => job.status === tab && (!term || [jobTitle(job), job.campaignTitle, job.category].filter(Boolean).join(" ").toLowerCase().includes(term)));
  const count = (status: string) => (jobs ?? []).filter((job) => job.status === status).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-page-title font-bold max-nav:hidden sm:text-page-title-lg">Jobs</h1>
        <Link href="/portal/jobs/new" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground no-underline hover:opacity-90"><Plus aria-hidden="true" className="h-4 w-4" />Post a job</Link>
      </div>
      <p className="mb-0 mt-1 text-body text-muted-foreground max-nav:mt-0">Everything we’re working on for {portal?.client?.name ?? "you"}.</p>

      <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs" aria-label="Search jobs" className="mt-5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/40" />

      <div className="mt-4 flex gap-5 border-b border-border" role="group" aria-label="Job status">
        {TABS.map((value) => (
          <button key={value} type="button" onClick={() => setTab(value)} aria-pressed={tab === value} className={`border-b-2 px-1 pb-3 text-sm font-medium ${tab === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {JOB_STATUS_LABELS[value]} <span className="text-muted-foreground">{jobs ? count(value) : ""}</span>
          </button>
        ))}
      </div>

      {jobs === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading your jobs…</p>
      ) : visible.length ? (
        <ul className="m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
          {visible.map((job) => (
            <li key={job.slug}>
              <Link href={`/portal/jobs/${encodeURIComponent(job.slug)}`} className="block h-full rounded-xl border border-border bg-background p-4 text-foreground no-underline transition hover:border-foreground/30">
                {job.campaignTitle && job.campaignTitle !== jobTitle(job) ? <span className="line-clamp-1 text-[13px] font-medium text-muted-foreground">{job.campaignTitle}</span> : null}
                <h2 className="m-0 mt-1 line-clamp-2 text-item-title font-semibold">{jobTitle(job)}</h2>
                {job.category ? <p className="m-0 mt-2 text-xs text-muted-foreground">{job.category}</p> : null}
                <p className="m-0 mt-2 flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />{longDate(jobRecentDate(job))}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">{term ? "No jobs match your search." : `No ${JOB_STATUS_LABELS[tab].toLowerCase()} jobs.`}</p>
      )}
    </div>
  );
}
