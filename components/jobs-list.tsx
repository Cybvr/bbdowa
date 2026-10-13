"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { Search } from "lucide-react";
import { useSavedJobs } from "@/lib/firebase/saved-jobs";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { JobCard } from "@/components/job-card";
import { CreatorTasksPanel } from "@/components/tasks-view";
import TasksManagementPage from "@/components/tasks-management-page";
import { readJobsFromFirestore, readTasksForNjeri } from "@/lib/firebase/client-content";
import { byLastModified, jobTitle, type Job } from "@/lib/jobs";
import { readAssignedJobs } from "@/lib/firebase/my-jobs";

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
  const [taskCount, setTaskCount] = React.useState<number | null>(null);
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

        const assignedJobs = await readAssignedJobs(user.uid, user.email);
        if (active) setJobs(assignedJobs);
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

  React.useEffect(() => {
    if (authLoading || !user || !assignedOnly) {
      setTaskCount(null);
      return;
    }
    let active = true;
    readTasksForNjeri(user.uid, isAdmin)
      .then((tasks) => { if (active) setTaskCount(tasks.length); })
      .catch((cause) => {
        console.error("Unable to load task count", cause);
        if (active) setTaskCount(null);
      });
    return () => { active = false; };
  }, [assignedOnly, authLoading, isAdmin, user]);

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
      {(["jobs", "tasks"] as const).map((value) => {
        const count = value === "jobs" ? jobs.length : taskCount;
        return <Link key={value} href={value === "jobs" ? "/dashboard/my-jobs" : "/dashboard/my-jobs/tasks"} role="tab" aria-selected={tab === value} aria-label={`${value === "jobs" ? "Jobs" : "Tasks"}${count === null ? "" : `, ${count}`}`} className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold ${tab === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          {value === "jobs" ? "Jobs" : "Tasks"}
          {count !== null ? <span aria-hidden="true" className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold leading-none tabular-nums text-primary-foreground">{count}</span> : null}
        </Link>;
      })}
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
