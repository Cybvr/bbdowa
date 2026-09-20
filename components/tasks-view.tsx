"use client";

import * as React from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { readUsersFromFirestore } from "@/lib/firebase/client-content";
import { isCreatorUser, type User } from "@/lib/users";
import { EmptyState, SectionHeading } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
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

function NewTaskDialog({ creators, createdBy, createdByName, onCreated }: {
  creators: User[];
  createdBy: string;
  createdByName: string | null;
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setDueDate("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const canSave = title.trim().length > 0 && assignedTo.length > 0 && !busy;

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      const assignee = creators.find((creator) => creator.uid === assignedTo);
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
            <DialogDescription>Assign work to a creator.</DialogDescription>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Assign to</span>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger aria-required="true" className="h-10 w-full"><SelectValue placeholder="Select a creator" /></SelectTrigger>
                  <SelectContent>
                    {creators.map((creator) => (
                      <SelectItem key={creator.uid ?? creator.slug} value={creator.uid as string}>{creator.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Due date</span>
                <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={busy} className="h-10" />
              </div>
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

export function TasksView() {
  const { user, role, loading: authLoading } = useAuth();
  const isStaff = role === "admin" || role === "manager";

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [creators, setCreators] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async (uid: string, staff: boolean) => {
    const snapshot = staff
      ? await getDocs(collection(firebaseDb, TASK_COLLECTION))
      : await getDocs(query(collection(firebaseDb, TASK_COLLECTION), where("assignedTo", "==", uid)));
    const rows = snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<Task, "id">) }));
    setTasks(sortTasks(rows));
  }, []);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    Promise.all([
      load(user.uid, isStaff),
      isStaff ? readUsersFromFirestore().then((users) => users.filter((u) => isCreatorUser(u) && u.uid)) : Promise.resolve([]),
    ])
      .then(([, creatorUsers]) => {
        if (active) setCreators(creatorUsers);
      })
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
  }, [authLoading, user, isStaff, load]);

  const reload = () => {
    if (user) void load(user.uid, isStaff);
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

  if (authLoading || loading) return <PageLoadingSkeleton titleWidth="w-32" />;

  if (!user) {
    return <EmptyState title="Sign in to view tasks" description="Tasks assigned to you show up here once you’re signed in." />;
  }

  return (
    <div className="mt-8 space-y-6">
      {error ? <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px] text-primary">{error}</p> : null}

      {isStaff ? (
        <div className="flex justify-end">
          <NewTaskDialog creators={creators} createdBy={user.uid} createdByName={user.name ?? user.email} onCreated={reload} />
        </div>
      ) : null}

      {tasks.length === 0 ? (
        <EmptyState
          title={isStaff ? "No tasks yet" : "Nothing assigned to you yet"}
          description={isStaff ? "Create a task and assign it to a creator." : "Tasks your team gives you will show up here."}
        />
      ) : isStaff ? (
        <section aria-labelledby="all-tasks">
          <SectionHeading id="all-tasks">All tasks</SectionHeading>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-[720px] w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Assigned to</th>
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
                      {task.description ? <p className="mb-0 mt-0.5 max-w-[36ch] text-[13px] text-muted-foreground">{task.description}</p> : null}
                    </td>
                    <td className="px-4 py-3">{task.assignedToName ?? "—"}</td>
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
        </section>
      ) : (
        <section aria-labelledby="my-tasks">
          <SectionHeading id="my-tasks">Your tasks</SectionHeading>
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
        </section>
      )}
    </div>
  );
}
