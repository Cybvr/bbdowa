"use client";

import * as React from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { Briefcase, Eye, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { ApplicationRow } from "@/components/job-applicants-panel";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar, useListView, type SortOption } from "@/components/dashboard/filter-bar";
import { CardGrid, DesktopTable, ListCard, MobileRow, MobileRows, ROW_ICON_ACTION } from "@/components/dashboard/list-card";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { TableActionsCell } from "@/components/dashboard/table-row-actions";
import { Badge, EmptyState } from "@/components/dashboard/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { firebaseDb } from "@/lib/firebase/client";
import { readJobsFromFirestore, useFirestoreUsers } from "@/lib/firebase/client-content";
import { getMasterNdaId } from "@/lib/firebase/master-nda";
import { updateJobApplication } from "@/lib/firebase/job-applications";
import { APPLICATION_STATUS_LABELS, JOB_APPLICATIONS_COLLECTION, JOB_POSTINGS_COLLECTION, JOB_POSTING_LINKS_COLLECTION, type ApplicationStatus, type JobApplication } from "@/lib/job-postings";
import { jobDisplayTitle, type Job } from "@/lib/jobs";
import { longDate, plural } from "@/lib/format";

type Sort = "recent" | "name";
type Posting = { id: string; headline: string };
const SORTS: SortOption<Sort>[] = [{ key: "recent", label: "Recently applied" }, { key: "name", label: "Name (A–Z)" }];
const applicationName = (application: JobApplication) => application.name || application.email || "Applicant";
const appliedDate = (value: string) => value && !Number.isNaN(Date.parse(value)) ? longDate(value.slice(0, 10)) : "—";

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={status === "declined" ? "neutral" : status === "hired" ? "inverse" : "active"}>{APPLICATION_STATUS_LABELS[status]}</Badge>;
}

export function AdminApplicants() {
  const { role, user, actualUser, loading: authLoading } = useAuth();
  const { users, loading: usersLoading, error: usersError } = useFirestoreUsers();
  const [applications, setApplications] = React.useState<JobApplication[]>([]);
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [postings, setPostings] = React.useState<Posting[]>([]);
  const [jobLinks, setJobLinks] = React.useState<Record<string, string>>({});
  const [masterId, setMasterId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const busyRef = React.useRef(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [postingFilter, setPostingFilter] = React.useState("all");
  const [sort, setSort] = React.useState<Sort>("recent");
  const [view, setView] = useListView("admin-applicants");
  const [refresh, setRefresh] = React.useState(0);
  const isStaff = role === "admin" || role === "manager";

  React.useEffect(() => {
    if (authLoading || !isStaff) return;
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      getDocs(collection(firebaseDb, JOB_APPLICATIONS_COLLECTION)),
      getDocs(collection(firebaseDb, JOB_POSTINGS_COLLECTION)),
      getDocs(collection(firebaseDb, JOB_POSTING_LINKS_COLLECTION)),
      readJobsFromFirestore(),
      getMasterNdaId(),
    ]).then(([applicationSnapshot, postingSnapshot, linkSnapshot, loadedJobs, master]) => {
      if (!active) return;
      setApplications(applicationSnapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as JobApplication));
      setPostings(postingSnapshot.docs.map((item) => ({ id: item.id, headline: item.data().headline || "Untitled posting" })));
      setJobLinks(Object.fromEntries(linkSnapshot.docs.filter((item) => typeof item.data().postingId === "string").map((item) => [item.data().postingId, item.data().jobSlug || item.id])));
      setJobs(loadedJobs);
      setMasterId(master);
    }).catch((cause) => {
      console.error("Unable to load applicants", cause);
      if (active) setError("Couldn’t load applications. Please try again.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, isStaff, refresh]);

  const jobFor = (application: JobApplication) => jobs.find((job) => job.slug === (jobLinks[application.postingId] || application.jobSlug));
  const titleFor = (application: JobApplication) => {
    const job = jobFor(application);
    return job ? jobDisplayTitle(job) : postings.find((posting) => posting.id === application.postingId)?.headline || "Posting unavailable";
  };
  const postingOptions = Array.from(new Set(applications.map((application) => application.postingId)))
    .map((id) => ({ value: id, label: titleFor(applications.find((application) => application.postingId === id)!) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const visible = applications.filter((application) => {
    const text = [application.name, application.email, titleFor(application), jobFor(application)?.clientName].filter(Boolean).join(" ").toLowerCase();
    return (status === "all" || application.status === status) && (postingFilter === "all" || application.postingId === postingFilter) && text.includes(search.trim().toLowerCase());
  }).sort((a, b) => sort === "name" ? applicationName(a).localeCompare(applicationName(b)) : (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  const selected = applications.find((application) => application.id === selectedId);
  const selectedJob = selected ? jobFor(selected) : undefined;
  const review = (application: JobApplication) => { setActionError(null); setSelectedId(application.id); };

  const act = async (application: JobApplication, nextStatus: ApplicationStatus) => {
    const staff = actualUser ?? user;
    const job = jobFor(application);
    if (!isStaff || !staff || !job || busyRef.current || usersLoading || usersError) return;
    busyRef.current = true;
    setBusyId(application.id);
    setActionError(null);
    try {
      const updated = await updateJobApplication({ application, status: nextStatus, job, users, staff, masterId });
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      console.error("Unable to update application", cause);
      setActionError(cause instanceof Error && cause.message.includes("master NDA") ? cause.message : "Couldn’t update this application. Please try again.");
    } finally {
      busyRef.current = false;
      setBusyId(null);
    }
  };

  if (authLoading || (isStaff && loading)) return <UsersTableSkeleton />;
  if (!isStaff) return <DashboardListPage title="Applicants"><p className="text-sm text-muted-foreground">A staff account is required to review applications.</p></DashboardListPage>;

  return <DashboardListPage title="Applicants" toolbar={<FilterBar
    panelId="admin-applicants-filter" search={search} onSearchChange={setSearch} searchPlaceholder="Search applicants or jobs"
    filters={[
      { label: "Status", value: status, onChange: setStatus, options: [{ value: "all", label: "All statuses" }, ...Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({ value, label }))] },
      { label: "Job", value: postingFilter, onChange: setPostingFilter, options: [{ value: "all", label: "All jobs" }, ...postingOptions] },
    ]}
    sortOptions={SORTS} activeSort={sort} onSortChange={setSort} resultCount={plural(visible.length, "application")} view={view} onViewChange={setView}
    actions={<Button variant="outline" size="sm" disabled={Boolean(busyId)} onClick={() => setRefresh((value) => value + 1)}><RefreshCw className="h-4 w-4" aria-hidden="true" />Refresh</Button>}
  />}>
    {error ? <div role="alert" className="py-8 text-sm"><p className="text-destructive">{error}</p><Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Try again</Button></div> : <section aria-label="Applicants">
      {visible.length ? view === "cards" ? <CardGrid>{visible.map((application) => <ListCard key={application.id}
        onActivate={() => review(application)} image={users.find((person) => person.uid === application.uid)?.profileImage}
        title={<button type="button" onClick={() => review(application)} className="text-left hover:text-primary">{applicationName(application)}</button>}
        subtitle={<>{titleFor(application)} · {APPLICATION_STATUS_LABELS[application.status]} · {appliedDate(application.createdAt)}</>}
      />)}</CardGrid> : <>
        <MobileRows>{visible.map((application) => <MobileRow key={application.id} onActivate={() => review(application)}
          image={users.find((person) => person.uid === application.uid)?.profileImage} title={applicationName(application)} chip={titleFor(application)} chipIcon={<Briefcase className="h-4 w-4" aria-hidden="true" />}
          detail={`${application.email || "No email"} · ${appliedDate(application.createdAt)}`} status={<StatusBadge status={application.status} />}
          actions={<button type="button" onClick={() => review(application)} aria-label={`Review application from ${applicationName(application)}`} className={ROW_ICON_ACTION}><Eye className="h-5 w-5" aria-hidden="true" /></button>}
        />)}</MobileRows>
        <DesktopTable><Table><TableHeader><TableRow>
          <TableHead>Applicant</TableHead><TableHead>Email</TableHead><TableHead>Job</TableHead><TableHead>Status</TableHead><TableHead>Applied</TableHead><TableHead className="text-right">Actions</TableHead>
        </TableRow></TableHeader><TableBody>{visible.map((application) => {
          const job = jobFor(application);
          return <ClickableTableRow key={application.id} onActivate={() => review(application)} label={`Review application from ${applicationName(application)}`}>
            <TableCell className="font-semibold">{applicationName(application)}</TableCell><TableCell className="text-muted-foreground">{application.email || "—"}</TableCell>
            <TableCell>{job ? <Link href={`/admin/jobs/${encodeURIComponent(job.slug)}`} onClick={(event) => event.stopPropagation()} className="text-foreground no-underline hover:text-primary">{titleFor(application)}</Link> : titleFor(application)}</TableCell>
            <TableCell><StatusBadge status={application.status} /></TableCell><TableCell className="whitespace-nowrap text-muted-foreground">{appliedDate(application.createdAt)}</TableCell>
            <TableActionsCell primary={{ label: `Review application from ${applicationName(application)}`, icon: <Eye className="h-4 w-4" />, onSelect: () => review(application) }} />
          </ClickableTableRow>;
        })}</TableBody></Table></DesktopTable>
      </> : <EmptyState title={applications.length ? "No applications match" : "No applications yet"} description={applications.length ? "Try a different search or filter." : "Applications submitted through your job share links will appear here."} />}
    </section>}
    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open && !busyId) setSelectedId(null); }}>
      <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Application</DialogTitle><DialogDescription>{selected ? titleFor(selected) : ""}</DialogDescription></DialogHeader>
        {actionError ? <p role="alert" className="m-0 text-sm text-destructive">{actionError}</p> : null}
        {selected && !selectedJob ? <p className="m-0 text-sm text-muted-foreground">The linked job is unavailable. You can read this application, but its status cannot be changed.</p> : null}
        {usersError ? <p role="alert" className="m-0 text-sm text-destructive">Couldn’t load applicant profiles. Refresh the page before changing an application’s status.</p> : null}
        {selected ? <ul className="m-0 list-none p-0"><ApplicationRow key={selected.id} application={selected} masterId={masterId} defaultOpen busy={Boolean(busyId) || !selectedJob || usersLoading || Boolean(usersError)} onAction={(application, nextStatus) => void act(application, nextStatus)} /></ul> : null}
        {selectedJob ? <Link href={`/admin/jobs/${encodeURIComponent(selectedJob.slug)}`} className="text-sm font-medium underline underline-offset-4">Open job</Link> : null}
      </DialogContent>
    </Dialog>
  </DashboardListPage>;
}
