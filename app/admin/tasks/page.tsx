"use client";

import * as React from "react";
import Link from "next/link";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { Copy, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreatorPicker } from "@/components/creator-picker";
import { TaskDetailSheet, TaskStatusBadge } from "@/components/tasks-view";
import { TaskClientCampaignFields, useTaskLinkOptions } from "@/components/task-link-fields";
import { useFirestoreTasks, useFirestoreUsers } from "@/lib/firebase/client-content";
import { TASK_COLLECTION, TASK_STATUSES, TASK_STATUS_LABELS, formatDate, isOverdue, type Task, type TaskStatus } from "@/lib/creator-tasks";
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
  const [clientId, setClientId] = React.useState<string | null>(null);
  const [campaignId, setCampaignId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { clients, campaigns, loading: linksLoading } = useTaskLinkOptions();

  const reset = () => { setAssignedTo(""); setTitle(""); setDescription(""); setDueDate(""); setClientId(null); setCampaignId(null); setError(null); };
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
        clientId,
        clientName: clients.find((client) => client.slug === clientId)?.name ?? null,
        campaignId,
        campaignName: campaigns.find((campaign) => campaign.slug === campaignId)?.name ?? null,
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
              <label htmlFor="task-description" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Description</label>
              <Textarea id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} placeholder="Brief, deliverables, links…" rows={4} />
            </div>
            <TaskClientCampaignFields
              clientId={clientId}
              campaignId={campaignId}
              clients={clients}
              campaigns={campaigns}
              disabled={busy || linksLoading}
              onClientChange={(value) => { setClientId(value); setCampaignId(null); }}
              onCampaignChange={setCampaignId}
            />
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
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
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

  // Always let the signed-in person assign to themselves, even if their own
  // directory record has no uid stored yet.
  if (user?.uid && !assignees.some((a) => a.uid === user.uid)) {
    assignees.unshift({ uid: user.uid, name: `${user.name ?? user.email ?? "Me"} (you)`, slug: "", isCreator: false, hint: "" });
  }

  const visible = tasks.filter((task) => {
    if (status !== "all" && task.status !== status) return false;
    return [task.title, task.description, task.assignedToName, task.clientName, task.campaignName].filter(Boolean).join(" ").toLowerCase().includes(search.trim().toLowerCase());
  });

  const duplicate = async (task: Task) => {
    setBusyId(task.id);
    setActionError(null);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(firebaseDb, TASK_COLLECTION), {
        title: `${task.title} (Copy)`, description: task.description,
        clientId: task.clientId ?? null, clientName: task.clientName ?? null,
        campaignId: task.campaignId ?? null, campaignName: task.campaignName ?? null,
        assignedTo: task.assignedTo, assignedToName: task.assignedToName,
        createdBy: user!.uid, createdByName: user!.name ?? user!.email,
        status: "todo", dueDate: task.dueDate, createdAt: now, updatedAt: now,
      });
      window.location.reload();
    } catch (cause) {
      console.error("Unable to duplicate task", cause);
      setActionError("Couldn’t duplicate the task. Please try again.");
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
    <section className="mt-4 overflow-x-auto rounded-xl border border-border bg-background">
      {visible.length ? <Table className="w-full table-fixed border-collapse"><TableHeader><TableRow className="bg-muted/40"><TableHead className="px-4 py-3">Task</TableHead><TableHead className="w-20 px-4 py-3 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{visible.map((task) => {
        const assignee = assignees.find((candidate) => candidate.uid === task.assignedTo);
        const name = task.assignedToName ?? assignee?.name ?? "—";
        return <TableRow key={task.id} className="align-top">
          <TableCell className="px-4 py-3">
            <button type="button" onClick={() => setSelectedId(task.id)} className="m-0 block max-w-full truncate text-left font-semibold text-foreground hover:text-primary">{task.title}</button>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
              {assignee?.isCreator ? <Link href={`/dashboard/discover/${assignee.slug}`} className="max-w-[45%] shrink-0 truncate font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">{name}</Link> : <span className="max-w-[45%] shrink-0 truncate">{name}</span>}
              {task.description ? <><span aria-hidden="true" className="hidden sm:inline">·</span><span className="hidden min-w-0 truncate sm:inline">{task.description}</span></> : null}
            </div>
            <div className="mt-1 hidden flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground sm:flex">
              {task.clientName ? <span>{task.clientName}</span> : null}
              {task.campaignName ? <span>{task.campaignName}</span> : null}
              {task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : null}
              <TaskStatusBadge status={task.status} overdue={isOverdue(task)} />
            </div>
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label={`Actions for ${task.title}`} disabled={busyId === task.id} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onSelect={() => void duplicate(task)}><Copy className="h-4 w-4" />Duplicate</DropdownMenuItem>
                  {role === "admin" ? <DropdownMenuItem variant="destructive" onSelect={() => void remove(task.id, task.title)}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem> : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        </TableRow>;
      })}</TableBody></Table> : <div className="px-5 py-12 text-center"><p className="m-0 text-[15px] font-semibold">{tasks.length ? "No tasks match" : "No tasks yet"}</p><p className="mb-0 mt-1 text-sm text-muted-foreground">{tasks.length ? "Try another search or status." : "Create a task and assign it to a creator."}</p></div>}
    </section>

    <TaskDetailSheet
      task={visible.find((task) => task.id === selectedId) ?? null}
      onOpenChange={(open) => { if (!open) setSelectedId(null); }}
      canEdit={isStaff}
      canDelete={isStaff}
      assignees={assignees.map(({ uid, name }) => ({ uid, name }))}
      onChanged={() => window.location.reload()}
    />
  </DashboardListPage>;
}
