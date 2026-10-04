"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { WorkJobFormDialog } from "@/components/work-job-form";
import { firebaseDb } from "@/lib/firebase/client";
import { formatDate } from "@/lib/creator-tasks";
import { WORK_JOBS_COLLECTION, WORK_JOB_STATUS_LABELS, type WorkJob } from "@/lib/work-jobs";

const filters = ["all", "active", "paused", "completed"] as const;

export function JobsList() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const [jobs, setJobs] = React.useState<WorkJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [filter, setFilter] = React.useState<(typeof filters)[number]>("all");

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    let active = true;
    const source = isStaff
      ? collection(firebaseDb, WORK_JOBS_COLLECTION)
      : query(collection(firebaseDb, WORK_JOBS_COLLECTION), where("assignedTo", "==", user.uid));
    getDocs(source)
      .then((snapshot) => {
        if (!active) return;
        setJobs(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<WorkJob, "id">) })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      })
      .catch((cause) => { console.error("Unable to load jobs", cause); if (active) setError("Couldn’t load jobs. Try again later."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, isStaff, user]);

  if (authLoading || loading) return <PageLoadingSkeleton titleWidth="w-32" />;
  const visible = filter === "all" ? jobs : jobs.filter((job) => job.status === filter);

  return <DashboardListPage title="Jobs" actions={isStaff ? <button type="button" onClick={() => setCreating(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" aria-hidden="true" />New job</button> : undefined}>
    <p className="mt-2 text-sm text-muted-foreground">Paid assignments, with their tasks, timesheets and payments in one place.</p>
    <div className="mt-6 flex gap-5 overflow-x-auto border-b border-border" role="group" aria-label="Job status">
      {filters.map((value) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-medium ${filter === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{value === "all" ? "All" : WORK_JOB_STATUS_LABELS[value]}</button>)}
    </div>
    {error ? <p role="alert" className="mt-5 text-sm text-destructive">{error}</p> : null}
    {visible.length ? <ul className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((job) => <li key={job.id} className="rounded-xl border border-border bg-background">
        <Link href={`/dashboard/jobs/${encodeURIComponent(job.id)}`} className="flex h-full min-h-44 flex-col p-5 text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span className="text-xs font-medium text-muted-foreground">{WORK_JOB_STATUS_LABELS[job.status]}</span>
          <span className="mt-4 line-clamp-1 text-lg font-semibold">{job.clientName || job.assignedToName}</span>
          <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{job.title}</span>
          <span className="mt-auto pt-5 text-xs text-muted-foreground">{job.startDate ? `Started ${formatDate(job.startDate)}` : `Created ${formatDate(job.createdAt)}`}{job.endDate ? ` · Ends ${formatDate(job.endDate)}` : ""}</span>
        </Link>
      </li>)}
    </ul> : <div className="py-14 text-center"><h2 className="text-lg font-semibold">{jobs.length ? "No jobs match" : "No jobs yet"}</h2><p className="text-sm text-muted-foreground">{jobs.length ? "Choose another status." : isStaff ? "Create a job to track its tasks, time and payments." : "Jobs assigned to you will appear here."}</p></div>}
    {isStaff ? <WorkJobFormDialog open={creating} onOpenChange={setCreating} onSaved={(id) => router.push(`/dashboard/jobs/${encodeURIComponent(id)}`)} /> : null}
  </DashboardListPage>;
}
