"use client";

import * as React from "react";
import Link from "next/link";
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { ArrowUpRight, Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { JobActions } from "@/components/job-actions";
import { Badge, ImageWithFallback, SectionHeading } from "@/components/dashboard/ui";
import { DetailBreadcrumb, DetailHeroBanner, DetailTabs } from "@/components/dashboard/detail-hero";
import { TaskStatusBadge } from "@/components/tasks-view";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { firebaseDb } from "@/lib/firebase/client";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { JOB_STATUS_LABELS, type Job } from "@/lib/jobs";
import type { Client } from "@/lib/clients";
import { TASK_COLLECTION, formatDate, isOverdue, type Task } from "@/lib/creator-tasks";
import { longDate } from "@/lib/format";
import { BILLING_CYCLE_LABELS, CLIENT_CONTACTS_COLLECTION, JOB_TERMS_COLLECTION, type ClientContact, type JobTerms } from "@/lib/job-terms";
import { PAYMENTS_COLLECTION, formatAmount, type Payment, type PaymentCurrency } from "@/lib/payments";
import { ACTIVITY_COLLECTION, elapsedMs, formatDuration, type ActivityEntry } from "@/lib/time-tracking";
import { isCreatorUser, userHref } from "@/lib/users";

type JobTab = "overview" | "case-study" | "media" | "tasks" | "timesheets" | "payments";
const fieldClass = "block space-y-1.5 text-sm font-medium";
const CARD = "rounded-xl border border-border p-5 sm:p-6";
const SECTION = "border-b border-border py-6";
const BODY = "m-0 max-w-[70ch] text-[15px] leading-[1.55]";

function localDateValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1 text-sm sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-5"><dt className="text-muted-foreground">{label}</dt><dd className="m-0 font-medium">{children}</dd></div>;
}

function ExternalLink({ href }: { href: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">{href}</a>;
}

/** A job: its details, the client's info, and its tasks, time and payments. */
export function JobDetail({ job, adminMode = false }: { job: Job; adminMode?: boolean }) {
  const { user, actualUser, isViewingAs, role, loading: authLoading } = useAuth();
  const { users } = useFirestoreUsers();
  const isStaff = role === "admin" || role === "manager";
  const canManage = adminMode && isStaff;
  const slug = job.slug;
  const title = job.title ?? job.name;
  const [client, setClient] = React.useState<Client | null>(null);
  const [contact, setContact] = React.useState<ClientContact | null>(null);
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
    if (authLoading || !user) return;
    let active = true;
    getDoc(doc(firebaseDb, CLIENT_CONTACTS_COLLECTION, job.clientId))
      .then((snapshot) => { if (active) setContact(snapshot.exists() ? (snapshot.data() as ClientContact) : null); })
      .catch(() => { if (active) setContact(null); });
    void loadTerms();
    loadRelated().catch((cause) => console.error("Unable to load job activity", cause));
    return () => { active = false; };
  }, [authLoading, job.clientId, loadRelated, loadTerms, user]);

  const lead = users.find((person) => person.slug === job.leadUserId);
  const assigned = Boolean(user?.uid && terms?.assignedTo === user.uid);
  const canLogTime = Boolean(assigned && !isViewingAs && job.status !== "completed");
  const totalMs = entries.reduce((sum, entry) => sum + elapsedMs(entry), 0);
  const provisional = job.placeholder ? "text-muted-foreground" : "";
  const hasMedia = job.media.length > 0;
  const jobsBase = adminMode ? "/admin/jobs" : "/dashboard/jobs";
  const tabs: { id: JobTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "case-study", label: "Case study" },
    ...(hasMedia ? [{ id: "media" as const, label: "Media" }] : []),
    ...(user ? [
      { id: "tasks" as const, label: "Tasks" },
      { id: "timesheets" as const, label: "Timesheets" },
      { id: "payments" as const, label: "Payments" },
    ] : []),
  ];

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

  return <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
    <DetailBreadcrumb
      crumbs={[
        { label: adminMode ? "All jobs" : "My jobs", href: jobsBase },
        { label: job.clientName, href: `/dashboard/clients/${job.clientId}/overview` },
        { label: title },
      ]}
      actions={canManage ? <JobActions job={job} onSaved={() => void loadTerms()} /> : null}
    />
    <DetailHeroBanner image={job.image} alt={job.imageAlt} />
    <DetailTabs tabs={tabs} active={tab} onChange={setTab} />
    {actionError ? <p role="alert" className="mt-4 text-sm text-destructive">{actionError}</p> : null}

    {tab === "overview" ? <div className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 space-y-6">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">{job.clientName}</p>
          <h1 className="m-0 break-words text-page-title font-bold leading-tight sm:text-page-title-lg">{title}</h1>
          <div className="mt-3"><Badge tone={job.status === "live" ? "active" : "neutral"}>{JOB_STATUS_LABELS[job.status] ?? job.status}</Badge></div>
          <p className="mb-0 mt-3 max-w-[70ch] whitespace-pre-wrap text-[16px] leading-[1.45] text-muted-foreground">{job.summary || "No description added."}</p>
          {job.externalLinks?.length ? <ul className="m-0 mt-5 flex list-none flex-wrap gap-2 p-0">
            {job.externalLinks.map((link) => <li key={link.href}><a href={link.href} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold text-foreground hover:border-primary hover:text-primary">{link.label}<ArrowUpRight aria-hidden="true" className="size-3.5" /></a></li>)}
          </ul> : null}
        </div>

        <div className={CARD}><h2 className="m-0 text-lg font-semibold">Job details</h2><dl className="mt-5 space-y-4">
          <Detail label="Lead">{lead ? <Link href={userHref(lead, isCreatorUser(lead) ? "creator" : "team")} className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">{lead.name}</Link> : "To be confirmed"}</Detail>
          <Detail label="Category">{job.category || "—"}</Detail>
          <Detail label="Specialization">{job.specialization || "—"}</Detail>
          <Detail label="Work setup">{job.workSetup || "—"}</Detail>
          <Detail label="Estimated length">{job.estimatedLength || "—"}</Detail>
          <Detail label="Languages">{job.languages?.join(", ") || "—"}</Detail>
          <Detail label="Desired start date">{job.desiredStartDate ? formatDate(job.desiredStartDate) : "—"}</Detail>
          <Detail label="Job posted">{job.jobPostedAt ? formatDate(job.jobPostedAt) : "—"}</Detail>
          <Detail label="Required skills">{job.requiredSkills?.length ? <span className="flex flex-wrap gap-2">{job.requiredSkills.map((skill) => <span key={skill} className="rounded-full bg-muted px-2.5 py-1 text-xs">{skill}</span>)}</span> : "—"}</Detail>
          <Detail label="Fee">{job.fee || "—"}</Detail>
          <Detail label="Target">{job.target || "—"}</Detail>
          <Detail label="Result so far">{job.result || "—"}</Detail>
        </dl></div>

        {terms ? <div className={CARD}><h2 className="m-0 text-lg font-semibold">Assignment and pay</h2><dl className="mt-5 space-y-4">
          <Detail label="Assigned to">{terms.assignedToName || "Unassigned"}</Detail>
          <Detail label="Rate">{terms.rateAmount != null ? `${formatAmount(terms.rateAmount, terms.rateCurrency)} / ${terms.rateUnit === "fixed" ? "job" : terms.rateUnit}` : "Not set"}</Detail>
          <Detail label="Billing cycle">{BILLING_CYCLE_LABELS[terms.billingCycle]}</Detail>
          <Detail label="Commitment">{terms.commitment || "Not set"}</Detail>
          <Detail label="Workday overlap">{terms.workdayOverlap || "Not set"}</Detail>
        </dl></div> : null}
      </section>

      <aside className="space-y-6">
        <section className={CARD}><h2 className="m-0 text-lg font-semibold">Dates</h2><dl className="mt-4 space-y-3">
          <Detail label="Start">{job.startDate ? formatDate(job.startDate) : "Not set"}</Detail>
          <Detail label="End">{job.endDate ? formatDate(job.endDate) : "Not set"}</Detail>
          <Detail label="Created">{longDate(job.createdAt?.slice(0, 10))}</Detail>
          <Detail label="Updated">{longDate(job.updatedAt?.slice(0, 10))}</Detail>
        </dl></section>
        <section className={CARD}><h2 className="m-0 text-lg font-semibold">Client</h2><dl className="mt-4 space-y-3">
          <Detail label="Name"><Link href={`/dashboard/clients/${job.clientId}/overview`} className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">{client?.name ?? job.clientName}</Link></Detail>
          <Detail label="Industry">{client?.industry || "—"}</Detail>
          <Detail label="Team size">{client?.teamSize ?? "—"}</Detail>
          <Detail label="Year founded">{client?.yearFounded ?? "—"}</Detail>
          <Detail label="City / Country">{client?.location || "—"}</Detail>
          <Detail label="Website">{client?.website ? <ExternalLink href={client.website} /> : "—"}</Detail>
          <Detail label="LinkedIn">{client?.linkedIn ? <ExternalLink href={client.linkedIn} /> : "—"}</Detail>
          <Detail label="Time zone">{client?.timezone || "—"}</Detail>
          <Detail label="Client hours">{client?.hours || "—"}</Detail>
          <Detail label="In our time">{client?.hoursConverted || "—"}</Detail>
        </dl>{isStaff ? <p className="mb-0 mt-4 text-xs text-muted-foreground">Edit these on the client page.</p> : null}</section>
        {user ? <section className={CARD}><h2 className="m-0 text-lg font-semibold">Point of contact</h2>
          <p className="mb-0 mt-4 text-sm font-medium">{contact?.name || "Not set"}</p>
          {contact?.role ? <p className="mb-0 mt-1 text-sm text-muted-foreground">{contact.role}</p> : null}
          {contact?.email ? <a href={`mailto:${contact.email}`} className="mt-1 block break-all text-sm text-primary hover:underline">{contact.email}</a> : null}
          {contact?.outOfOfficeUntil ? <p className="mb-0 mt-3 text-sm text-muted-foreground">Out of office until {formatDate(contact.outOfOfficeUntil)}</p> : null}
          {contact?.note ? <p className="mb-0 mt-3 text-sm leading-relaxed text-muted-foreground">{contact.note}</p> : null}
        </section> : null}
      </aside>
    </div> : null}

    {tab === "case-study" ? <div className="pt-2">
      {([["Challenge", job.challenge], ["Insight", job.insight], ["Strategy", job.strategy]] as const).map(([heading, text]) => <article key={heading} className={SECTION}><SectionHeading>{heading}</SectionHeading><p className={`${BODY} ${provisional}`}>{text}</p></article>)}
      <article className={SECTION}><SectionHeading>Platform</SectionHeading><ul className="m-0 flex list-none flex-wrap gap-2 p-0">{job.platform.map((channel) => <li key={channel} className="rounded-md border border-border px-2.5 py-1 text-[13px] font-medium">{channel}</li>)}</ul></article>
      <article className={SECTION}><SectionHeading>Execution</SectionHeading><p className={`${BODY} ${provisional}`}>{job.execution}</p></article>
      <article className={`${SECTION} border-b-0`}><SectionHeading>Outcome</SectionHeading><p className={`${BODY} ${provisional}`}>{job.outcome}</p></article>
    </div> : null}

    {tab === "media" && hasMedia ? <div className="grid grid-cols-2 gap-4 pt-6 max-[760px]:grid-cols-1">
      {job.media.map((media) => media.kind === "video"
        ? <video key={media.src} className="block aspect-video h-full w-full rounded-xl bg-muted object-cover" controls preload="metadata" poster={media.poster} aria-label={media.alt}><source src={media.src} type="video/mp4" />Your browser does not support this video.</video>
        : <ImageWithFallback key={media.src} src={media.src} alt={media.alt} className="block aspect-video h-full w-full rounded-xl bg-muted object-cover" />)}
    </div> : null}

    {tab === "tasks" ? <section className="pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="m-0 text-lg font-semibold">Tasks</h2>{canManage && terms?.assignedTo ? <div className="flex gap-2"><button type="button" onClick={() => setAttachingTask(true)} className="h-9 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted">Attach task</button><button type="button" onClick={() => setAddingTask(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New task</button></div> : null}</div>{canManage && !terms?.assignedTo ? <p className="mb-0 mt-2 text-sm text-muted-foreground">Assign someone to this job to add tasks.</p> : null}{tasks.length ? <ul className="mt-5 divide-y divide-border border-y border-border">{tasks.map((task) => <li key={task.id}><Link href={`/dashboard/work/${encodeURIComponent(task.id)}`} className="flex flex-wrap items-center justify-between gap-3 py-4 text-foreground hover:text-primary"><span className="min-w-0"><span className="block font-semibold">{task.title}</span><span className="mt-1 block text-xs text-muted-foreground">{task.assignedToName ? `${task.assignedToName} · ` : ""}{task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}</span></span><TaskStatusBadge status={task.status} overdue={isOverdue(task)} /></Link></li>)}</ul> : <p className="py-10 text-sm text-muted-foreground">No tasks have been added to this job.</p>}</section> : null}

    {tab === "timesheets" ? <section className="pt-6"><div className="flex items-center justify-between gap-3"><div><h2 className="m-0 text-lg font-semibold">Timesheets</h2><p className="mb-0 mt-1 text-sm text-muted-foreground">{formatDuration(totalMs)} recorded across {entries.length} {entries.length === 1 ? "entry" : "entries"}.</p></div>{canLogTime ? <button type="button" onClick={() => setAddingTime(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Log time</button> : null}</div>{entries.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[520px] border-collapse text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-3 font-medium">Activity</th>{canManage ? <th className="py-3 font-medium">Person</th> : null}<th className="py-3 font-medium">Date</th><th className="py-3 text-right font-medium">Time</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id} className="border-b border-border"><td className="py-4">{entry.activity}{entry.taskId ? <span className="ml-2 text-xs text-muted-foreground">{tasks.find((task) => task.id === entry.taskId)?.title || "Task"}</span> : null}</td>{canManage ? <td className="py-4 text-muted-foreground">{entry.name || "—"}</td> : null}<td className="py-4 text-muted-foreground">{formatDate(entry.startedAt)}</td><td className="py-4 text-right font-medium tabular-nums">{formatDuration(elapsedMs(entry))}</td></tr>)}</tbody></table></div> : <p className="py-10 text-sm text-muted-foreground">No time recorded for this job yet.</p>}</section> : null}

    {tab === "payments" ? <section className="pt-6"><div className="flex items-center justify-between gap-3"><h2 className="m-0 text-lg font-semibold">Payments</h2>{canManage && terms?.assignedTo ? <button type="button" onClick={() => setAddingPayment(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Add payment</button> : null}</div>{payments.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-3 font-medium">For</th><th className="py-3 font-medium">Due</th><th className="py-3 font-medium">Status</th><th className="py-3 text-right font-medium">Amount</th>{canManage ? <th className="py-3 text-right font-medium">Action</th> : null}</tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-b border-border"><td className="py-4">{payment.description}</td><td className="py-4 text-muted-foreground">{payment.dueDate ? formatDate(payment.dueDate) : "—"}</td><td className="py-4">{payment.status === "paid" ? "Paid" : "Pending"}</td><td className="py-4 text-right font-semibold tabular-nums">{formatAmount(payment.amount, payment.currency)}</td>{canManage ? <td className="py-4 text-right"><button type="button" onClick={() => void togglePaymentStatus(payment)} className="text-xs font-semibold text-primary hover:underline">{payment.status === "paid" ? "Mark pending" : "Mark paid"}</button></td> : null}</tr>)}</tbody></table></div> : <p className="py-10 text-sm text-muted-foreground">No payments recorded for this job yet.</p>}</section> : null}

    {canManage && user && terms?.assignedTo ? <NewJobTaskDialog job={job} terms={terms} createdBy={actualUser?.uid ?? user.uid} createdByName={actualUser?.name ?? actualUser?.email ?? user.name ?? user.email} open={addingTask} onOpenChange={setAddingTask} onSaved={() => void loadRelated()} /> : null}
    {canManage && terms?.assignedTo ? <AttachJobTaskDialog job={job} terms={terms} open={attachingTask} onOpenChange={setAttachingTask} onSaved={() => void loadRelated()} /> : null}
    {canLogTime && user ? <LogJobTimeDialog job={job} tasks={tasks} uid={user.uid} name={user.name ?? user.email} open={addingTime} onOpenChange={setAddingTime} onSaved={() => void loadRelated()} /> : null}
    {canManage && user && terms?.assignedTo ? <NewJobPaymentDialog job={job} terms={terms} createdBy={actualUser?.uid ?? user.uid} open={addingPayment} onOpenChange={setAddingPayment} onSaved={() => void loadRelated()} /> : null}
  </main>;
}

function jobLink(job: Job) {
  return { clientId: job.clientId, clientName: job.clientName, jobId: job.slug, jobName: job.title ?? job.name };
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

function NewJobTaskDialog({ job, terms, createdBy, createdByName, open, onOpenChange, onSaved }: { job: Job; terms: JobTerms; createdBy: string; createdByName: string | null; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!title.trim() || saving || !terms.assignedTo) return; setSaving(true); setError(null); try { const now = new Date().toISOString(); await addDoc(collection(firebaseDb, TASK_COLLECTION), { ...jobLink(job), title: title.trim(), description: description.trim(), content: "", assignedTo: terms.assignedTo, assignedToName: terms.assignedToName, createdBy, createdByName, status: "todo", dueDate: dueDate || null, createdAt: now, updatedAt: now }); setTitle(""); setDescription(""); setDueDate(""); onOpenChange(false); onSaved(); } catch (cause) { console.error("Unable to add job task", cause); setError("Couldn’t add this task."); } finally { setSaving(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>New task</DialogTitle><DialogDescription>Assign a task to {terms.assignedToName} within {job.title ?? job.name}.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4"><label className={fieldClass}>Title<Input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label className={fieldClass}>Description<Input value={description} onChange={(event) => setDescription(event.target.value)} /></label><label className={fieldClass}>Due date<Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end"><button type="submit" disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Add task"}</button></div></form></DialogContent></Dialog>;
}

function LogJobTimeDialog({ job, tasks, uid, name, open, onOpenChange, onSaved }: { job: Job; tasks: Task[]; uid: string; name: string | null; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [activity, setActivity] = React.useState("");
  const [date, setDate] = React.useState(localDateValue);
  const [hours, setHours] = React.useState("");
  const [taskId, setTaskId] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const amount = Number(hours); const start = new Date(`${date}T09:00:00`); if (!activity.trim() || !Number.isFinite(amount) || amount <= 0 || amount > 24 || Number.isNaN(start.getTime())) { setError("Enter an activity, date and up to 24 hours."); return; } setSaving(true); setError(null); try { await addDoc(collection(firebaseDb, ACTIVITY_COLLECTION), { taskId: taskId || null, uid, name, jobId: job.slug, jobName: job.title ?? job.name, activity: activity.trim(), startedAt: start.toISOString(), endedAt: new Date(start.getTime() + Math.round(amount * 3600000)).toISOString(), pausedAt: null, pausedMs: 0 }); setActivity(""); setHours(""); setTaskId(""); onOpenChange(false); onSaved(); } catch (cause) { console.error("Unable to log job time", cause); setError("Couldn’t log this time."); } finally { setSaving(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Log time</DialogTitle><DialogDescription>Add time worked on {job.title ?? job.name}.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4"><label className={fieldClass}>Activity<Input value={activity} onChange={(event) => setActivity(event.target.value)} required placeholder="What did you work on?" /></label><label className={fieldClass}>Task (optional)<select value={taskId} onChange={(event) => setTaskId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">No specific task</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className={fieldClass}>Date<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className={fieldClass}>Hours<Input type="number" min="0.01" max="24" step="0.01" value={hours} onChange={(event) => setHours(event.target.value)} required /></label></div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end"><button type="submit" disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Log time"}</button></div></form></DialogContent></Dialog>;
}

function NewJobPaymentDialog({ job, terms, createdBy, open, onOpenChange, onSaved }: { job: Job; terms: JobTerms; createdBy: string; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<PaymentCurrency>(terms.rateCurrency);
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const value = Number(amount); if (!Number.isFinite(value) || value <= 0 || !description.trim() || !terms.assignedTo) { setError("Enter an amount and description."); return; } setSaving(true); setError(null); try { await addDoc(collection(firebaseDb, PAYMENTS_COLLECTION), { jobId: job.slug, jobName: job.title ?? job.name, payeeUid: terms.assignedTo, payeeName: terms.assignedToName ?? "", amount: value, currency, description: description.trim(), status: "pending", dueDate: dueDate || null, paidAt: null, createdBy, createdAt: new Date().toISOString() }); setAmount(""); setDescription(""); setDueDate(""); onOpenChange(false); onSaved(); } catch (cause) { console.error("Unable to add job payment", cause); setError("Couldn’t add this payment."); } finally { setSaving(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add payment</DialogTitle><DialogDescription>Record a payment to {terms.assignedToName} for {job.title ?? job.name}.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4"><div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3"><label className={fieldClass}>Amount<Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label><label className={fieldClass}>Currency<select value={currency} onChange={(event) => setCurrency(event.target.value as PaymentCurrency)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="NGN">NGN</option><option value="USD">USD</option></select></label></div><label className={fieldClass}>What it is for<Input value={description} onChange={(event) => setDescription(event.target.value)} required /></label><label className={fieldClass}>Due date<Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end"><button type="submit" disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Add payment"}</button></div></form></DialogContent></Dialog>;
}
