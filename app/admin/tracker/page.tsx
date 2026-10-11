"use client";

import * as React from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, runTransaction, updateDoc } from "firebase/firestore";
import { Pencil, Plus, Square, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar, type FilterTab } from "@/components/dashboard/filter-bar";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { confirmDialog } from "@/components/confirm-dialog";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { jobTitle, normalizeJob } from "@/lib/jobs";
import {
  ACTIVITY_COLLECTION,
  elapsedMs,
  formatClockFull,
  formatTimestamp,
  isPaused,
  sortByStartedAt,
  type ActivityEntry,
} from "@/lib/time-tracking";

const NO_JOB = "__none";

type StatusKey = "all" | "running" | "paused" | "completed";
const STATUS_TABS: FilterTab<StatusKey>[] = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "paused", label: "Paused" },
  { key: "completed", label: "Completed" },
];

type Form = { id: string | null; uid: string; activity: string; jobId: string; startedAt: string; endedAt: string };
const EMPTY_FORM: Form = { id: null, uid: "", activity: "", jobId: NO_JOB, startedAt: "", endedAt: "" };

// <input type="datetime-local"> works in local time without a zone.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function statusOf(entry: ActivityEntry): Exclude<StatusKey, "all"> {
  if (entry.endedAt) return "completed";
  return isPaused(entry) ? "paused" : "running";
}

export default function AdminTimePage() {
  const { role, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [entries, setEntries] = React.useState<ActivityEntry[]>([]);
  const [jobs, setJobs] = React.useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<StatusKey>("all");
  const [person, setPerson] = React.useState("all");
  const [jobFilter, setJobFilter] = React.useState("all");
  const [form, setForm] = React.useState<Form | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());
  const isStaff = role === "admin" || role === "manager";
  const isAdmin = role === "admin";

  const load = React.useCallback(async () => {
    const snapshot = await getDocs(collection(firebaseDb, ACTIVITY_COLLECTION));
    setEntries(sortByStartedAt(snapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<ActivityEntry, "id">),
    }))));
  }, []);

  React.useEffect(() => {
    if (authLoading || !isStaff) return;
    let active = true;
    load()
      .catch((cause) => {
        console.error("Unable to load time entries", cause);
        if (active) setError("Unable to load tracked time.");
      })
      .finally(() => { if (active) setLoading(false); });
    jobsCollection()
      .then((name) => getDocs(collection(firebaseDb, name)))
      .then((snapshot) => {
        if (!active) return;
        setJobs(snapshot.docs
          .map((document) => normalizeJob(document.data(), document.id))
          .map((job) => ({ slug: job.slug, name: jobTitle(job) }))
          .sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((cause) => console.error("Unable to load jobs", cause));
    return () => { active = false; };
  }, [authLoading, isStaff, load]);

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const people = React.useMemo(() => {
    const byUid = new Map<string, string>();
    for (const user of users) if (user.uid) byUid.set(user.uid, user.preferredName || user.name || user.email || "Unnamed");
    for (const entry of entries) if (!byUid.has(entry.uid)) byUid.set(entry.uid, entry.name || "Unknown");
    return [...byUid].map(([uid, name]) => ({ uid, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [users, entries]);
  const nameOf = (uid: string) => people.find((option) => option.uid === uid)?.name ?? "Unknown";

  const needle = search.trim().toLowerCase();
  const visible = entries.filter((entry) => {
    if (status !== "all" && statusOf(entry) !== status) return false;
    if (person !== "all" && entry.uid !== person) return false;
    if (jobFilter !== "all" && entry.jobId !== jobFilter) return false;
    return !needle || `${entry.activity} ${entry.jobName ?? ""} ${nameOf(entry.uid)}`.toLowerCase().includes(needle);
  });
  const totalMs = visible.reduce((total, entry) => total + elapsedMs(entry, now), 0);

  const openEdit = (entry: ActivityEntry) => {
    setFormError(null);
    setForm({
      id: entry.id,
      uid: entry.uid,
      activity: entry.activity,
      jobId: entry.jobId ?? NO_JOB,
      startedAt: toLocalInput(entry.startedAt),
      endedAt: toLocalInput(entry.endedAt),
    });
  };

  const save = async () => {
    if (!form) return;
    const startedAt = fromLocalInput(form.startedAt);
    const endedAt = fromLocalInput(form.endedAt);
    if (!form.uid || !form.activity.trim() || !startedAt) {
      setFormError("Person, activity and start time are required.");
      return;
    }
    if (endedAt && endedAt <= startedAt) {
      setFormError("End time must be after the start time.");
      return;
    }
    const job = jobs.find((option) => option.slug === form.jobId);
    const existing = form.id ? entries.find((entry) => entry.id === form.id) : null;
    const timesChanged = !existing || existing.startedAt !== startedAt || existing.endedAt !== endedAt;
    const data = {
      uid: form.uid,
      name: nameOf(form.uid),
      activity: form.activity.trim(),
      jobId: job?.slug ?? null,
      jobName: job?.name ?? null,
      startedAt,
      endedAt,
      // New times mean the admin set the duration directly; drop old pauses.
      ...(timesChanged ? { pausedAt: null, pausedMs: 0 } : {}),
    };
    setBusy(true);
    setFormError(null);
    try {
      if (form.id) await updateDoc(doc(firebaseDb, ACTIVITY_COLLECTION, form.id), data);
      else await addDoc(collection(firebaseDb, ACTIVITY_COLLECTION), data);
      setForm(null);
      await load();
    } catch (cause) {
      console.error("Unable to save time entry", cause);
      setFormError("Couldn’t save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entry: ActivityEntry) => {
    if (!await confirmDialog(`Delete “${entry.activity}” by ${nameOf(entry.uid)}? This can’t be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDoc(doc(firebaseDb, ACTIVITY_COLLECTION, entry.id));
      await load();
    } catch (cause) {
      console.error("Unable to delete time entry", cause);
      setError("Couldn’t delete that entry. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const stop = async (entry: ActivityEntry) => {
    if (entry.endedAt || busy) return;
    const personName = nameOf(entry.uid);
    if (!await confirmDialog(`Stop “${entry.activity}” for ${personName} now?`, "Stop tracker")) return;
    setBusy(true);
    setError(null);
    try {
      const entryRef = doc(firebaseDb, ACTIVITY_COLLECTION, entry.id);
      await runTransaction(firebaseDb, async (transaction) => {
        const snapshot = await transaction.get(entryRef);
        if (!snapshot.exists()) throw new Error("Time entry no longer exists.");
        const current = snapshot.data() as Omit<ActivityEntry, "id">;
        if (current.endedAt) return;
        const endedAt = new Date();
        const pauseStartedAt = current.pausedAt ? Date.parse(current.pausedAt) : Number.NaN;
        const currentPause = Number.isNaN(pauseStartedAt) ? 0 : Math.max(0, endedAt.getTime() - pauseStartedAt);
        transaction.update(entryRef, {
          endedAt: endedAt.toISOString(),
          pausedAt: null,
          pausedMs: Math.max(0, current.pausedMs ?? 0) + currentPause,
        });
      });
      await load();
    } catch (cause) {
      console.error("Unable to stop tracker", cause);
      setError("Couldn’t stop that tracker. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || (isStaff && (loading || usersLoading))) return <UsersTableSkeleton />;
  if (!isStaff) return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8"><PageHeader title="Tracker" /><p className="mt-8 text-sm text-muted-foreground">A staff account is required to see tracked time.</p></main>;

  return (
    <DashboardListPage
      title="Tracker"
      actions={isAdmin ? <button type="button" onClick={() => { setFormError(null); setForm({ ...EMPTY_FORM, startedAt: toLocalInput(new Date().toISOString()) }); }} className={LIST_ACTION_CLASS}><Plus aria-hidden="true" className="h-3.5 w-3.5" />Add time</button> : null}
      toolbar={<FilterBar
        panelId="admin-time-filter"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search person, activity or job"
        tabs={STATUS_TABS}
        activeTab={status}
        onTabChange={setStatus}
        filters={[
          { label: "Person", value: person, onChange: setPerson, options: [{ value: "all", label: "Everyone" }, ...people.map((option) => ({ value: option.uid, label: option.name }))] },
          { label: "Job", value: jobFilter, onChange: setJobFilter, options: [{ value: "all", label: "All jobs" }, ...jobs.map((option) => ({ value: option.slug, label: option.name }))] },
        ]}
        resultCount={`${visible.length} ${visible.length === 1 ? "entry" : "entries"} · ${formatClockFull(totalMs)}`}
      />}
    >
      {error ? <p role="alert" className="mb-4 text-[13px] text-destructive">{error}</p> : null}
      <section aria-label="Tracked time" className="mt-4">
        {visible.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="m-0 text-[15px] font-semibold">{entries.length ? "No entries match" : "No time tracked yet"}</p>
            <p className="mb-0 mt-1 text-sm text-muted-foreground">{entries.length ? "Try another search or filter." : "Entries appear here when people track time."}</p>
          </div>
        ) : (
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-3">Activity</TableHead>
                <TableHead className="hidden px-4 py-3 md:table-cell">Person</TableHead>
                <TableHead className="hidden px-4 py-3 md:table-cell">Started</TableHead>
                <TableHead className="px-4 py-3 text-right">Time</TableHead>
                {isAdmin ? <TableHead className="w-40 px-4 py-3 text-right"><span className="sr-only">Actions</span></TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((entry) => {
                const state = statusOf(entry);
                return (
                  <ClickableTableRow key={entry.id} label={`Edit ${entry.activity}`} onActivate={() => { if (isAdmin) openEdit(entry); }} className="align-middle">
                    <TableCell className="px-4 py-3">
                      <span className="block font-semibold">{entry.activity || "Untitled activity"}</span>
                      <span className="mt-0.5 block text-[13px] text-muted-foreground">
                        <span className="md:hidden">{nameOf(entry.uid)} · </span>{entry.jobName ?? "No job"}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-muted-foreground md:hidden">{formatTimestamp(entry.startedAt)}</span>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 md:table-cell">{nameOf(entry.uid)}</TableCell>
                    <TableCell className="hidden whitespace-nowrap px-4 py-3 md:table-cell">{formatTimestamp(entry.startedAt)}</TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right">
                      <span className="block font-mono font-semibold tabular-nums">{formatClockFull(elapsedMs(entry, now))}</span>
                      <span className={`block text-[12px] ${state === "running" ? "text-primary" : "text-muted-foreground"}`}>{state === "running" ? "Running" : state === "paused" ? "Paused" : "Completed"}</span>
                    </TableCell>
                    {isAdmin ? (
                      <TableCell className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {!entry.endedAt ? <button type="button" onClick={(event) => { event.stopPropagation(); void stop(entry); }} disabled={busy} aria-label={`Stop ${entry.activity} for ${nameOf(entry.uid)}`} title="Stop tracker" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"><Square className="h-3.5 w-3.5 fill-current" />Stop</button> : null}
                          <button type="button" onClick={(event) => { event.stopPropagation(); openEdit(entry); }} aria-label={`Edit ${entry.activity}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                          <button type="button" onClick={(event) => { event.stopPropagation(); void remove(entry); }} disabled={busy} aria-label={`Delete ${entry.activity}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </TableCell>
                    ) : null}
                  </ClickableTableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog open={Boolean(form)} onOpenChange={(open) => { if (!open) setForm(null); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <DialogHeader className="pr-10">
            <DialogTitle>{form?.id ? "Edit time" : "Add time"}</DialogTitle>
            <DialogDescription>Leave the end empty to keep it running.</DialogDescription>
          </DialogHeader>
          {form ? (
            <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Person</span>
                <Select value={form.uid} onValueChange={(uid) => setForm({ ...form, uid })} disabled={busy}>
                  <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Select a person" /></SelectTrigger>
                  <SelectContent>{people.map((option) => <SelectItem key={option.uid} value={option.uid}>{option.name}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Activity</span>
                <Input value={form.activity} onChange={(event) => setForm({ ...form, activity: event.target.value })} disabled={busy} placeholder="What was done?" className="h-11" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Job</span>
                <Select value={form.jobId} onValueChange={(jobId) => setForm({ ...form, jobId })} disabled={busy}>
                  <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_JOB}>No job</SelectItem>
                    {jobs.map((option) => <SelectItem key={option.slug} value={option.slug}>{option.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Start</span>
                  <Input type="datetime-local" value={form.startedAt} onChange={(event) => setForm({ ...form, startedAt: event.target.value })} disabled={busy} className="h-11" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">End</span>
                  <Input type="datetime-local" value={form.endedAt} onChange={(event) => setForm({ ...form, endedAt: event.target.value })} disabled={busy} className="h-11" />
                </label>
              </div>
              {formError ? <p role="alert" className="text-[13px] text-destructive">{formError}</p> : null}
              <div className="flex flex-col gap-2 pt-1">
                <button type="submit" disabled={busy} className="h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
                <button type="button" onClick={() => setForm(null)} disabled={busy} className="h-10 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardListPage>
  );
}
