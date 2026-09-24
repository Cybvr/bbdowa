"use client";

import * as React from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { firebaseDb } from "@/lib/firebase/client";
import { EmptyState } from "@/components/dashboard/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ItemCard, ItemCardList } from "@/components/dashboard/item-card";
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

export function TaskStatusBadge({ status, overdue }: { status: TaskStatus; overdue: boolean }) {
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

export function NewTaskSheet({ creatorUid, creatorName, createdBy, createdByName, onCreated }: {
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
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Plus aria-hidden="true" className="h-4 w-4" />New
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" aria-describedby={undefined} className="[&>button]:bg-muted [&>button]:text-foreground [&>button]:opacity-100">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="pr-8">New task</SheetTitle>
            <SheetDescription>Assign work to {creatorName}.</SheetDescription>
          </SheetHeader>

          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
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
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="h-9 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={!canSave} className="h-9 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Creating…" : "Create task"}</button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Right-side sheet showing one task's details. Status can be changed when
 * `canEdit`; staff (`canDelete`) can delete. Calls `onChanged` after a write. */
export function TaskDetailSheet({ task, onOpenChange, canEdit, canDelete, onChanged }: {
  task: Task | null;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setStatus = async (status: TaskStatus) => {
    if (!task) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, TASK_COLLECTION, task.id), { status, updatedAt: new Date().toISOString() });
      onChanged();
    } catch (cause) {
      console.error("Unable to update task", cause);
      setError("Couldn’t update that task. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const removeTask = async () => {
    if (!task || !window.confirm("Delete this task? This can’t be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDoc(doc(firebaseDb, TASK_COLLECTION, task.id));
      onOpenChange(false);
      onChanged();
    } catch (cause) {
      console.error("Unable to delete task", cause);
      setError("Couldn’t delete that task. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={Boolean(task)} onOpenChange={onOpenChange}>
      <SheetContent side="right" aria-describedby={undefined} className="[&>button]:bg-muted [&>button]:text-foreground [&>button]:opacity-100">
        {task ? (
          <>
            <SheetHeader className="border-b border-border">
              <SheetTitle className="pr-8">{task.title}</SheetTitle>
              <SheetDescription>
                {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
                {task.assignedToName ? ` · For ${task.assignedToName}` : ""}
                {task.createdByName ? ` · From ${task.createdByName}` : ""}
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
              {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}
              <div>
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</span>
                <div className="flex items-center gap-3">
                  <TaskStatusBadge status={task.status} overdue={isOverdue(task)} />
                  {canEdit ? (
                    <Select value={task.status} onValueChange={(value) => void setStatus(value as TaskStatus)}>
                      <SelectTrigger disabled={busy} className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((status) => <SelectItem key={status} value={status}>{TASK_STATUS_LABELS[status]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              </div>
              <div>
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Details</span>
                <p className="m-0 whitespace-pre-wrap text-[14px] leading-[1.55] text-foreground">{task.description || "No details added."}</p>
              </div>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => void removeTask()}
                  disabled={busy}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-semibold text-destructive transition hover:border-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />Delete task
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/** Tasks for one creator, shown on their profile page. Staff assign and manage them; the creator only moves them through status. */
export function CreatorTasksPanel({ creatorUid, creatorName, viewer, refreshSignal = 0 }: { creatorUid: string | null | undefined; creatorName: string; viewer: TaskViewer; refreshSignal?: number }) {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = tasks.find((task) => task.id === selectedId) ?? null;
  // Only staff or the assigned creator can change a task; everyone else views it read-only.
  const canEdit = viewer.isStaff || (Boolean(viewer.uid) && viewer.uid === creatorUid);

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
  }, [creatorUid, load, refreshSignal]);

  const reload = () => {
    if (creatorUid) void load(creatorUid);
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

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description={viewer.isStaff ? `Create a task and assign it to ${creatorName}.` : `Tasks assigned to ${creatorName} will show up here.`}
        />
      ) : (
        <ItemCardList>
          {tasks.map((task) => (
            <ItemCard
              key={task.id}
              onClick={() => setSelectedId(task.id)}
              icon={<CheckSquare className="h-5 w-5" aria-hidden="true" />}
              title={task.title}
              subtitle={task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
              trailing={<TaskStatusBadge status={task.status} overdue={isOverdue(task)} />}
            />
          ))}
        </ItemCardList>
      )}

      <TaskDetailSheet
        task={selected}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        canEdit={canEdit}
        canDelete={viewer.isStaff}
        onChanged={reload}
      />
    </div>
  );
}
