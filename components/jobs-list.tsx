"use client";

import * as React from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { JobCard } from "@/components/job-card";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { readJobsFromFirestore } from "@/lib/firebase/client-content";
import { TASK_COLLECTION } from "@/lib/creator-tasks";
import { jobRecentDate, jobTitle, normalizeJob, type Job } from "@/lib/jobs";
import { readMyJobIds } from "@/lib/firebase/job-team";
import { ACTIVITY_COLLECTION } from "@/lib/time-tracking";
import { PAYMENTS_COLLECTION } from "@/lib/payments";

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
          if (active) setJobs(nextJobs.sort((a, b) => (jobRecentDate(b) ?? "").localeCompare(jobRecentDate(a) ?? "")));
          return;
        }

        const [jobsName, myJobIds, taskSnapshot, timeSnapshot, paymentSnapshot] = await Promise.all([
          jobsCollection(),
          readMyJobIds(user.uid),
          getDocs(query(collection(firebaseDb, TASK_COLLECTION), where("assignedTo", "==", user.uid))),
          getDocs(query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", user.uid))),
          getDocs(query(collection(firebaseDb, PAYMENTS_COLLECTION), where("payeeUid", "==", user.uid))),
        ]);
        const assignedJobIds = new Set<string>(myJobIds);
        taskSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) assignedJobIds.add(jobId); });
        timeSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) assignedJobIds.add(jobId); });
        paymentSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) assignedJobIds.add(jobId); });
        const snapshots = await Promise.all([...assignedJobIds].map((jobId) => getDoc(doc(firebaseDb, jobsName, jobId))));
        if (active) setJobs(snapshots.filter((item) => item.exists()).map((item) => normalizeJob(item.data() as Record<string, unknown>, item.id)).sort((a, b) => (jobRecentDate(b) ?? "").localeCompare(jobRecentDate(a) ?? "")));
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
    return [jobTitle(job), job.title, job.name, job.clientName, job.category, job.specialization]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(queryText);
  });

  return <DashboardListPage title={assignedOnly ? "My jobs" : "Jobs"}>
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
      {visible.map((job) => <li key={job.slug}><JobCard job={job} myJobs={assignedOnly} /></li>)}
    </ul> : <div className="py-14 text-center"><h2 className="text-lg font-semibold">{jobs.length ? "No jobs match" : "No jobs yet"}</h2><p className="text-sm text-muted-foreground">{jobs.length ? "Choose another status." : assignedOnly ? "Jobs assigned to you will appear here." : "Jobs will appear here when they are added."}</p></div>}
  </DashboardListPage>;
}
