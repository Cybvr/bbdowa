"use client";

import * as React from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { firebaseDb } from "@/lib/firebase/client";
import { EmptyState } from "@/components/dashboard/ui";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TASK_COLLECTION,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  formatDate,
  isOverdue,
  sortTasks,
  type Task,
  type TaskStatus,
} from "@/lib/creator-tasks";

/** Who's looking at this creator's tasks: staff manage them, the creator only updates status. */
export type TaskViewer = { uid: string; name: string | null; isStaff: boolean };

function StatusBadge({ status, overdue }: { status: TaskStatus; overdue: boolean }) {
  if (overdue) {
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">
        Overdue
      </span>
    );
  }
  const tone =
    status === "done"
      ? "bg-foreground text-background"
      : status === "in_progress"
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${tone}`}>
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}

function NewTaskDialog({ creatorUid, creatorName, createdBy, createdByName, onCreated }: {
  creatorUid: string;
  creatorName: string;
  createdBy: string;
  createdByName: string | null;
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const canSave = title.trim().length > 0 && !busy;

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(firebaseDb, TASK_COLLECTION), {
        title: title.trim(),
        description: description.trim(),
        assignedTo: creatorUid,
        assignedToName: creatorName,
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        New task
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>Assign work to {creatorName}.</DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
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

/** Tasks for one creator, shown on their profile page. Staff assign and manage them; the creator only moves them through status. */
export function CreatorTasksPanel({ creatorUid, creatorName, viewer }: { creatorUid: string | null | undefined; creatorName: string; viewer: TaskViewer }) {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async (uid: string) => {
    const snapshot = await getDocs(query(collection(firebaseDb, TASK_COLLECTION), where("assignedTo", "==", uid)));
    const rows = snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<Task, "id">) }));
    setTasks(sortTasks(rows));
  }, []);

  React.useEffect(() => {
    if (!creatorUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    load(creatorUid)
      .catch((cause) => {
        console.error("Unable to load tasks from Firestore", cause);
        if (active) setError("Unable to load tasks.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [creatorUid, load]);

  const reload = () => {
    if (creatorUid) void load(creatorUid);
  };

  const setStatus = async (task: Task, status: TaskStatus) => {
    setBusyId(task.id);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, TASK_COLLECTION, task.id), { status, updatedAt: new Date().toISOString() });
      reload();
    } catch (cause) {
      console.error("Unable to update task", cause);
      setError("Couldn’t update that task. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const removeTask = async (task: Task) => {
    if (!window.confirm("Delete this task? This can’t be undone.")) return;
    setBusyId(task.id);
    setError(null);
    try {
      await deleteDoc(doc(firebaseDb, TASK_COLLECTION, task.id));
      reload();
    } catch (cause) {
      console.error("Unable to delete task", cause);
      setError("Couldn’t delete that task. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (!creatorUid) {
    return viewer.isStaff ? (
      <EmptyState title="No account yet" description={`${creatorName} hasn’t signed in yet, so tasks can’t be assigned until they do.`} />
    ) : null;
  }

  if (loading) {
    return (
      <div role="status" aria-label="Loading tasks" className="space-y-2">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px] text-primary">{error}</p> : null}

      {viewer.isStaff ? (
        <div className="flex justify-end">
          <NewTaskDialog creatorUid={creatorUid} creatorName={creatorName} createdBy={viewer.uid} createdByName={viewer.name} onCreated={reload} />
        </div>
      ) : null}

      {tasks.length === 0 ? (
        <EmptyState
          title={viewer.isStaff ? "No tasks yet" : "Nothing assigned to you yet"}
          description={viewer.isStaff ? `Create a task and assign it to ${creatorName}.` : "Tasks your team gives you will show up here."}
        />
      ) : viewer.isStaff ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-[640px] w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-border last:border-b-0 align-top">
                  <td className="px-4 py-3">
                    <p className="m-0 font-semibold">{task.title}</p>
                    {task.description ? <p className="mb-0 mt-0.5 max-w-[40ch] text-[13px] text-muted-foreground">{task.description}</p> : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{task.dueDate ? formatDate(task.dueDate) : "—"}</td>
                  <td className="px-4 py-3">
                    <Select value={task.status} onValueChange={(value) => void setStatus(task, value as TaskStatus)}>
                      <SelectTrigger disabled={busyId === task.id} className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((status) => <SelectItem key={status} value={status}>{TASK_STATUS_LABELS[status]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Actions for ${task.title}`}
                          disabled={busyId === task.id}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-50"
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem variant="destructive" onSelect={() => void removeTask(task)}>
                          <Trash2 className="h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-xl border border-border p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 text-[15px] font-semibold">{task.title}</p>
                  {task.description ? <p className="mb-0 mt-1 text-[13px] leading-[1.5] text-muted-foreground">{task.description}</p> : null}
                  <p className="mb-0 mt-2 text-[12px] text-muted-foreground">
                    {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
                    {task.createdByName ? ` · From ${task.createdByName}` : ""}
                  </p>
                </div>
                <StatusBadge status={task.status} overdue={isOverdue(task)} />
              </div>
              <div className="mt-4 w-full max-w-[200px]">
                <Select value={task.status} onValueChange={(value) => void setStatus(task, value as TaskStatus)}>
                  <SelectTrigger disabled={busyId === task.id} className="h-9 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((status) => <SelectItem key={status} value={status}>{TASK_STATUS_LABELS[status]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
