"use client";

import * as React from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { Search } from "lucide-react";
import { useSavedJobs } from "@/lib/firebase/saved-jobs";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { JobCard } from "@/components/job-card";
import { CreatorTasksPanel } from "@/components/tasks-view";
import TasksManagementPage from "@/components/tasks-management-page";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { readJobsFromFirestore } from "@/lib/firebase/client-content";
import { TASK_COLLECTION } from "@/lib/creator-tasks";
import { byLastModified, jobTitle, normalizeJob, type Job } from "@/lib/jobs";
import { readMyJobIds } from "@/lib/firebase/job-team";
import { ACTIVITY_COLLECTION } from "@/lib/time-tracking";
import { PAYMENTS_COLLECTION } from "@/lib/payments";
import { readTasksAssignedTo } from "@/lib/firebase/task-queries";

const filters = ["active", "completed", "archive", "saved"] as const;
type JobFilter = (typeof filters)[number];

function matchesFilter(job: Job, filter: JobFilter, saved: string[]) {
  if (filter === "saved") return saved.includes(job.slug);
  if (filter === "active") return job.status === "active";
  if (filter === "completed") return job.status === "completed";
  return job.status === "archived";
}

/** The shared jobs directory can show every job or only the signed-in person's jobs. */
export function JobsList({ assignedOnly = false, tab = "jobs" }: { assignedOnly?: boolean; tab?: "jobs" | "tasks" }) {
  const { user, role, isAdmin, loading: authLoading } = useAuth();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<JobFilter>("active");
  const [search, setSearch] = React.useState("");
  const savedJobs = useSavedJobs(user?.uid);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    let active = true;
    const load = async () => {
      try {
        if (!assignedOnly) {
          const nextJobs = await readJobsFromFirestore();
          if (active) setJobs(nextJobs.sort(byLastModified));
          return;
        }

        const [jobsName, myJobIds, taskSnapshot, timeSnapshot, paymentSnapshot] = await Promise.all([
          jobsCollection(),
          readMyJobIds(user.uid, user.email),
          readTasksAssignedTo(user.uid),
          getDocs(query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", user.uid))),
          getDocs(query(collection(firebaseDb, PAYMENTS_COLLECTION), where("payeeUid", "==", user.uid))),
        ]);
        const assignedJobIds = new Set<string>(myJobIds);
        taskSnapshot.forEach((item) => { const jobId = item.jobId; if (typeof jobId === "string" && jobId) assignedJobIds.add(jobId); });
        timeSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) assignedJobIds.add(jobId); });
        paymentSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) assignedJobIds.add(jobId); });
        const snapshots = await Promise.all([...assignedJobIds].map((jobId) => getDoc(doc(firebaseDb, jobsName, jobId))));
        if (active) setJobs(snapshots.filter((item) => item.exists()).map((item) => normalizeJob(item.data() as Record<string, unknown>, item.id)).sort(byLastModified));
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
    if (!matchesFilter(job, filter, savedJobs)) return false;
    if (!queryText) return true;
    return [jobTitle(job), job.title, job.name, job.clientName, job.category, job.specialization]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(queryText);
  });

  return <DashboardListPage title={assignedOnly ? "My jobs" : "Jobs"}>
    {assignedOnly ? <div className="mt-5 flex gap-6 border-b border-border" role="tablist" aria-label="My work">
      {(["jobs", "tasks"] as const).map((value) => <Link key={value} href={value === "jobs" ? "/dashboard/my-jobs" : "/dashboard/my-jobs/tasks"} role="tab" aria-selected={tab === value} className={`border-b-2 px-1 pb-3 text-sm font-semibold ${tab === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{value === "jobs" ? "Jobs" : "Tasks"}</Link>)}
    </div> : null}
    {assignedOnly && tab === "tasks" ? (isAdmin ? <div className="mt-2"><TasksManagementPage /></div> : user ? <div className="mt-6">
      <CreatorTasksPanel creatorUid={user.uid} creatorName={user.name ?? "You"} viewer={{ uid: user.uid, name: user.name ?? user.email ?? null, isStaff: role === "admin" || role === "manager" }} />
    </div> : null) : <>
    {/* A plain search box, always on the page, so it's easy to find on phones too. */}
    <div className="mt-5 flex items-center gap-3">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search jobs</span>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/40" />
      </label>
      <span className="shrink-0 text-sm text-muted-foreground">{visible.length} {visible.length === 1 ? "job" : "jobs"}</span>
    </div>
    <div className="mt-6 flex gap-5 overflow-x-auto border-b border-border" role="group" aria-label="Job status">
      {filters.map((value) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-medium ${filter === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{value[0].toUpperCase() + value.slice(1)}</button>)}
    </div>
    {error ? <p role="alert" className="mt-5 text-sm text-destructive">{error}</p> : null}
    {visible.length ? <ul className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((job) => <li key={job.slug}><JobCard job={job} myJobs={assignedOnly} /></li>)}
    </ul> : <div className="py-14 text-center"><h2 className="text-lg font-semibold">{filter === "saved" && !search.trim() ? "No saved jobs yet" : jobs.length ? "No jobs match" : "No jobs yet"}</h2><p className="text-sm text-muted-foreground">{filter === "saved" ? "Tap the bookmark on a job to save it here." : jobs.length ? "Choose another status." : assignedOnly ? "Jobs assigned to you will appear here." : "Jobs will appear here when they are added."}</p></div>}
    </>}
  </DashboardListPage>;
}
