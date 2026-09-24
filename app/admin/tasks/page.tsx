"use client";

import * as React from "react";
import Link from "next/link";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreatorPicker } from "@/components/creator-picker";
import { useFirestoreTasks, useFirestoreUsers } from "@/lib/firebase/client-content";
import { TASK_COLLECTION, TASK_STATUSES, TASK_STATUS_LABELS, formatDate, type TaskStatus } from "@/lib/creator-tasks";
import { firebaseDb } from "@/lib/firebase/client";
import { plural } from "@/lib/format";
import { isCreatorUser } from "@/lib/users";

type AssigneeOption = { uid: string; name: string; slug: string; isCreator: boolean; hint: string };

function NewTaskDialog({ assignees, createdBy, createdByName, onCreated }: {
  assignees: AssigneeOption[];
  createdBy: string;
  createdByName: string | null;
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [assignedTo, setAssignedTo] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => { setAssignedTo(""); setTitle(""); setDescription(""); setDueDate(""); setError(null); };
  const handleOpenChange = (next: boolean) => { setOpen(next); if (!next) reset(); };
  const canSave = title.trim().length > 0 && assignedTo.length > 0 && !busy;

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      const assignee = assignees.find((candidate) => candidate.uid === assignedTo);
      const now = new Date().toISOString();
      await addDoc(collection(firebaseDb, TASK_COLLECTION), {
        title: title.trim(),
        description: description.trim(),
        assignedTo,
        assignedToName: assignee?.name ?? null,
        createdBy,
        createdByName,
        status: "todo",
        dueDate: dueDate || null,
        createdAt: now,
        updatedAt: now,
      });
      onCreated();
      setOpen(false);
      reset();
    } catch (cause) {
      console.error("Unable to create task", cause);
      setError("Couldn’t create that task. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={LIST_ACTION_CLASS}>
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />New task
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>Assign a piece of work to anyone with an account.</DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Assign to</span>
              <CreatorPicker
                options={assignees.map((a) => ({ value: a.uid, label: a.hint ? `${a.name} · ${a.hint}` : a.name }))}
                value={assignedTo}
                onChange={setAssignedTo}
                placeholder="Search people"
                emptyText="No people found."
                autoFocus={false}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="task-title" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Title</label>
              <Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={busy} placeholder="What needs doing" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="task-description" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Details</label>
              <Textarea id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} placeholder="Brief, deliverables, links…" rows={4} />
            </div>
            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Due date</span>
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={busy} className="h-10" />
            </div>
            {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}
            <DialogFooter>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="h-9 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={!canSave} className="h-9 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Creating…" : "Create task"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function TasksPage() {
  const { user, role, loading: authLoading } = useAuth();
  const { tasks, loading, error } = useFirestoreTasks();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus | "all">("all");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const isStaff = role === "admin" || role === "manager";

  // Any signed-in user can be assigned a task (they need an account so the
  // task can reach them). Ordered by name and searchable in the picker.
  const assignees: AssigneeOption[] = users
    .filter((candidate) => candidate.uid)
    .map((candidate) => ({
      uid: candidate.uid as string,
      name: candidate.name,
      slug: candidate.slug,
      isCreator: isCreatorUser(candidate),
      hint: isCreatorUser(candidate) ? (candidate.category || "Creator") : (candidate.title || candidate.role || ""),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const visible = tasks.filter((task) => {
    if (status !== "all" && task.status !== status) return false;
    return [task.title, task.description, task.assignedToName].filter(Boolean).join(" ").toLowerCase().includes(search.trim().toLowerCase());
  });

  const setTaskStatus = async (id: string, next: TaskStatus) => {
    setBusyId(id);
    setActionError(null);
    try {
      await updateDoc(doc(firebaseDb, TASK_COLLECTION, id), { status: next, updatedAt: new Date().toISOString() });
      window.location.reload();
    } catch (cause) {
      console.error("Unable to update task", cause);
      setActionError("Couldn’t update the task. Please try again.");
      setBusyId(null);
    }
  };

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Delete “${title}”? This can’t be undone.`)) return;
    setBusyId(id);
    setActionError(null);
    try {
      await deleteDoc(doc(firebaseDb, TASK_COLLECTION, id));
      window.location.reload();
    } catch (cause) {
      console.error("Unable to delete task", cause);
      setActionError("Couldn’t delete the task. Please try again.");
      setBusyId(null);
    }
  };

  if (authLoading || loading || usersLoading) return <UsersTableSkeleton />;
  if (!isStaff) return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8"><PageHeader title="Tasks" /><p className="mt-8 text-sm text-muted-foreground">A staff account is required to manage tasks.</p></main>;

  return <DashboardListPage title="Tasks" actions={<NewTaskDialog assignees={assignees} createdBy={user!.uid} createdByName={user!.name ?? user!.email} onCreated={() => window.location.reload()} />}
    toolbar={<div className="space-y-3"><FilterBar panelId="admin-tasks-filter" search={search} onSearchChange={setSearch} searchPlaceholder="Search tasks" resultCount={plural(visible.length, "task")} /><div className="flex flex-wrap gap-2" aria-label="Task status filter">{(["all", ...TASK_STATUSES] as const).map((value) => <button key={value} type="button" onClick={() => setStatus(value)} aria-pressed={status === value} className={`rounded-md border px-3 py-1.5 text-[13px] font-medium ${status === value ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"}`}>{value === "all" ? "All" : TASK_STATUS_LABELS[value]}</button>)}</div></div>}>
    {error || actionError ? <p className="mb-4 text-[13px] text-destructive">{error ?? actionError}</p> : null}
    <section className="overflow-x-auto rounded-xl border border-border bg-background">
      {visible.length ? <Table className="min-w-[760px] w-full border-collapse"><TableHeader><TableRow className="bg-muted/40"><TableHead className="px-4 py-3">Task</TableHead><TableHead className="px-4 py-3">Assigned to</TableHead><TableHead className="px-4 py-3">Due</TableHead><TableHead className="px-4 py-3">Status</TableHead><TableHead className="px-4 py-3 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{visible.map((task) => {
        const assignee = assignees.find((candidate) => candidate.uid === task.assignedTo);
        const name = task.assignedToName ?? assignee?.name ?? "—";
        return <TableRow key={task.id} className="align-top">
          <TableCell className="max-w-[420px] px-4 py-3"><p className="m-0 font-semibold">{task.title}</p>{task.description ? <p className="mb-0 mt-0.5 max-w-[40ch] text-muted-foreground">{task.description}</p> : null}</TableCell>
          <TableCell className="px-4 py-3">{assignee?.isCreator ? <Link href={`/dashboard/discover/${assignee.slug}`} className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">{name}</Link> : name}</TableCell>
          <TableCell className="whitespace-nowrap px-4 py-3 text-muted-foreground">{task.dueDate ? formatDate(task.dueDate) : "—"}</TableCell>
          <TableCell className="px-4 py-3"><Select value={task.status} onValueChange={(value) => void setTaskStatus(task.id, value as TaskStatus)}><SelectTrigger disabled={busyId === task.id} className="h-9 w-[150px]"><SelectValue /></SelectTrigger><SelectContent>{TASK_STATUSES.map((value) => <SelectItem key={value} value={value}>{TASK_STATUS_LABELS[value]}</SelectItem>)}</SelectContent></Select></TableCell>
          <TableCell className="px-4 py-3"><div className="flex justify-end gap-1.5">{role === "admin" && <button type="button" onClick={() => void remove(task.id, task.title)} disabled={busyId === task.id} aria-label={`Delete ${task.title}`} className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>}</div></TableCell>
        </TableRow>;
      })}</TableBody></Table> : <div className="px-5 py-12 text-center"><p className="m-0 text-[15px] font-semibold">{tasks.length ? "No tasks match" : "No tasks yet"}</p><p className="mb-0 mt-1 text-sm text-muted-foreground">{tasks.length ? "Try another search or status." : "Create a task and assign it to a creator."}</p></div>}
    </section>
  </DashboardListPage>;
}
