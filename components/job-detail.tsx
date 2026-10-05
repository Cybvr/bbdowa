"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { ArrowUpRight, Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { SectionHeading } from "@/components/dashboard/ui";
import { DetailBreadcrumb, DetailTabs } from "@/components/dashboard/detail-hero";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { TaskStatusBadge } from "@/components/tasks-view";
import { JobActions } from "@/components/job-actions";
import { JobCard } from "@/components/job-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClientWorkspaceHeading } from "@/components/client-workspace-heading";
import { CreatorPicker } from "@/components/creator-picker";
import { CreatorThumbnail } from "@/components/creator-thumbnail";
import { TagInput } from "@/components/tag-input";
import { RichTextContent, RichTextEditor, richTextHasContent } from "@/components/rich-text-editor";
import { ShareCreatorDialog } from "@/components/share-creator-dialog";
import { MobileHeaderActions, MobileHeaderTitle, useMobileHeader } from "@/components/dashboard/mobile-header";
import { TeamAddAction } from "@/components/team-add-action";
import { TeamPanel } from "@/components/team-panel";
import { JobMediaPanel } from "@/components/job-media-panel";
import { firebaseDb } from "@/lib/firebase/client";
import { useClientOptions, useFirestoreUsers } from "@/lib/firebase/client-content";
import { byLastModified, jobPostedDate, jobTitle, type Job } from "@/lib/jobs";
import { teamSizeLabel, type Client } from "@/lib/clients";
import { TASK_COLLECTION, formatDate, isOverdue, type Task } from "@/lib/creator-tasks";
import { longDate } from "@/lib/format";
import { BILLING_CYCLE_LABELS, JOB_TERMS_COLLECTION, jobAssignees, type JobTerms } from "@/lib/job-terms";
import { PAYMENTS_COLLECTION, formatAmount, type Payment, type PaymentCurrency } from "@/lib/payments";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { ACTIVITY_COLLECTION, elapsedMs, formatDuration, type ActivityEntry } from "@/lib/time-tracking";
import { isCreatorUser, userHref } from "@/lib/users";

type JobTab = "overview" | "case-study" | "media" | "team" | "tasks" | "timesheets" | "payments";
const fieldClass = "block space-y-1.5 text-sm font-medium";
const SECTION = "border-b border-border py-6";
const BODY = "m-0 max-w-[70ch] text-[15px] leading-[1.55]";
const parseList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

function localDateValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-1.5 text-body"><dt className="text-muted-foreground">{label}</dt><dd className="m-0 min-w-0 break-words font-medium">{children}</dd></div>;
}

const DETAIL_LIST = "m-0 mt-3";

/** A white panel on the grey job page. */
function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-border bg-background p-4 sm:p-5"><h2 className="m-0 text-item-title font-semibold">{title}</h2>{children}</section>;
}

/** Sums payments per currency, e.g. "₦120,000 · $300". */
function paymentTotals(items: Payment[]) {
  const totals = new Map<PaymentCurrency, number>();
  items.forEach((payment) => totals.set(payment.currency, (totals.get(payment.currency) ?? 0) + payment.amount));
  return totals.size ? [...totals].map(([currency, amount]) => formatAmount(amount, currency)).join(" · ") : formatAmount(0, "NGN");
}

function OtherJobsSidebar({ jobs, currentSlug }: { jobs: Job[]; currentSlug: string }) {
  const otherJobs = jobs
    .filter((job) => job.slug !== currentSlug && job.status === "active")
    .sort((a, b) => byLastModified(a, b) || jobTitle(a).localeCompare(jobTitle(b)));

  return (
    <aside className="hidden space-y-3 lg:block lg:sticky lg:top-6 nav:static nav:h-full nav:overflow-y-auto nav:overscroll-contain nav:pb-16">
      {otherJobs.length ? (
        <nav aria-label="Other jobs">
          <ul className="m-0 grid list-none gap-3 p-0">
            {otherJobs.map((otherJob) => (
              <li key={otherJob.slug}><JobCard job={otherJob} /></li>
            ))}
          </ul>
        </nav>
      ) : <p className="border-b border-border py-3 text-sm text-muted-foreground">No other jobs yet.</p>}
    </aside>
  );
}

const INLINE_FIELD = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40";

function InlineJobOverviewEditor({ job }: { job: Job }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(job.title ?? job.name);
  const [campaignTitle, setCampaignTitle] = React.useState(job.campaignTitle ?? job.title ?? job.name ?? "");
  const [clientId, setClientId] = React.useState(job.clientId ?? "");
  const clientOptions = useClientOptions({ clientId: job.clientId, clientName: job.clientName });
  const [category, setCategory] = React.useState(job.category ?? "");
  const [status, setStatus] = React.useState(job.status);
  const [description, setDescription] = React.useState(job.summary ?? "");
  const [workSetup, setWorkSetup] = React.useState(job.workSetup ?? "remote");
  const [estimatedLength, setEstimatedLength] = React.useState(job.estimatedLength ?? "");
  const [languages, setLanguages] = React.useState((job.languages ?? []).join(", "));
  const [desiredStartDate, setDesiredStartDate] = React.useState(job.desiredStartDate ?? "");
  const [requiredSkills, setRequiredSkills] = React.useState<string[]>(job.requiredSkills ?? []);
  const [startDate, setStartDate] = React.useState(job.startDate ?? "");
  const [endDate, setEndDate] = React.useState(job.endDate ?? "");
  const [fee, setFee] = React.useState(job.fee ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (startDate && endDate && endDate < startDate) {
      setError("The end date must be after the start date.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, await jobsCollection(), job.slug), {
        title: title.trim() || job.name,
        campaignTitle: campaignTitle.trim() || title.trim() || job.name,
        clientId,
        clientName: clientOptions.find((option) => option.value === clientId)?.label ?? job.clientName,
        category: category.trim(),
        status,
        summary: description.trim(),
        workSetup: workSetup || null,
        estimatedLength: estimatedLength.trim() || null,
        languages: parseList(languages),
        desiredStartDate: desiredStartDate || null,
        requiredSkills,
        startDate: startDate || null,
        endDate: endDate || null,
        fee: fee.trim(),
        updatedAt: serverTimestamp(),
      });
      router.refresh();
    } catch (cause) {
      console.error("Unable to save job overview", cause);
      setError("Couldn’t save the job overview.");
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={save} className="space-y-6 pt-6">
    {error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <div className="min-w-0">
        <RichTextEditor label="Description" value={description} onChange={setDescription} placeholder="Describe the job…" tall />
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">Job title<input value={title} onChange={(event) => setTitle(event.target.value)} className={INLINE_FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">Campaign title<input value={campaignTitle} onChange={(event) => setCampaignTitle(event.target.value)} className={INLINE_FIELD} placeholder="Client-facing campaign name" /></label>
        <label className="space-y-1.5 text-sm font-medium">Client<select value={clientId} onChange={(event) => setClientId(event.target.value)} className={INLINE_FIELD}>{clientOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="space-y-1.5 text-sm font-medium">Category<input value={category} onChange={(event) => setCategory(event.target.value)} className={INLINE_FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">Status<select value={status} onChange={(event) => setStatus(event.target.value as Job["status"])} className={INLINE_FIELD}><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label>
        <label className="space-y-1.5 text-sm font-medium">Work setup<select value={workSetup} onChange={(event) => setWorkSetup(event.target.value)} className={INLINE_FIELD}><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></label>
        <label className="space-y-1.5 text-sm font-medium">Estimated length<input value={estimatedLength} onChange={(event) => setEstimatedLength(event.target.value)} className={INLINE_FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">Languages<input value={languages} onChange={(event) => setLanguages(event.target.value)} className={INLINE_FIELD} placeholder="English, French" /></label>
        <label className="space-y-1.5 text-sm font-medium">Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={INLINE_FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">End date<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={INLINE_FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">Desired start<input type="date" value={desiredStartDate} onChange={(event) => setDesiredStartDate(event.target.value)} className={INLINE_FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">Fee<input value={fee} onChange={(event) => setFee(event.target.value)} className={INLINE_FIELD} /></label>
        <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2"><TagInput label="Tags" value={requiredSkills} onChange={setRequiredSkills} placeholder="e.g. Framer, then press Enter" /></div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <span className="text-muted-foreground">Created</span>
          <time dateTime={jobPostedDate(job) ?? undefined} className="font-medium">{longDate(jobPostedDate(job))}</time>
        </div>
      </div>
    </div>
    <div className="flex justify-end border-t border-border pt-5"><button type="submit" disabled={saving} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></div>
  </form>;
}

function InlineJobCaseStudyEditor({ job }: { job: Job }) {
  const router = useRouter();
  const [fields, setFields] = React.useState({ challenge: job.challenge ?? "", insight: job.insight ?? "", strategy: job.strategy ?? "", platform: (job.platform ?? []).join(", "), execution: job.execution ?? "", outcome: job.outcome ?? "" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const update = (key: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [key]: value }));
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, await jobsCollection(), job.slug), { ...fields, platform: parseList(fields.platform), updatedAt: serverTimestamp() });
      router.refresh();
    } catch (cause) {
      console.error("Unable to save job case study", cause);
      setError("Couldn’t save the case study.");
    } finally {
      setSaving(false);
    }
  };
  return <form onSubmit={save} className="space-y-5 pt-6">
    {error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
    {(["challenge", "insight", "strategy", "execution", "outcome"] as const).map((field) => <label key={field} className="block space-y-1.5 text-sm font-medium">{field[0].toUpperCase() + field.slice(1)}<textarea value={fields[field]} onChange={(event) => update(field, event.target.value)} className={`${INLINE_FIELD} min-h-28 resize-y`} /></label>)}
    <label className="block space-y-1.5 text-sm font-medium">Platform<textarea value={fields.platform} onChange={(event) => update("platform", event.target.value)} className={`${INLINE_FIELD} min-h-20 resize-y`} placeholder="Separate channels with commas" /></label>
    <div className="flex justify-end border-t border-border pt-5"><button type="submit" disabled={saving} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></div>
  </form>;
}

/** Reusable job content: details, case study, media, tasks, time and payments. */
export function JobDetailContent({ job, adminMode = false, embedded = false, myJobs = false, overviewOnly = false, otherJobs = [] }: { job: Job; adminMode?: boolean; embedded?: boolean; myJobs?: boolean; overviewOnly?: boolean; otherJobs?: Job[] }) {
  const { user, actualUser, isViewingAs, role, loading: authLoading } = useAuth();
  const mobileHeader = useMobileHeader();
  const { users } = useFirestoreUsers();
  const isStaff = role === "admin" || role === "manager";
  const canManage = adminMode && isStaff;
  const slug = job.slug;
  const title = jobTitle(job);
  const [client, setClient] = React.useState<Client | null>(null);
  const [terms, setTerms] = React.useState<JobTerms | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [entries, setEntries] = React.useState<ActivityEntry[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [tab, setTab] = React.useState<JobTab>("overview");
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [addingTask, setAddingTask] = React.useState(false);
  const [attachingTask, setAttachingTask] = React.useState(false);
  const [addingTime, setAddingTime] = React.useState(false);
  const [addingPayment, setAddingPayment] = React.useState(false);
  const [taskSearch, setTaskSearch] = React.useState("");
  const [timeSearch, setTimeSearch] = React.useState("");
  const [paymentSearch, setPaymentSearch] = React.useState("");
  const [teamSlugs, setTeamSlugs] = React.useState<string[]>(job.creatorSlugs ?? []);
  const teamMembers = React.useMemo(() => users.filter((person) => person.slug && teamSlugs.includes(person.slug)), [teamSlugs, users]);

  // Each read can be refused for people outside the job, so each fails on its own.
  const loadTerms = React.useCallback(async () => {
    const snapshot = await getDoc(doc(firebaseDb, JOB_TERMS_COLLECTION, slug)).catch(() => null);
    setTerms(snapshot?.exists() ? (snapshot.data() as JobTerms) : null);
  }, [slug]);

  const loadRelated = React.useCallback(async () => {
    if (!user) return;
    const timeSource = canManage
      ? query(collection(firebaseDb, ACTIVITY_COLLECTION), where("jobId", "==", slug))
      : query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", user.uid));
    const paymentSource = canManage
      ? query(collection(firebaseDb, PAYMENTS_COLLECTION), where("jobId", "==", slug))
      : query(collection(firebaseDb, PAYMENTS_COLLECTION), where("payeeUid", "==", user.uid));
    const [taskSnapshot, timeSnapshot, paymentSnapshot] = await Promise.all([
      getDocs(query(collection(firebaseDb, TASK_COLLECTION), where("jobId", "==", slug))),
      getDocs(timeSource),
      getDocs(paymentSource),
    ]);
    setTasks(taskSnapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Task, "id">) })).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")));
    setEntries(timeSnapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<ActivityEntry, "id">) })).filter((item) => item.jobId === slug).sort((a, b) => b.startedAt.localeCompare(a.startedAt)));
    setPayments(paymentSnapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Payment, "id">) })).filter((item) => item.jobId === slug).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, [canManage, slug, user]);

  React.useEffect(() => {
    let active = true;
    getDoc(doc(firebaseDb, "clients", job.clientId))
      .then((snapshot) => { if (active) setClient(snapshot.exists() ? (snapshot.data() as Client) : null); })
      .catch((cause) => console.error("Unable to load client", cause));
    return () => { active = false; };
  }, [job.clientId]);

  React.useEffect(() => {
    if (overviewOnly || authLoading || !user) return;
    void loadTerms();
    loadRelated().catch((cause) => console.error("Unable to load job activity", cause));
  }, [authLoading, loadRelated, loadTerms, overviewOnly, user]);

  const lead = users.find((person) => person.slug === job.leadUserId);
  const onTeam = Boolean(user?.uid && users.some((person) => person.uid === user.uid && person.slug && teamSlugs.includes(person.slug)));
  // Anyone on the job (assigned, on the team, or viewing it from My jobs) can log their own time.
  const assigned = Boolean(user?.uid && (terms?.assignedTo === user.uid || (terms ? jobAssignees(terms).some((person) => person.uid === user.uid) : false) || terms?.teamUids?.includes(user.uid) || onTeam || myJobs));
  const canLogTime = Boolean(!isViewingAs && (canManage || (assigned && job.status !== "completed")));
  const peopleOptions = React.useMemo(() => {
    const options = users.filter((person) => person.uid).map((person) => ({ value: person.uid!, label: person.name }));
    if (terms?.assignedTo && !options.some((person) => person.value === terms.assignedTo)) {
      options.push({ value: terms.assignedTo, label: terms.assignedToName ?? "Current assignee" });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [terms?.assignedTo, terms?.assignedToName, users]);
  const totalMs = entries.reduce((sum, entry) => sum + elapsedMs(entry), 0);
  const provisional = job.placeholder ? "text-muted-foreground" : "";
  const hasMedia = job.media.length > 0;
  const jobsBase = adminMode ? "/admin/jobs" : myJobs ? "/dashboard/my-jobs" : "/dashboard/jobs";
  const tabs: { id: JobTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    ...(overviewOnly || myJobs ? [] : [{ id: "case-study" as const, label: "Case study" }]),
    ...(hasMedia || canManage ? [{ id: "media" as const, label: "Media" }] : []),
    ...(!overviewOnly && user ? [
      // My jobs shows the team on the overview instead of its own tab.
      ...(myJobs ? [] : [{ id: "team" as const, label: "Team" }]),
      { id: "tasks" as const, label: "Tasks" },
      { id: "timesheets" as const, label: "Tracker" },
      { id: "payments" as const, label: "Payments" },
    ] : []),
  ];

  const taskQuery = taskSearch.trim().toLowerCase();
  const visibleTasks = tasks.filter((task) => !taskQuery || [task.title, task.description, task.assignedToName].filter(Boolean).join(" ").toLowerCase().includes(taskQuery));
  const timeQuery = timeSearch.trim().toLowerCase();
  const visibleEntries = entries.filter((entry) => !timeQuery || [entry.activity, entry.name, entry.taskId ? tasks.find((task) => task.id === entry.taskId)?.title : ""].filter(Boolean).join(" ").toLowerCase().includes(timeQuery));
  const paymentQuery = paymentSearch.trim().toLowerCase();
  const visiblePayments = payments.filter((payment) => !paymentQuery || [payment.description, payment.payeeName, payment.status].filter(Boolean).join(" ").toLowerCase().includes(paymentQuery));

  const togglePaymentStatus = async (payment: Payment) => {
    setActionError(null);
    try {
      await updateDoc(doc(firebaseDb, PAYMENTS_COLLECTION, payment.id), payment.status === "paid"
        ? { status: "pending", paidAt: null }
        : { status: "paid", paidAt: new Date().toISOString() });
      await loadRelated();
    } catch (cause) {
      console.error("Unable to update payment", cause);
      setActionError("Couldn’t update this payment.");
    }
  };

  // The dashboard job page fits the screen on desktop: the other-jobs list and
  // the job each scroll on their own instead of the whole page scrolling.
  return <div className={embedded ? "w-full" : overviewOnly ? "flex flex-1 flex-col bg-muted px-5 pb-16 pt-8 sm:px-8 nav:h-[calc(100dvh-60px)] nav:overflow-hidden nav:pb-0 nav:pt-6" : "min-h-[calc(100dvh-60px)] flex-1 bg-muted px-4 pb-24 pt-6 sm:px-8"}>
    {!embedded ? <DetailBreadcrumb
      crumbs={adminMode ? [
        { label: "All jobs", href: jobsBase },
        { label: job.clientName, href: `/admin/clients/${job.clientId}/overview` },
        { label: title },
      ] : [
        { label: "Home", href: "/dashboard" },
        { label: title },
      ]}
      back={adminMode ? { label: "All jobs (admin)", href: jobsBase } : undefined}
      mobileBack={adminMode ? undefined : { label: "Home", href: "/dashboard" }}
      actions={null}
    /> : null}
    {/* On phones the title, share and edit live in the dashboard top bar. */}
    {!embedded ? <>
      <MobileHeaderTitle title={title} />
      <MobileHeaderActions>
        <ShareCreatorDialog creatorName={title} path={`${jobsBase}/${encodeURIComponent(slug)}`} kind="job" />
        {!adminMode && role === "admin" ? <JobActions job={job} onSaved={() => void loadTerms()} /> : null}
      </MobileHeaderActions>
    </> : null}
    {overviewOnly ? null : <DetailTabs tabs={tabs} active={tab} onChange={setTab} />}
    {actionError ? <p role="alert" className="mt-4 text-sm text-destructive">{actionError}</p> : null}

    {tab === "overview" ? adminMode ? <InlineJobOverviewEditor job={job} /> : <div className={overviewOnly ? "grid gap-6 pt-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start nav:min-h-0 nav:flex-1 nav:grid-rows-[minmax(0,1fr)] nav:items-stretch" : "mx-auto grid w-full max-w-3xl pt-4"}>
      {overviewOnly ? <OtherJobsSidebar jobs={otherJobs} currentSlug={slug} /> : null}
      <div className={overviewOnly ? "grid min-w-0 content-start gap-3 nav:h-full nav:overflow-y-auto nav:overscroll-contain nav:pb-16 nav:pr-4" : "contents"}>
      <div className="grid min-w-0 content-start gap-3">
        <div className={`flex items-center justify-between gap-3${mobileHeader && !embedded ? " max-nav:hidden" : ""}`}>
          <h1 className="m-0 min-w-0 truncate text-page-title font-semibold lg:whitespace-normal lg:break-words lg:text-page-title-lg">{title}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <ShareCreatorDialog creatorName={title} path={`${jobsBase}/${encodeURIComponent(slug)}`} kind="job" showLabel />
            {!adminMode && role === "admin" ? <JobActions job={job} onSaved={() => void loadTerms()} /> : null}
          </div>
        </div>

        {user ? <DetailCard title="Point of contact">
          {lead ? <Link href={userHref(lead, isCreatorUser(lead) ? "creator" : "team")} className="mt-3 flex min-w-0 items-center gap-3 text-foreground no-underline hover:text-primary"><CreatorThumbnail imageSrc={lead.profileImage} avatarSeed={lead.name} className="h-10 w-10 shrink-0" /><div className="min-w-0"><p className="m-0 truncate text-body font-semibold">{lead.name}</p><p className="m-0 truncate text-sm text-muted-foreground">{lead.title || "Team lead"}</p>{lead.email ? <span className="block truncate text-sm text-muted-foreground">{lead.email}</span> : null}</div></Link> : <p className="mb-0 mt-3 text-body text-muted-foreground">To be confirmed</p>}
        </DetailCard> : null}

        <DetailCard title="About the job">
          {richTextHasContent(job.summary) ? <RichTextContent value={job.summary} className="mt-3 max-w-[70ch] text-body text-muted-foreground" /> : <p className="mb-0 mt-3 text-body text-muted-foreground">No description added.</p>}
          {job.externalLinks?.length ? <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
            {job.externalLinks.map((link) => <li key={link.href}><a href={link.href} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] font-semibold text-foreground hover:border-primary hover:text-primary">{link.label}<ArrowUpRight aria-hidden="true" className="size-3.5" /></a></li>)}
          </ul> : null}
        </DetailCard>

        <DetailCard title="Job details"><dl className={DETAIL_LIST}>
          <Detail label="Category">{job.category || "—"}</Detail>
          <Detail label="Work setup">{job.workSetup || "—"}</Detail>
          <Detail label="Est. length">{job.estimatedLength || "—"}</Detail>
          <Detail label="Desired start">{job.desiredStartDate ? formatDate(job.desiredStartDate) : "—"}</Detail>
          <Detail label="Job posted">{job.jobPostedAt ? formatDate(job.jobPostedAt) : "—"}</Detail>
          <Detail label="Fee">{job.fee || "—"}</Detail>
          <Detail label="Start">{job.startDate ? formatDate(job.startDate) : "—"}</Detail>
          <Detail label="End">{job.endDate ? formatDate(job.endDate) : "—"}</Detail>
        </dl></DetailCard>

        {job.requiredSkills?.length ? <DetailCard title="Tags">
          <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">{job.requiredSkills.map((skill) => <li key={skill} className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{skill}</li>)}</ul>
        </DetailCard> : null}

        {user ? <DetailCard title="Assigned team">{teamMembers.length ? <ul className="m-0 mt-3 grid list-none gap-2 p-0">
          {teamMembers.map((member) => <li key={member.slug}><Link href={userHref(member, isCreatorUser(member) ? "creator" : "team")} className="flex min-w-0 items-center gap-3 text-body font-medium text-foreground hover:text-primary"><CreatorThumbnail imageSrc={member.profileImage} avatarSeed={member.name} className="h-8 w-8 shrink-0" /><span className="truncate">{member.name}</span></Link></li>)}
        </ul> : <p className="mb-0 mt-3 text-body text-muted-foreground">No one is on this job&apos;s team yet.</p>}</DetailCard> : null}

        {terms ? <DetailCard title="Assignment and pay"><dl className={DETAIL_LIST}>
          <Detail label="Assigned to">{jobAssignees(terms).length ? <ul className="m-0 grid list-none gap-1.5 p-0">{jobAssignees(terms).map((person) => {
            const profile = users.find((candidate) => candidate.uid === person.uid);
            const inner = <><CreatorThumbnail imageSrc={profile?.profileImage} avatarSeed={profile?.name ?? person.name} className="h-6 w-6 shrink-0" /><span className="truncate">{profile?.name ?? person.name}</span></>;
            return <li key={person.uid}>{profile?.slug ? <Link href={userHref(profile, isCreatorUser(profile) ? "creator" : "team")} className="flex min-w-0 items-center gap-2 text-foreground no-underline hover:text-primary">{inner}</Link> : <span className="flex min-w-0 items-center gap-2">{inner}</span>}</li>;
          })}</ul> : "Unassigned"}</Detail>
          <Detail label="Rate">{terms.rateAmount != null ? `${formatAmount(terms.rateAmount, terms.rateCurrency)} / ${terms.rateUnit === "fixed" ? "job" : terms.rateUnit}` : "Not set"}</Detail>
          <Detail label="Billing cycle">{BILLING_CYCLE_LABELS[terms.billingCycle]}</Detail>
          <Detail label="Commitment">{terms.commitment || "Not set"}</Detail>
          <Detail label="Workday overlap">{terms.workdayOverlap || "Not set"}</Detail>
        </dl></DetailCard> : null}

        <DetailCard title="Client"><dl className={DETAIL_LIST}>
          <Detail label="Name"><Link href={`/admin/clients/${job.clientId}/overview`} className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">{client?.name ?? job.clientName}</Link></Detail>
          <Detail label="Industry">{client?.industry || "—"}</Detail>
          <Detail label="Team size">{teamSizeLabel(client?.teamSize) ?? "—"}</Detail>
          <Detail label="Year founded">{client?.yearFounded ?? "—"}</Detail>
          <Detail label="City / Country">{client?.location || "—"}</Detail>
          <Detail label="Time zone">{client?.timezone || "—"}</Detail>
        </dl></DetailCard>
      </div>
      </div>
    </div> : null}

    {tab === "case-study" ? adminMode ? <InlineJobCaseStudyEditor job={job} /> : <div className="pt-2">
      {([["Challenge", job.challenge], ["Insight", job.insight], ["Strategy", job.strategy]] as const).map(([heading, text]) => <article key={heading} className={SECTION}><SectionHeading>{heading}</SectionHeading><p className={`${BODY} ${provisional}`}>{text}</p></article>)}
      <article className={SECTION}><SectionHeading>Platform</SectionHeading><ul className="m-0 flex list-none flex-wrap gap-2 p-0">{job.platform.map((channel) => <li key={channel} className="rounded-md border border-border px-2.5 py-1 text-[13px] font-medium">{channel}</li>)}</ul></article>
      <article className={SECTION}><SectionHeading>Execution</SectionHeading><p className={`${BODY} ${provisional}`}>{job.execution}</p></article>
      <article className={`${SECTION} border-b-0`}><SectionHeading>Outcome</SectionHeading><p className={`${BODY} ${provisional}`}>{job.outcome}</p></article>
    </div> : null}

    {tab === "media" && (hasMedia || canManage) ? <JobMediaPanel jobSlug={slug} jobName={title} initialMedia={job.media} canManage={canManage} /> : null}

    {tab === "team" ? <section className="pt-6"><ClientWorkspaceHeading title="Team" actions={canManage ? <TeamAddAction jobSlug={slug} jobName={title} creators={users} selectedSlugs={teamSlugs} onSaved={(slugs) => { setTeamSlugs(slugs); void loadTerms(); }} /> : null} /><TeamPanel panelId={`job-${slug}-team-filter`} label={`${title} team`} members={teamMembers} allUsers={users} listHref={`${jobsBase}/${encodeURIComponent(slug)}`} emptyText="No one is on this job's team yet." /></section> : null}

    {tab === "tasks" ? <section className="pt-6"><ClientWorkspaceHeading title="Tasks" actions={canManage ? <>{terms?.assignedTo ? <Button type="button" variant="outline" onClick={() => setAttachingTask(true)}>Attach task</Button> : null}<Button type="button" onClick={() => setAddingTask(true)}><Plus aria-hidden="true" className="h-3.5 w-3.5" />Add</Button></> : null} /><FilterBar panelId={`job-${slug}-tasks-filter`} search={taskSearch} onSearchChange={setTaskSearch} searchPlaceholder="Search tasks" resultCount={`${visibleTasks.length} ${visibleTasks.length === 1 ? "task" : "tasks"}`} className="my-4" />{visibleTasks.length ? <ul className="mt-5 divide-y divide-border border-y border-border">{visibleTasks.map((task) => <li key={task.id}><Link href={`/dashboard/work/${encodeURIComponent(task.id)}`} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-foreground hover:text-primary"><span className="min-w-0"><span className="block font-semibold">{task.title}</span><span className="mt-1 block text-xs text-muted-foreground">{task.assignedToName ? `${task.assignedToName} · ` : ""}{task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}</span></span><TaskStatusBadge status={task.status} overdue={isOverdue(task)} /></Link></li>)}</ul> : <p className="py-10 text-sm text-muted-foreground">{tasks.length ? "No tasks match your search." : "No tasks have been added to this job."}</p>}</section> : null}

    {tab === "timesheets" ? <section className="pt-6"><ClientWorkspaceHeading title="Tracker" actions={canLogTime ? <Button type="button" onClick={() => setAddingTime(true)}><Plus aria-hidden="true" className="h-3.5 w-3.5" />Log time</Button> : null} /><FilterBar panelId={`job-${slug}-timesheets-filter`} search={timeSearch} onSearchChange={setTimeSearch} searchPlaceholder="Search tracker" resultCount={`${visibleEntries.length} ${visibleEntries.length === 1 ? "entry" : "entries"} · ${formatDuration(totalMs)}`} className="my-4" /><div className="mt-4 overflow-x-auto rounded-xl border border-border bg-background px-4"><table className="w-full min-w-[520px] border-collapse text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Activity</th>{canManage ? <th className="py-2 font-medium">Person</th> : null}<th className="py-2 font-medium">Date</th><th className="py-2 text-right font-medium">Time</th></tr></thead><tbody>{visibleEntries.length ? visibleEntries.map((entry) => <tr key={entry.id} className="border-b border-border"><td className="py-2">{entry.activity}{entry.taskId ? <span className="ml-2 text-xs text-muted-foreground">{tasks.find((task) => task.id === entry.taskId)?.title || "Task"}</span> : null}</td>{canManage ? <td className="py-2 text-muted-foreground">{entry.name || "—"}</td> : null}<td className="py-2 text-muted-foreground">{formatDate(entry.startedAt)}</td><td className="py-2 text-right font-medium tabular-nums">{formatDuration(elapsedMs(entry))}</td></tr>) : <tr><td colSpan={canManage ? 4 : 3} className="py-8 text-center text-muted-foreground">{entries.length ? "No entries match your search." : canLogTime ? "No time logged yet. Tap Log time to add your hours." : "No time recorded for this job yet."}</td></tr>}</tbody></table></div></section> : null}

    {tab === "payments" ? <section className="pt-6"><ClientWorkspaceHeading title="Payments" actions={canManage ? <Button type="button" onClick={() => setAddingPayment(true)}><Plus aria-hidden="true" className="h-3.5 w-3.5" />Add</Button> : null} /><FilterBar panelId={`job-${slug}-payments-filter`} search={paymentSearch} onSearchChange={setPaymentSearch} searchPlaceholder="Search payments" resultCount={`${visiblePayments.length} ${visiblePayments.length === 1 ? "payment" : "payments"}`} className="my-4" /><dl className="m-0 mt-4 grid grid-cols-2 gap-3">{(["paid", "pending"] as const).map((status) => <div key={status} className="rounded-xl border border-border bg-background p-4"><dt className="text-sm text-muted-foreground">{status === "paid" ? "Paid" : "Pending"}</dt><dd className="m-0 mt-1 text-item-title font-semibold tabular-nums">{paymentTotals(payments.filter((payment) => payment.status === status))}</dd></div>)}</dl><div className="mt-3 overflow-x-auto rounded-xl border border-border bg-background px-4"><table className="w-full min-w-[560px] border-collapse text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">For</th><th className="py-2 font-medium">Due</th><th className="py-2 font-medium">Status</th><th className="py-2 text-right font-medium">Amount</th>{canManage ? <th className="py-2 text-right font-medium">Action</th> : null}</tr></thead><tbody>{visiblePayments.length ? visiblePayments.map((payment) => <tr key={payment.id} className="border-b border-border"><td className="py-2">{payment.description}</td><td className="py-2 text-muted-foreground">{payment.dueDate ? formatDate(payment.dueDate) : "—"}</td><td className="py-2">{payment.status === "paid" ? "Paid" : "Pending"}</td><td className="py-2 text-right font-semibold tabular-nums">{formatAmount(payment.amount, payment.currency)}</td>{canManage ? <td className="py-2 text-right"><button type="button" onClick={() => void togglePaymentStatus(payment)} className="text-xs font-semibold text-primary hover:underline">{payment.status === "paid" ? "Mark pending" : "Mark paid"}</button></td> : null}</tr>) : <tr><td colSpan={canManage ? 5 : 4} className="py-8 text-center text-muted-foreground">{payments.length ? "No payments match your search." : "No payments recorded for this job yet."}</td></tr>}</tbody></table></div></section> : null}

    {canManage && user ? <NewJobTaskDialog job={job} defaultAssignee={terms?.assignedTo ?? ""} peopleOptions={peopleOptions} createdBy={actualUser?.uid ?? user.uid} createdByName={actualUser?.name ?? actualUser?.email ?? user.name ?? user.email} open={addingTask} onOpenChange={setAddingTask} onSaved={() => void loadRelated()} /> : null}
    {canManage && terms?.assignedTo ? <AttachJobTaskDialog job={job} terms={terms} open={attachingTask} onOpenChange={setAttachingTask} onSaved={() => void loadRelated()} /> : null}
    {canLogTime && user ? <LogJobTimeDialog job={job} tasks={tasks} uid={user.uid} name={user.name ?? user.email} open={addingTime} onOpenChange={setAddingTime} onSaved={() => void loadRelated()} /> : null}
    {canManage && user ? <NewJobPaymentDialog job={job} defaultPayee={terms?.assignedTo ?? ""} defaultCurrency={terms?.rateCurrency ?? "NGN"} peopleOptions={peopleOptions} createdBy={actualUser?.uid ?? user.uid} open={addingPayment} onOpenChange={setAddingPayment} onSaved={() => void loadRelated()} /> : null}
  </div>;
}

/** Full page wrapper for the reusable job content. */
export function JobDetail({ job, adminMode = false, myJobs = false, overviewOnly = false, otherJobs = [] }: { job: Job; adminMode?: boolean; myJobs?: boolean; overviewOnly?: boolean; otherJobs?: Job[] }) {
  return <JobDetailContent job={job} adminMode={adminMode} myJobs={myJobs} overviewOnly={overviewOnly} otherJobs={otherJobs} />;
}

function jobLink(job: Job) {
  return { clientId: job.clientId, clientName: job.clientName, jobId: job.slug, jobName: jobTitle(job) };
}

function AttachJobTaskDialog({ job, terms, open, onOpenChange, onSaved }: { job: Job; terms: JobTerms; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [available, setAvailable] = React.useState<Task[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!open || !terms.assignedTo) return;
    let active = true;
    getDocs(query(collection(firebaseDb, TASK_COLLECTION), where("assignedTo", "==", terms.assignedTo)))
      .then((snapshot) => { if (active) setAvailable(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Task, "id">) })).filter((task) => !task.jobId)); })
      .catch((cause) => { console.error("Unable to load unlinked tasks", cause); if (active) setError("Couldn’t load available tasks."); });
    return () => { active = false; };
  }, [terms.assignedTo, open]);
  const attach = async (taskId: string) => {
    setBusy(true); setError(null);
    try {
      await updateDoc(doc(firebaseDb, TASK_COLLECTION, taskId), { ...jobLink(job), updatedAt: new Date().toISOString() });
      onOpenChange(false); onSaved();
    } catch (cause) { console.error("Unable to attach task", cause); setError("Couldn’t attach this task."); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Attach an existing task</DialogTitle><DialogDescription>Choose a task already assigned to {terms.assignedToName} that isn’t linked to a job yet.</DialogDescription></DialogHeader>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}{available.length ? <ul className="max-h-72 divide-y divide-border overflow-y-auto">{available.map((task) => <li key={task.id}><button type="button" onClick={() => void attach(task.id)} disabled={busy} className="w-full py-3 text-left text-sm font-medium hover:text-primary disabled:opacity-50">{task.title}</button></li>)}</ul> : <p className="text-sm text-muted-foreground">No unlinked tasks for this person.</p>}</DialogContent></Dialog>;
}

function NewJobTaskDialog({ job, defaultAssignee, peopleOptions, createdBy, createdByName, open, onOpenChange, onSaved }: { job: Job; defaultAssignee: string; peopleOptions: { value: string; label: string }[]; createdBy: string; createdByName: string | null; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [assignedTo, setAssignedTo] = React.useState(defaultAssignee);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { if (open) setAssignedTo(defaultAssignee); }, [defaultAssignee, open]);
  const save = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!title.trim() || saving || !assignedTo) return; setSaving(true); setError(null); try { const now = new Date().toISOString(); await addDoc(collection(firebaseDb, TASK_COLLECTION), { ...jobLink(job), title: title.trim(), description: description.trim(), content: "", assignedTo, assignedToName: peopleOptions.find((person) => person.value === assignedTo)?.label ?? null, createdBy, createdByName, status: "todo", dueDate: dueDate || null, createdAt: now, updatedAt: now }); setTitle(""); setDescription(""); setDueDate(""); onOpenChange(false); onSaved(); } catch (cause) { console.error("Unable to add job task", cause); setError("Couldn’t add this task."); } finally { setSaving(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>New task</DialogTitle><DialogDescription>Assign a task within {jobTitle(job)}.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4"><div className={fieldClass}><span>Assign to</span><CreatorPicker options={peopleOptions} value={assignedTo} onChange={setAssignedTo} placeholder="Search people" emptyText="No people found." autoFocus={false} /></div><label className={fieldClass}>Title<Input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label className={fieldClass}>Description<Input value={description} onChange={(event) => setDescription(event.target.value)} /></label><label className={fieldClass}>Due date<Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end"><button type="submit" disabled={saving || !assignedTo || !title.trim()} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Add task"}</button></div></form></DialogContent></Dialog>;
}

function LogJobTimeDialog({ job, tasks, uid, name, open, onOpenChange, onSaved }: { job: Job; tasks: Task[]; uid: string; name: string | null; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [activity, setActivity] = React.useState("");
  const [date, setDate] = React.useState(localDateValue);
  const [hours, setHours] = React.useState("");
  const [taskId, setTaskId] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const amount = Number(hours); const start = new Date(`${date}T09:00:00`); if (!activity.trim() || !Number.isFinite(amount) || amount <= 0 || amount > 24 || Number.isNaN(start.getTime())) { setError("Enter an activity, date and up to 24 hours."); return; } setSaving(true); setError(null); try { await addDoc(collection(firebaseDb, ACTIVITY_COLLECTION), { taskId: taskId || null, uid, name, jobId: job.slug, jobName: jobTitle(job), activity: activity.trim(), startedAt: start.toISOString(), endedAt: new Date(start.getTime() + Math.round(amount * 3600000)).toISOString(), pausedAt: null, pausedMs: 0 }); setActivity(""); setHours(""); setTaskId(""); onOpenChange(false); onSaved(); } catch (cause) { console.error("Unable to log job time", cause); setError("Couldn’t log this time."); } finally { setSaving(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Log time</DialogTitle><DialogDescription>Record your time worked on {jobTitle(job)}.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4"><label className={fieldClass}>Activity<Input value={activity} onChange={(event) => setActivity(event.target.value)} required placeholder="What did you work on?" /></label><label className={fieldClass}>Task (optional)<select value={taskId} onChange={(event) => setTaskId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">No specific task</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className={fieldClass}>Date<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className={fieldClass}>Hours<Input type="number" min="0.01" max="24" step="0.01" value={hours} onChange={(event) => setHours(event.target.value)} required /></label></div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end"><button type="submit" disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Log time"}</button></div></form></DialogContent></Dialog>;
}

function NewJobPaymentDialog({ job, defaultPayee, defaultCurrency, peopleOptions, createdBy, open, onOpenChange, onSaved }: { job: Job; defaultPayee: string; defaultCurrency: PaymentCurrency; peopleOptions: { value: string; label: string }[]; createdBy: string; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [payeeUid, setPayeeUid] = React.useState(defaultPayee);
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<PaymentCurrency>(defaultCurrency);
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { if (open) { setPayeeUid(defaultPayee); setCurrency(defaultCurrency); } }, [defaultPayee, defaultCurrency, open]);
  const save = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const value = Number(amount); if (!Number.isFinite(value) || value <= 0 || !description.trim() || !payeeUid) { setError("Choose a payee, then enter an amount and description."); return; } setSaving(true); setError(null); try { await addDoc(collection(firebaseDb, PAYMENTS_COLLECTION), { jobId: job.slug, jobName: jobTitle(job), payeeUid, payeeName: peopleOptions.find((person) => person.value === payeeUid)?.label ?? "", amount: value, currency, description: description.trim(), status: "pending", dueDate: dueDate || null, paidAt: null, createdBy, createdAt: new Date().toISOString() }); setAmount(""); setDescription(""); setDueDate(""); onOpenChange(false); onSaved(); } catch (cause) { console.error("Unable to add job payment", cause); setError("Couldn’t add this payment."); } finally { setSaving(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add payment</DialogTitle><DialogDescription>Record a payment for {jobTitle(job)}.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4"><div className={fieldClass}><span>Payee</span><CreatorPicker options={peopleOptions} value={payeeUid} onChange={setPayeeUid} placeholder="Search people" emptyText="No people found." autoFocus={false} /></div><div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3"><label className={fieldClass}>Amount<Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label><label className={fieldClass}>Currency<select value={currency} onChange={(event) => setCurrency(event.target.value as PaymentCurrency)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="NGN">NGN</option><option value="USD">USD</option></select></label></div><label className={fieldClass}>What it is for<Input value={description} onChange={(event) => setDescription(event.target.value)} required /></label><label className={fieldClass}>Due date<Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end"><button type="submit" disabled={saving || !payeeUid || !description.trim() || !(Number(amount) > 0)} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Add payment"}</button></div></form></DialogContent></Dialog>;
}
