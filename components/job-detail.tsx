"use client";

import * as React from "react";
import Link from "next/link";
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { TaskStatusBadge } from "@/components/tasks-view";
import { WorkJobFormDialog } from "@/components/work-job-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { firebaseDb } from "@/lib/firebase/client";
import { TASK_COLLECTION, formatDate, isOverdue, type Task } from "@/lib/creator-tasks";
import { PAYMENTS_COLLECTION, formatAmount, type Payment, type PaymentCurrency } from "@/lib/payments";
import { ACTIVITY_COLLECTION, elapsedMs, formatDuration, type ActivityEntry } from "@/lib/time-tracking";
import { BILLING_CYCLE_LABELS, WORK_JOBS_COLLECTION, WORK_JOB_STATUS_LABELS, type WorkJob } from "@/lib/work-jobs";

type JobTab = "overview" | "tasks" | "timesheets" | "payments";
const tabs: { key: JobTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "tasks", label: "Tasks" },
  { key: "timesheets", label: "Timesheets" },
  { key: "payments", label: "Payments" },
];
const fieldClass = "block space-y-1.5 text-sm font-medium";

function localDateValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1 text-sm sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-5"><dt className="text-muted-foreground">{label}</dt><dd className="m-0 font-medium">{children}</dd></div>;
}

export function JobDetail({ jobId }: { jobId: string }) {
  const { user, actualUser, isViewingAs, role, loading: authLoading } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const [job, setJob] = React.useState<WorkJob | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [entries, setEntries] = React.useState<ActivityEntry[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [tab, setTab] = React.useState<JobTab>("overview");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [addingTask, setAddingTask] = React.useState(false);
  const [attachingTask, setAttachingTask] = React.useState(false);
  const [addingTime, setAddingTime] = React.useState(false);
  const [addingPayment, setAddingPayment] = React.useState(false);

  const loadJob = React.useCallback(async () => {
    const snapshot = await getDoc(doc(firebaseDb, WORK_JOBS_COLLECTION, jobId));
    setJob(snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as Omit<WorkJob, "id">) } : null);
  }, [jobId]);

  const loadRelated = React.useCallback(async () => {
    if (!user) return;
    const timeSource = isStaff
      ? query(collection(firebaseDb, ACTIVITY_COLLECTION), where("jobId", "==", jobId))
      : query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", user.uid));
    const paymentSource = isStaff
      ? query(collection(firebaseDb, PAYMENTS_COLLECTION), where("jobId", "==", jobId))
      : query(collection(firebaseDb, PAYMENTS_COLLECTION), where("payeeUid", "==", user.uid));
    const [taskSnapshot, timeSnapshot, paymentSnapshot] = await Promise.all([
      getDocs(query(collection(firebaseDb, TASK_COLLECTION), where("jobId", "==", jobId))),
      getDocs(timeSource),
      getDocs(paymentSource),
    ]);
    setTasks(taskSnapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Task, "id">) })).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")));
    setEntries(timeSnapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<ActivityEntry, "id">) })).filter((item) => item.jobId === jobId).sort((a, b) => b.startedAt.localeCompare(a.startedAt)));
    setPayments(paymentSnapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Payment, "id">) })).filter((item) => item.jobId === jobId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, [isStaff, jobId, user]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) { setError("Sign in to view this job."); setLoading(false); return; }
    let active = true;
    Promise.all([getDoc(doc(firebaseDb, WORK_JOBS_COLLECTION, jobId)), loadRelated()])
      .then(([snapshot]) => { if (active) setJob(snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as Omit<WorkJob, "id">) } : null); })
      .catch((cause) => { console.error("Unable to load job", cause); if (active) setError("This job is unavailable or you don’t have access."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, jobId, loadRelated, user]);

  if (authLoading || loading) return <PageLoadingSkeleton titleWidth="w-48" />;
  if (error || !job) return <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8"><Link href="/dashboard/jobs" className="text-sm text-primary hover:underline">← Back to jobs</Link><h1 className="mt-8 text-2xl font-bold">{error || "Job not found"}</h1></main>;

  const canLogTime = Boolean(user?.uid && !isViewingAs && user.uid === job.assignedTo && job.status !== "completed");
  const totalMs = entries.reduce((sum, entry) => sum + elapsedMs(entry), 0);
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

  return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-6 sm:px-8">
    <Link href="/dashboard/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground">← Back to jobs</Link>
    <header className="mt-5 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      <div className="min-w-0"><p className="mb-2 text-sm text-muted-foreground">{job.clientName || job.assignedToName}</p><h1 className="m-0 break-words text-page-title font-bold leading-tight sm:text-page-title-lg">{job.title}</h1><p className="mb-0 mt-3 text-sm font-medium">{WORK_JOB_STATUS_LABELS[job.status]}</p></div>
      {isStaff ? <button type="button" onClick={() => setEditing(true)} className="h-9 rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted">Edit job</button> : null}
    </header>
    <nav className="flex gap-6 overflow-x-auto border-b border-border" role="tablist" aria-label="Job sections">
      {tabs.map((item) => <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} onClick={() => setTab(item.key)} className={`shrink-0 border-b-2 py-4 text-sm font-medium ${tab === item.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{item.label}</button>)}
    </nav>
    {actionError ? <p role="alert" className="mt-4 text-sm text-destructive">{actionError}</p> : null}

    {tab === "overview" ? <div className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="space-y-6"><div className="rounded-xl border border-border p-5 sm:p-6"><h2 className="m-0 text-lg font-semibold">Job summary</h2><p className="mb-0 mt-3 whitespace-pre-wrap text-sm leading-relaxed">{job.description || "No description added."}</p></div><div className="rounded-xl border border-border p-5 sm:p-6"><h2 className="m-0 text-lg font-semibold">Engagement details</h2><dl className="mt-5 space-y-4"><Detail label="Assigned to">{job.assignedToName}</Detail><Detail label="Client">{job.clientName || "—"}</Detail><Detail label="Campaign">{job.campaignName || "—"}</Detail><Detail label="Billing cycle">{BILLING_CYCLE_LABELS[job.billingCycle]}</Detail><Detail label="Rate">{job.rateAmount != null ? `${formatAmount(job.rateAmount, job.rateCurrency)} / ${job.rateUnit === "fixed" ? "job" : job.rateUnit}` : "Not set"}</Detail><Detail label="Commitment">{job.commitment || "Not set"}</Detail></dl></div><div className="rounded-xl border border-border p-5 sm:p-6"><h2 className="m-0 text-lg font-semibold">Job details</h2><dl className="mt-5 space-y-4"><Detail label="Specialization">{job.specialization || "—"}</Detail><Detail label="Work setup">{job.workSetup || "—"}</Detail><Detail label="Client hours">{job.clientHours || "—"}</Detail><Detail label="Converted to">{job.clientHoursTimezone || "—"}</Detail><Detail label="Workday overlap">{job.workdayOverlap || "—"}</Detail><Detail label="Client time zone">{job.clientTimezone || "—"}</Detail><Detail label="Estimated length">{job.estimatedLength || "—"}</Detail><Detail label="Languages">{job.languages?.join(", ") || "—"}</Detail><Detail label="Desired start date">{job.desiredStartDate ? formatDate(job.desiredStartDate) : "—"}</Detail><Detail label="Job posted">{job.jobPostedAt ? formatDate(job.jobPostedAt) : "—"}</Detail><Detail label="Required skills">{job.requiredSkills?.length ? <span className="flex flex-wrap gap-2">{job.requiredSkills.map((skill) => <span key={skill} className="rounded-full bg-muted px-2.5 py-1 text-xs">{skill}</span>)}</span> : "—"}</Detail></dl></div><div className="rounded-xl border border-border p-5 sm:p-6"><h2 className="m-0 text-lg font-semibold">Company information</h2><dl className="mt-5 space-y-4"><Detail label="Team size">{job.companyTeamSize ?? "—"}</Detail><Detail label="Year founded">{job.companyYearFounded ?? "—"}</Detail><Detail label="Industry">{job.companyIndustry || "—"}</Detail><Detail label="City / Country">{job.companyLocation || "—"}</Detail><Detail label="Website">{job.companyWebsite ? <a href={job.companyWebsite} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">{job.companyWebsite}</a> : "—"}</Detail><Detail label="LinkedIn">{job.companyLinkedIn ? <a href={job.companyLinkedIn} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">{job.companyLinkedIn}</a> : "—"}</Detail></dl></div></section>
      <aside className="space-y-6"><section className="rounded-xl border border-border p-5"><h2 className="m-0 text-lg font-semibold">Dates</h2><dl className="mt-4 space-y-3"><Detail label="Start">{job.startDate ? formatDate(job.startDate) : "Not set"}</Detail><Detail label="End">{job.endDate ? formatDate(job.endDate) : "Not set"}</Detail></dl></section><section className="rounded-xl border border-border p-5"><h2 className="m-0 text-lg font-semibold">Point of contact</h2><p className="mb-0 mt-4 text-sm font-medium">{job.contactName || "Not set"}</p>{job.contactRole ? <p className="mb-0 mt-1 text-sm text-muted-foreground">{job.contactRole}</p> : null}{job.contactEmail ? <a href={`mailto:${job.contactEmail}`} className="mt-1 block break-all text-sm text-primary hover:underline">{job.contactEmail}</a> : null}{job.contactOutOfOfficeUntil ? <p className="mb-0 mt-3 text-sm text-muted-foreground">Out of office until {formatDate(job.contactOutOfOfficeUntil)}</p> : null}{job.contactNote ? <p className="mb-0 mt-3 text-sm leading-relaxed text-muted-foreground">{job.contactNote}</p> : null}</section></aside>
    </div> : null}

    {tab === "tasks" ? <section className="pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="m-0 text-lg font-semibold">Tasks</h2>{isStaff ? <div className="flex gap-2"><button type="button" onClick={() => setAttachingTask(true)} className="h-9 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted">Attach task</button><button type="button" onClick={() => setAddingTask(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New task</button></div> : null}</div>{tasks.length ? <ul className="mt-5 divide-y divide-border border-y border-border">{tasks.map((task) => <li key={task.id}><Link href={`/dashboard/work/${encodeURIComponent(task.id)}`} className="flex flex-wrap items-center justify-between gap-3 py-4 text-foreground hover:text-primary"><span className="min-w-0"><span className="block font-semibold">{task.title}</span><span className="mt-1 block text-xs text-muted-foreground">{task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}</span></span><TaskStatusBadge status={task.status} overdue={isOverdue(task)} /></Link></li>)}</ul> : <p className="py-10 text-sm text-muted-foreground">No tasks have been added to this job.</p>}</section> : null}

    {tab === "timesheets" ? <section className="pt-6"><div className="flex items-center justify-between gap-3"><div><h2 className="m-0 text-lg font-semibold">Timesheets</h2><p className="mb-0 mt-1 text-sm text-muted-foreground">{formatDuration(totalMs)} recorded across {entries.length} {entries.length === 1 ? "entry" : "entries"}.</p></div>{canLogTime ? <button type="button" onClick={() => setAddingTime(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Log time</button> : null}</div>{entries.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[520px] border-collapse text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-3 font-medium">Activity</th><th className="py-3 font-medium">Date</th><th className="py-3 text-right font-medium">Time</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id} className="border-b border-border"><td className="py-4">{entry.activity}{entry.taskId ? <span className="ml-2 text-xs text-muted-foreground">{tasks.find((task) => task.id === entry.taskId)?.title || "Task"}</span> : null}</td><td className="py-4 text-muted-foreground">{formatDate(entry.startedAt)}</td><td className="py-4 text-right font-medium tabular-nums">{formatDuration(elapsedMs(entry))}</td></tr>)}</tbody></table></div> : <p className="py-10 text-sm text-muted-foreground">No time recorded for this job yet.</p>}</section> : null}

    {tab === "payments" ? <section className="pt-6"><div className="flex items-center justify-between gap-3"><h2 className="m-0 text-lg font-semibold">Payments</h2>{isStaff ? <button type="button" onClick={() => setAddingPayment(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Add payment</button> : null}</div>{payments.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-3 font-medium">For</th><th className="py-3 font-medium">Due</th><th className="py-3 font-medium">Status</th><th className="py-3 text-right font-medium">Amount</th>{isStaff ? <th className="py-3 text-right font-medium">Action</th> : null}</tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-b border-border"><td className="py-4">{payment.description}</td><td className="py-4 text-muted-foreground">{payment.dueDate ? formatDate(payment.dueDate) : "—"}</td><td className="py-4">{payment.status === "paid" ? "Paid" : "Pending"}</td><td className="py-4 text-right font-semibold tabular-nums">{formatAmount(payment.amount, payment.currency)}</td>{isStaff ? <td className="py-4 text-right"><button type="button" onClick={() => void togglePaymentStatus(payment)} className="text-xs font-semibold text-primary hover:underline">{payment.status === "paid" ? "Mark pending" : "Mark paid"}</button></td> : null}</tr>)}</tbody></table></div> : <p className="py-10 text-sm text-muted-foreground">No payments recorded for this job yet.</p>}</section> : null}

    {isStaff ? <WorkJobFormDialog job={job} open={editing} onOpenChange={setEditing} onSaved={() => void loadJob()} /> : null}
    {isStaff && user ? <NewJobTaskDialog job={job} createdBy={actualUser?.uid ?? user.uid} createdByName={actualUser?.name ?? actualUser?.email ?? user.name ?? user.email} open={addingTask} onOpenChange={setAddingTask} onSaved={() => void loadRelated()} /> : null}
    {isStaff ? <AttachJobTaskDialog job={job} open={attachingTask} onOpenChange={setAttachingTask} onSaved={() => void loadRelated()} /> : null}
    {canLogTime && user ? <LogJobTimeDialog job={job} tasks={tasks} uid={user.uid} name={user.name ?? user.email} open={addingTime} onOpenChange={setAddingTime} onSaved={() => void loadRelated()} /> : null}
    {isStaff && user ? <NewJobPaymentDialog job={job} createdBy={actualUser?.uid ?? user.uid} open={addingPayment} onOpenChange={setAddingPayment} onSaved={() => void loadRelated()} /> : null}
  </main>;
}

function AttachJobTaskDialog({ job, open, onOpenChange, onSaved }: { job: WorkJob; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [available, setAvailable] = React.useState<Task[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!open) return;
    let active = true;
    getDocs(query(collection(firebaseDb, TASK_COLLECTION), where("assignedTo", "==", job.assignedTo)))
      .then((snapshot) => { if (active) setAvailable(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Task, "id">) })).filter((task) => !task.jobId)); })
      .catch((cause) => { console.error("Unable to load unlinked tasks", cause); if (active) setError("Couldn’t load available tasks."); });
    return () => { active = false; };
  }, [job.assignedTo, open]);
  const attach = async (taskId: string) => {
    setBusy(true); setError(null);
    try {
      await updateDoc(doc(firebaseDb, TASK_COLLECTION, taskId), { jobId: job.id, clientId: job.clientId, clientName: job.clientName, campaignId: job.campaignId, campaignName: job.campaignName, updatedAt: new Date().toISOString() });
      onOpenChange(false); onSaved();
    } catch (cause) { console.error("Unable to attach task", cause); setError("Couldn’t attach this task."); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Attach an existing task</DialogTitle><DialogDescription>Choose a task already assigned to {job.assignedToName}. Its client and campaign will match this job.</DialogDescription></DialogHeader>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}{available.length ? <ul className="max-h-72 divide-y divide-border overflow-y-auto">{available.map((task) => <li key={task.id}><button type="button" onClick={() => void attach(task.id)} disabled={busy} className="w-full py-3 text-left text-sm font-medium hover:text-primary disabled:opacity-50">{task.title}</button></li>)}</ul> : <p className="text-sm text-muted-foreground">No unlinked tasks for this person.</p>}</DialogContent></Dialog>;
}

function NewJobTaskDialog({ job, createdBy, createdByName, open, onOpenChange, onSaved }: { job: WorkJob; createdBy: string; createdByName: string | null; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!title.trim() || saving) return; setSaving(true); setError(null); try { const now = new Date().toISOString(); await addDoc(collection(firebaseDb, TASK_COLLECTION), { jobId: job.id, title: title.trim(), description: description.trim(), content: "", assignedTo: job.assignedTo, assignedToName: job.assignedToName, clientId: job.clientId, clientName: job.clientName, campaignId: job.campaignId, campaignName: job.campaignName, createdBy, createdByName, status: "todo", dueDate: dueDate || null, createdAt: now, updatedAt: now }); setTitle(""); setDescription(""); setDueDate(""); onOpenChange(false); onSaved(); } catch (cause) { console.error("Unable to add job task", cause); setError("Couldn’t add this task."); } finally { setSaving(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>New task</DialogTitle><DialogDescription>Assign a task within {job.title}.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4"><label className={fieldClass}>Title<Input value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label className={fieldClass}>Description<Input value={description} onChange={(event) => setDescription(event.target.value)} /></label><label className={fieldClass}>Due date<Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end"><button type="submit" disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Add task"}</button></div></form></DialogContent></Dialog>;
}

function LogJobTimeDialog({ job, tasks, uid, name, open, onOpenChange, onSaved }: { job: WorkJob; tasks: Task[]; uid: string; name: string | null; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [activity, setActivity] = React.useState("");
  const [date, setDate] = React.useState(localDateValue);
  const [hours, setHours] = React.useState("");
  const [taskId, setTaskId] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const amount = Number(hours); const start = new Date(`${date}T09:00:00`); if (!activity.trim() || !Number.isFinite(amount) || amount <= 0 || amount > 24 || Number.isNaN(start.getTime())) { setError("Enter an activity, date and up to 24 hours."); return; } setSaving(true); setError(null); try { await addDoc(collection(firebaseDb, ACTIVITY_COLLECTION), { jobId: job.id, jobTitle: job.title, taskId: taskId || null, uid, name, campaignSlug: job.campaignId, campaignName: job.campaignName, activity: activity.trim(), startedAt: start.toISOString(), endedAt: new Date(start.getTime() + Math.round(amount * 3600000)).toISOString(), pausedAt: null, pausedMs: 0 }); setActivity(""); setHours(""); setTaskId(""); onOpenChange(false); onSaved(); } catch (cause) { console.error("Unable to log job time", cause); setError("Couldn’t log this time."); } finally { setSaving(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Log time</DialogTitle><DialogDescription>Add time worked on {job.title}.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4"><label className={fieldClass}>Activity<Input value={activity} onChange={(event) => setActivity(event.target.value)} required placeholder="What did you work on?" /></label><label className={fieldClass}>Task (optional)<select value={taskId} onChange={(event) => setTaskId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">No specific task</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className={fieldClass}>Date<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className={fieldClass}>Hours<Input type="number" min="0.01" max="24" step="0.01" value={hours} onChange={(event) => setHours(event.target.value)} required /></label></div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end"><button type="submit" disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Log time"}</button></div></form></DialogContent></Dialog>;
}

function NewJobPaymentDialog({ job, createdBy, open, onOpenChange, onSaved }: { job: WorkJob; createdBy: string; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<PaymentCurrency>(job.rateCurrency);
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const value = Number(amount); if (!Number.isFinite(value) || value <= 0 || !description.trim()) { setError("Enter an amount and description."); return; } setSaving(true); setError(null); try { await addDoc(collection(firebaseDb, PAYMENTS_COLLECTION), { jobId: job.id, payeeUid: job.assignedTo, payeeName: job.assignedToName, amount: value, currency, description: description.trim(), campaignName: job.campaignName, status: "pending", dueDate: dueDate || null, paidAt: null, createdBy, createdAt: new Date().toISOString() }); setAmount(""); setDescription(""); setDueDate(""); onOpenChange(false); onSaved(); } catch (cause) { console.error("Unable to add job payment", cause); setError("Couldn’t add this payment."); } finally { setSaving(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add payment</DialogTitle><DialogDescription>Record a payment to {job.assignedToName} for {job.title}.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4"><div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3"><label className={fieldClass}>Amount<Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label><label className={fieldClass}>Currency<select value={currency} onChange={(event) => setCurrency(event.target.value as PaymentCurrency)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="NGN">NGN</option><option value="USD">USD</option></select></label></div><label className={fieldClass}>What it is for<Input value={description} onChange={(event) => setDescription(event.target.value)} required /></label><label className={fieldClass}>Due date<Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end"><button type="submit" disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Add payment"}</button></div></form></DialogContent></Dialog>;
}
