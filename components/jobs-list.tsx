"use client";

import * as React from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
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

/** Jobs assigned to the signed-in person. Staff manage every job from /admin/jobs. */
export function JobsList() {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<JobFilter>("all");

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    let active = true;
    Promise.all([
      jobsCollection(),
      getDocs(query(collection(firebaseDb, JOB_TERMS_COLLECTION), where("assignedTo", "==", user.uid))),
      getDocs(query(collection(firebaseDb, TASK_COLLECTION), where("assignedTo", "==", user.uid))),
      getDocs(query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", user.uid))),
      getDocs(query(collection(firebaseDb, PAYMENTS_COLLECTION), where("payeeUid", "==", user.uid))),
    ])
      .then(([jobsName, termsSnapshot, taskSnapshot, timeSnapshot, paymentSnapshot]) => {
        const assignedJobIds = new Set<string>(termsSnapshot.docs.map((item) => item.id));
        taskSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) assignedJobIds.add(jobId); });
        timeSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) assignedJobIds.add(jobId); });
        paymentSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) assignedJobIds.add(jobId); });
        return Promise.all([...assignedJobIds].map((jobId) => getDoc(doc(firebaseDb, jobsName, jobId))));
      })
      .then((snapshots) => {
        if (!active) return;
        setJobs(snapshots.filter((item) => item.exists()).map((item) => normalizeJob(item.data() as Record<string, unknown>, item.id)).sort((a, b) => (b.startDate ?? b.liveAt?.date ?? "").localeCompare(a.startDate ?? a.liveAt?.date ?? "")));
      })
      .catch((cause) => { console.error("Unable to load jobs", cause); if (active) setError("Couldn’t load jobs. Try again later."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, user]);

  if (authLoading || loading) return <PageLoadingSkeleton titleWidth="w-32" />;
  const visible = jobs.filter((job) => matchesFilter(job, filter));

  return <DashboardListPage title="My jobs">
    <p className="mt-2 text-sm text-muted-foreground">Client jobs assigned to you, with their tasks, timesheets and payments in one place.</p>
    <div className="mt-6 flex gap-5 overflow-x-auto border-b border-border" role="group" aria-label="Job status">
      {filters.map((value) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-medium ${filter === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{value[0].toUpperCase() + value.slice(1)}</button>)}
    </div>
    {error ? <p role="alert" className="mt-5 text-sm text-destructive">{error}</p> : null}
    {visible.length ? <ul className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((job) => <li key={job.slug} className="rounded-xl border border-border bg-background">
        <Link href={jobHref(job.slug)} className="flex h-full min-h-44 flex-col p-5 text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="text-xs font-medium text-muted-foreground">{JOB_STATUS_LABELS[job.status] ?? job.status}</span>
          <span className="mt-4 line-clamp-1 text-lg font-semibold">{job.clientName}</span>
          <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{job.title ?? job.name}</span>
          <span className="mt-auto pt-5 text-xs text-muted-foreground">{job.startDate ? `Started ${formatDate(job.startDate)}` : "No start date"}{job.endDate ? ` · Ends ${formatDate(job.endDate)}` : ""}</span>
        </Link>
      </li>)}
    </ul> : <div className="py-14 text-center"><h2 className="text-lg font-semibold">{jobs.length ? "No jobs match" : "No jobs yet"}</h2><p className="text-sm text-muted-foreground">{jobs.length ? "Choose another status." : "Jobs assigned to you will appear here."}</p></div>}
  </DashboardListPage>;
}
