"use client";

import * as React from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { readJobsFromFirestore } from "@/lib/firebase/client-content";
import { TASK_COLLECTION, formatDate } from "@/lib/creator-tasks";
import { JOB_STATUS_LABELS, normalizeJob, type Job } from "@/lib/jobs";
import { JOB_TERMS_COLLECTION } from "@/lib/job-terms";
import { ACTIVITY_COLLECTION } from "@/lib/time-tracking";
import { PAYMENTS_COLLECTION } from "@/lib/payments";
import { jobHref } from "@/lib/jobs";

const filters = ["all", "active", "completed", "archive"] as const;
type JobFilter = (typeof filters)[number];

function matchesFilter(job: Job, filter: JobFilter) {
  if (filter === "all") return true;
  if (filter === "active") return job.status === "active";
  if (filter === "completed") return job.status === "completed";
  return job.status === "archived";
}

/** The shared jobs directory can show every job or only the signed-in person's jobs. */
export function JobsList({ assignedOnly = false }: { assignedOnly?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<JobFilter>("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    let active = true;
    const load = async () => {
      try {
        if (!assignedOnly) {
          const nextJobs = await readJobsFromFirestore();
          if (active) setJobs(nextJobs.sort((a, b) => (b.startDate ?? b.liveAt?.date ?? "").localeCompare(a.startDate ?? a.liveAt?.date ?? "")));
          return;
        }

        const [jobsName, termsSnapshot, taskSnapshot, timeSnapshot, paymentSnapshot] = await Promise.all([
          jobsCollection(),
          getDocs(query(collection(firebaseDb, JOB_TERMS_COLLECTION), where("assignedTo", "==", user.uid))),
          getDocs(query(collection(firebaseDb, TASK_COLLECTION), where("assignedTo", "==", user.uid))),
          getDocs(query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", user.uid))),
          getDocs(query(collection(firebaseDb, PAYMENTS_COLLECTION), where("payeeUid", "==", user.uid))),
        ]);
        const assignedJobIds = new Set<string>(termsSnapshot.docs.map((item) => item.id));
        taskSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) assignedJobIds.add(jobId); });
        timeSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) assignedJobIds.add(jobId); });
        paymentSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) assignedJobIds.add(jobId); });
        const snapshots = await Promise.all([...assignedJobIds].map((jobId) => getDoc(doc(firebaseDb, jobsName, jobId))));
        if (active) setJobs(snapshots.filter((item) => item.exists()).map((item) => normalizeJob(item.data() as Record<string, unknown>, item.id)).sort((a, b) => (b.startDate ?? b.liveAt?.date ?? "").localeCompare(a.startDate ?? a.liveAt?.date ?? "")));
      } catch (cause) {
        console.error("Unable to load jobs", cause);
        if (active) setError("Couldn’t load jobs. Try again later.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [assignedOnly, authLoading, user]);

  if (authLoading || loading) return <PageLoadingSkeleton titleWidth="w-32" />;
  const queryText = search.trim().toLowerCase();
  const visible = jobs.filter((job) => {
    if (!matchesFilter(job, filter)) return false;
    if (!queryText) return true;
    return [job.title, job.name, job.clientName, job.category, job.specialization]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(queryText);
  });

  return <DashboardListPage title={assignedOnly ? "My jobs" : "Jobs"}>
    <p className="mt-2 text-sm text-muted-foreground">{assignedOnly ? "Client jobs assigned to you, with their tasks, timesheets and payments in one place." : "Browse all client jobs and open a job to see its details."}</p>
    <FilterBar
      panelId={assignedOnly ? "my-jobs-filter" : "jobs-filter"}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search jobs"
      resultCount={`${visible.length} ${visible.length === 1 ? "job" : "jobs"}`}
      className="mt-5"
    />
    <div className="mt-6 flex gap-5 overflow-x-auto border-b border-border" role="group" aria-label="Job status">
      {filters.map((value) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-medium ${filter === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{value[0].toUpperCase() + value.slice(1)}</button>)}
    </div>
    {error ? <p role="alert" className="mt-5 text-sm text-destructive">{error}</p> : null}
    {visible.length ? <ul className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((job) => <li key={job.slug} className="rounded-xl border border-border bg-background">
        <Link href={jobHref(job.slug)} className="flex h-full min-h-64 flex-col p-5 text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">{JOB_STATUS_LABELS[job.status] ?? job.status}</span>
            {job.jobPostedAt ? <span className="text-xs text-muted-foreground">Posted {formatDate(job.jobPostedAt)}</span> : null}
          </div>
          <span className="mt-4 line-clamp-1 text-lg font-semibold">{job.clientName}</span>
          <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{job.title ?? job.name}</span>
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
            {job.specialization || job.category ? <span>{job.specialization || job.category}</span> : null}
            {job.workSetup ? <span>{job.workSetup}</span> : null}
            {job.estimatedLength ? <span>{job.estimatedLength}</span> : null}
          </div>
          {job.summary ? <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{job.summary}</p> : null}
          {job.requiredSkills?.length ? <div className="mt-4 flex flex-wrap gap-1.5">
            {job.requiredSkills.slice(0, 4).map((skill) => <span key={skill} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{skill}</span>)}
            {job.requiredSkills.length > 4 ? <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">+{job.requiredSkills.length - 4}</span> : null}
          </div> : null}
          <span className="mt-auto pt-5 text-xs text-muted-foreground">{job.desiredStartDate ? `Starts ${formatDate(job.desiredStartDate)}` : job.startDate ? `Started ${formatDate(job.startDate)}` : "Start date not set"}{job.endDate ? ` · Ends ${formatDate(job.endDate)}` : ""}</span>
        </Link>
      </li>)}
    </ul> : <div className="py-14 text-center"><h2 className="text-lg font-semibold">{jobs.length ? "No jobs match" : "No jobs yet"}</h2><p className="text-sm text-muted-foreground">{jobs.length ? "Choose another status." : assignedOnly ? "Jobs assigned to you will appear here." : "Jobs will appear here when they are added."}</p></div>}
  </DashboardListPage>;
}
