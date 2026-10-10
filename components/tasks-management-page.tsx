"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { Copy, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar, type FilterTab, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { DashboardCard } from "@/components/dashboard-card";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/rich-text-editor";
import { CreatorMultiPicker } from "@/components/creator-picker";
import { TaskStatusBadge } from "@/components/tasks-view";
import { TaskClientJobFields, useTaskLinkOptions } from "@/components/task-link-fields";
import { useFirestoreTasks, useFirestoreUsers } from "@/lib/firebase/client-content";
import { TASK_COLLECTION, TASK_STATUSES, TASK_STATUS_LABELS, formatDate, isOverdue, isTaskAssignee, taskAssigneeFields, taskAssigneeNames, taskAssignees, type Task, type TaskStatus } from "@/lib/creator-tasks";
import { firebaseDb } from "@/lib/firebase/client";
import { sendAppEmail } from "@/lib/app-email";
import { plural } from "@/lib/format";
import { isCreatorUser } from "@/lib/users";
import { confirmDialog } from "@/components/confirm-dialog";

export type AssigneeOption = { uid: string; name: string; slug: string; isCreator: boolean; hint: string };

const TASK_STATUS_TABS: FilterTab<TaskStatus | "all">[] = [
  { key: "all", label: "All" },
  ...TASK_STATUSES.map((key) => ({ key, label: TASK_STATUS_LABELS[key] })),
];

const TASK_SORTS: SortOption<"recent" | "due" | "title" | "updated">[] = [
  { key: "recent", label: "Most recent" },
  { key: "due", label: "Due date" },
  { key: "title", label: "Name (A–Z)" },
  { key: "updated", label: "Recently updated" },
];

export function NewTaskDialog({ assignees, createdBy, createdByName, initialClientId = null, onCreated }: {
  assignees: AssigneeOption[];
  createdBy: string;
  createdByName: string | null;
  initialClientId?: string | null;
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [assigneeUids, setAssigneeUids] = React.useState<string[]>([]);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [content, setContent] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [clientId, setClientId] = React.useState<string | null>(initialClientId);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { clients, jobs, loading: linksLoading } = useTaskLinkOptions();

  const reset = () => { setAssigneeUids([]); setTitle(""); setDescription(""); setContent(""); setDueDate(""); setClientId(initialClientId); setJobId(null); setError(null); };
  const handleOpenChange = (next: boolean) => { setOpen(next); if (!next) reset(); };
  // Tasks belong to jobs, so picking a client means picking one of its jobs too.
  const canSave = title.trim().length > 0 && assigneeUids.length > 0 && (!clientId || Boolean(jobId)) && !busy;

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      const people = assigneeUids.flatMap((uid) => { const person = assignees.find((candidate) => candidate.uid === uid); return person ? [{ uid, name: person.name.replace(/ (you)$/, "") }] : []; });
      const now = new Date().toISOString();
      const created = await addDoc(collection(firebaseDb, TASK_COLLECTION), {
        title: title.trim(),
        description: description.trim(),
        content,
        clientId,
        clientName: clients.find((client) => client.slug === clientId)?.name ?? null,
        jobId,
        jobName: jobs.find((job) => job.slug === jobId)?.name ?? null,
        ...taskAssigneeFields(people),
        createdBy,
        createdByName,
        status: "todo",
        dueDate: dueDate || null,
        createdAt: now,
        updatedAt: now,
      });
      await sendAppEmail({ type: "task", taskId: created.id });
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
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />Add
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>Assign a piece of work to anyone with an account.</DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Assign to</span>
              <CreatorMultiPicker
                options={assignees.map((a) => ({ value: a.uid, label: a.hint ? `${a.name} · ${a.hint}` : a.name }))}
                values={assigneeUids}
                onChange={setAssigneeUids}
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
              <Input id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} placeholder="Short task summary" />
            </div>
            <RichTextEditor label="Content" value={content} onChange={setContent} placeholder="Add detailed instructions and copy…" compact />
            <div className="grid gap-3 sm:grid-cols-2">
              <TaskClientJobFields
                clientId={clientId}
                jobId={jobId}
                clients={clients}
                jobs={jobs}
                disabled={busy || linksLoading}
                inlineLabels
                onClientChange={(value) => { setClientId(value); setJobId(null); }}
                onJobChange={setJobId}
              />
              <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                <label htmlFor="task-due-date" className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Due date</label>
                <Input id="task-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={busy} className="min-w-0" />
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

export default function TasksPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const { tasks, loading, error } = useFirestoreTasks();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus | "all">("all");
  const [assigneeId, setAssigneeId] = React.useState("all");
  const [jobId, setJobId] = React.useState("all");
  const [sort, setSort] = React.useState<"recent" | "due" | "title" | "updated">("recent");
  const [view, setView] = React.useState<ViewMode>("table");
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

  // Always let the signed-in person assign to themselves, even if their own
  // directory record has no uid stored yet.
  if (user?.uid && !assignees.some((a) => a.uid === user.uid)) {
    assignees.unshift({ uid: user.uid, name: `${user.name ?? user.email ?? "Me"} (you)`, slug: "", isCreator: false, hint: "" });
  }

  const jobOptions = React.useMemo(() => [
    { value: "all", label: "All jobs" },
    ...[...new Map(tasks.filter((task) => task.jobId && task.jobName).map((task) => [task.jobId!, task.jobName!] as const))]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label })),
  ], [tasks]);
  const visible = tasks.filter((task) => {
    if (status !== "all" && task.status !== status) return false;
    if (assigneeId !== "all" && !isTaskAssignee(task, assigneeId)) return false;
    if (jobId !== "all" && task.jobId !== jobId) return false;
    return [task.title, task.description, task.content, taskAssigneeNames(task), task.clientName, task.jobName].filter(Boolean).join(" ").toLowerCase().includes(search.trim().toLowerCase());
  }).sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "due") return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    if (sort === "updated") return (b.updatedAt ?? b.createdAt ?? "").localeCompare(a.updatedAt ?? a.createdAt ?? "");
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });

  const duplicate = async (task: Task) => {
    setBusyId(task.id);
    setActionError(null);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(firebaseDb, TASK_COLLECTION), {
        title: `${task.title} (Copy)`, description: task.description, content: task.content ?? "",
        clientId: task.clientId ?? null, clientName: task.clientName ?? null,
        jobId: task.jobId ?? null, jobName: task.jobName ?? null,
        ...taskAssigneeFields(taskAssignees(task)),
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
    if (!await confirmDialog(`Delete “${title}”? This can’t be undone.`)) return;
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
    toolbar={<FilterBar
      panelId="admin-tasks-filter"
      tabs={TASK_STATUS_TABS}
      activeTab={status}
      onTabChange={setStatus}
      tabsLabel="Status"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search tasks"
      filters={[
        { label: "Assignee", value: assigneeId, onChange: setAssigneeId, options: [{ value: "all", label: "All assignees" }, ...assignees.map((person) => ({ value: person.uid, label: person.name }))] },
        { label: "Job", value: jobId, onChange: setJobId, options: jobOptions },
      ]}
      sortOptions={TASK_SORTS}
      activeSort={sort}
      onSortChange={setSort}
      resultCount={plural(visible.length, "task")}
      view={view}
      onViewChange={setView}
      className="my-4"
    />}>
    {error || actionError ? <p className="mb-4 text-[13px] text-destructive">{error ?? actionError}</p> : null}
    <section className="mt-4 overflow-x-auto">
      {view === "cards" ? visible.length ? <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">{visible.map((task) => {
        const assignee = taskAssignees(task).length === 1 ? assignees.find((candidate) => candidate.uid === task.assignedTo) : undefined;
        const name = taskAssigneeNames(task) || assignee?.name || "—";
        return <li key={task.id}><DashboardCard className="h-full"><button type="button" onClick={() => router.push(`/dashboard/work/${encodeURIComponent(task.id)}`)} className="flex min-h-40 w-full flex-col p-4 pr-14 text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <span className="self-start"><TaskStatusBadge status={task.status} overdue={isOverdue(task)} /></span>
          <span className="mt-4 line-clamp-1 font-semibold leading-tight">{task.clientName || name}</span>
          <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.title}</span>
          <span className="mt-auto pt-4 text-xs text-muted-foreground">{task.createdAt ? `Created ${formatDate(task.createdAt)}` : ""}{task.dueDate ? `${task.createdAt ? " · " : ""}Due ${formatDate(task.dueDate)}` : ""}</span>
        </button><div className="absolute right-2 top-2"><DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`Actions for ${task.title}`} disabled={busyId === task.id} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-40"><DropdownMenuItem onSelect={() => void duplicate(task)}><Copy className="h-4 w-4" />Duplicate</DropdownMenuItem>{role === "admin" ? <DropdownMenuItem variant="destructive" onSelect={() => void remove(task.id, task.title)}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem> : null}</DropdownMenuContent></DropdownMenu></div></DashboardCard></li>;
      })}</ul> : <div className="px-5 py-12 text-center"><p className="m-0 text-[15px] font-semibold">{tasks.length ? "No tasks match" : "No tasks yet"}</p><p className="mb-0 mt-1 text-sm text-muted-foreground">{tasks.length ? "Try another search or filter." : "Create a task and assign it to a creator."}</p></div> :
      visible.length ? <Table className="w-full min-w-[680px] table-fixed border-collapse"><TableHeader><TableRow><TableHead className="px-4 py-3">Task</TableHead><TableHead className="w-28 px-4 py-3">Created</TableHead><TableHead className="w-28 px-4 py-3">Due</TableHead><TableHead className="w-20 px-4 py-3 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{visible.map((task) => {
        const assignee = taskAssignees(task).length === 1 ? assignees.find((candidate) => candidate.uid === task.assignedTo) : undefined;
        const name = taskAssigneeNames(task) || assignee?.name || "—";
        return <ClickableTableRow key={task.id} label={`Open task ${task.title}`} onActivate={() => router.push(`/dashboard/work/${encodeURIComponent(task.id)}`)} className="align-middle">
          <TableCell className="px-4 py-3">
            <Link href={`/dashboard/work/${encodeURIComponent(task.id)}`} className="m-0 block max-w-full truncate text-left font-semibold text-foreground hover:text-primary">{task.title}</Link>
            <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-[13px] text-muted-foreground">
              {assignee?.isCreator ? <Link href={`/dashboard/discover/${assignee.slug}`} className="max-w-[35%] shrink-0 truncate font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">{name}</Link> : <span className="max-w-[35%] shrink-0 truncate">{name}</span>}
              {task.clientName ? <span className="hidden truncate sm:inline">· {task.clientName}</span> : null}
              {task.jobName ? <span className="hidden truncate lg:inline">· {task.jobName}</span> : null}
              <span className="ml-auto shrink-0"><TaskStatusBadge status={task.status} overdue={isOverdue(task)} /></span>
            </div>
          </TableCell>
          <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{task.createdAt ? <time dateTime={task.createdAt}>{formatDate(task.createdAt)}</time> : "—"}</TableCell>
          <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{task.dueDate ? <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time> : "—"}</TableCell>
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
        </ClickableTableRow>;
      })}</TableBody></Table> : <div className="px-5 py-12 text-center"><p className="m-0 text-[15px] font-semibold">{tasks.length ? "No tasks match" : "No tasks yet"}</p><p className="mb-0 mt-1 text-sm text-muted-foreground">{tasks.length ? "Try another search or filter." : "Create a task and assign it to a creator."}</p></div>}
    </section>

  </DashboardListPage>;
}
