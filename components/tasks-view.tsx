"use client";

import * as React from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { Check, CheckSquare, Copy, Expand, Minimize2, Plus, Share2, Trash2 } from "lucide-react";
import { firebaseDb } from "@/lib/firebase/client";
import { EmptyState } from "@/components/dashboard/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { RichTextContent, RichTextEditor } from "@/components/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ItemCard, ItemCardList } from "@/components/dashboard/item-card";
import { TaskClientCampaignFields, useTaskLinkOptions } from "@/components/task-link-fields";
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

/** Who's looking at this creator's tasks. Staff and the assigned creator can edit task details. */
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

function taskEditorText(task: Task) {
  if (typeof task.content === "string") return { description: task.description ?? "", content: task.content };
  const description = task.description ?? "";
  if (description.length <= 160 && !description.includes("\n")) return { description, content: "" };
  return {
    description: (description.split(/\r?\n/).find((line) => line.trim()) ?? description).trim().slice(0, 160),
    content: description,
  };
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
  const [content, setContent] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [clientId, setClientId] = React.useState<string | null>(null);
  const [campaignId, setCampaignId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { clients, campaigns, loading: linksLoading } = useTaskLinkOptions();

  const reset = () => {
    setTitle("");
    setDescription("");
    setContent("");
    setDueDate("");
    setClientId(null);
    setCampaignId(null);
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
        content,
        clientId,
        clientName: clients.find((client) => client.slug === clientId)?.name ?? null,
        campaignId,
        campaignName: campaigns.find((campaign) => campaign.slug === campaignId)?.name ?? null,
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
        <SheetContent side="right" aria-describedby={undefined} className="w-[min(520px,calc(100vw-1.5rem))] max-w-none gap-0 [&>button]:bg-muted [&>button]:text-foreground [&>button]:opacity-100">
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
                <label htmlFor="task-description" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Description</label>
                <Input id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} placeholder="Short task summary" />
              </div>
              <RichTextEditor label="Content" value={content} onChange={setContent} placeholder="Add detailed instructions and copy…" compact />
              <div className="grid gap-3 sm:grid-cols-2">
                <TaskClientCampaignFields
                  clientId={clientId}
                  campaignId={campaignId}
                  clients={clients}
                  campaigns={campaigns}
                  disabled={busy || linksLoading}
                  inlineLabels
                  onClientChange={(value) => { setClientId(value); setCampaignId(null); }}
                  onCampaignChange={setCampaignId}
                />
                <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                  <label htmlFor="new-task-due-date" className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Due date</label>
                  <Input id="new-task-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={busy} className="min-w-0" />
                </div>
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

/** Editable task record. The assignee can edit its work details; staff may also reassign it and delete it. */
export function TaskDetailSheet({ task, onOpenChange, canEdit, canDelete, assignees, onChanged }: {
  task: Task | null;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
  assignees?: { uid: string; name: string }[];
  onChanged: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [content, setContent] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = React.useState("");
  const [clientId, setClientId] = React.useState<string | null>(null);
  const [campaignId, setCampaignId] = React.useState<string | null>(null);
  const [assignedTo, setAssignedTo] = React.useState("");
  const [expanded, setExpanded] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState("");
  const [shareMessage, setShareMessage] = React.useState<string | null>(null);
  const { clients, campaigns, loading: linksLoading } = useTaskLinkOptions();
  const assigneeOptions = assignees
    ? [...(task && !assignees.some((item) => item.uid === task.assignedTo) ? [{ uid: task.assignedTo, name: task.assignedToName ?? "Current assignee" }] : []), ...assignees]
    : [];

  React.useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    const text = taskEditorText(task);
    setDescription(text.description);
    setContent(text.content);
    setStatus(task.status);
    setDueDate(task.dueDate ?? "");
    setClientId(task.clientId ?? null);
    setCampaignId(task.campaignId ?? null);
    setAssignedTo(task.assignedTo);
    setError(null);
    setShareOpen(false);
    setShareUrl("");
    setShareMessage(null);
  }, [task]);

  const shareTask = () => {
    if (!task) return;
    const url = new URL("/dashboard/tasks", window.location.origin);
    url.searchParams.set("task", task.id);
    setShareUrl(url.toString());
    setShareMessage(null);
    setShareOpen(true);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("Task link copied");
      window.setTimeout(() => setShareMessage(null), 2500);
    } catch {
      setShareMessage("Couldn’t copy the link. Select it to copy manually.");
    }
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!task || !title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const client = clients.find((item) => item.slug === clientId);
      const campaign = campaigns.find((item) => item.slug === campaignId && item.clientId === clientId);
      const assignee = assignees?.find((item) => item.uid === assignedTo);
      await updateDoc(doc(firebaseDb, TASK_COLLECTION, task.id), {
        title: title.trim(),
        description: description.trim(),
        content,
        status,
        dueDate: dueDate || null,
        clientId: client?.slug ?? null,
        clientName: client?.name ?? null,
        campaignId: campaign?.slug ?? null,
        campaignName: campaign?.name ?? null,
        ...(assignees ? { assignedTo: assignee?.uid ?? task.assignedTo, assignedToName: assignee?.name ?? task.assignedToName } : {}),
        updatedAt: new Date().toISOString(),
      });
      onOpenChange(false);
      onChanged();
    } catch (cause) {
      console.error("Unable to update task", cause);
      setError("Couldn’t save task changes. Try again.");
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
    <>
    <Sheet open={Boolean(task)} onOpenChange={(open) => { if (!open) setExpanded(false); onOpenChange(open); }}>
      <SheetContent side={expanded ? "center" : "right"} aria-describedby={undefined} className={expanded ? "gap-0 [&>button]:bg-muted [&>button]:text-foreground [&>button]:opacity-100" : "w-[min(520px,calc(100vw-1.5rem))] max-w-none gap-0 [&>button]:bg-muted [&>button]:text-foreground [&>button]:opacity-100"}>
        {task ? (
          <>
            <SheetHeader className="relative border-b border-border pr-36">
              <SheetTitle>{canEdit ? "Edit task" : task.title}</SheetTitle>
              <button type="button" onClick={shareTask} aria-label="Share task" title="Share task" className="absolute right-[5.5rem] top-2.5 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Return to side panel" : "Expand task to modal"} title={expanded ? "Return to side panel" : "Expand to modal"} className="absolute right-12 top-2.5 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {expanded ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Expand className="h-4 w-4" aria-hidden="true" />}
              </button>
              <span role="status" className="sr-only">{shareMessage}</span>
            </SheetHeader>
            {canEdit ? (
              <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
                  {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-task-title" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Title</label>
                    <Input id="edit-task-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={busy} required />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-task-description" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Description</label>
                    <Input id="edit-task-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} placeholder="Short task summary" />
                  </div>
                  <div className="grid items-center gap-x-4 gap-y-3 grid-cols-1 sm:grid-cols-2">
                    {assignees ? (
                      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                        <label htmlFor="edit-task-assignee" className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Assigned to</label>
                        <Select value={assignedTo} onValueChange={setAssignedTo} disabled={busy}>
                          <SelectTrigger id="edit-task-assignee" className="min-w-0 rounded-md border border-input bg-background"><SelectValue /></SelectTrigger>
                          <SelectContent>{assigneeOptions.map((assignee) => <SelectItem key={assignee.uid} value={assignee.uid}>{assignee.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ) : null}
                    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                      <label htmlFor="edit-task-status" className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</label>
                      <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)} disabled={busy}>
                        <SelectTrigger id="edit-task-status" className="min-w-0 rounded-md border border-input bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>{TASK_STATUSES.map((value) => <SelectItem key={value} value={value}>{TASK_STATUS_LABELS[value]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <TaskClientCampaignFields
                      clientId={clientId}
                      campaignId={campaignId}
                      clients={clients}
                      campaigns={campaigns}
                      disabled={busy || linksLoading}
                      inlineLabels
                      onClientChange={(value) => { setClientId(value); setCampaignId(null); }}
                      onCampaignChange={setCampaignId}
                    />
                    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                      <label htmlFor="edit-task-due-date" className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Due date</label>
                      <Input id="edit-task-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={busy} className="min-w-0" />
                    </div>
                  </div>
                  <RichTextEditor label="Content" value={content} onChange={setContent} placeholder="Add detailed instructions and copy…" compact />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                  {canDelete ? <button type="button" onClick={() => void removeTask()} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-semibold text-destructive transition hover:border-destructive disabled:opacity-50"><Trash2 className="h-4 w-4" aria-hidden="true" />Delete</button> : <span />}
                  <button type="submit" disabled={busy || !title.trim()} className="h-9 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Saving…" : "Save changes"}</button>
                </div>
              </form>
            ) : (
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
                <TaskStatusBadge status={task.status} overdue={isOverdue(task)} />
                <div><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Description</span><p className="m-0 whitespace-pre-wrap text-[14px] leading-[1.55] text-foreground">{task.description || "No description added."}</p></div>
                {task.content ? <div><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Content</span><RichTextContent value={task.content} className="text-[14px] leading-[1.55]" /></div> : null}
                {task.clientName ? <p className="m-0 text-[13px] text-muted-foreground">Client: {task.clientName}</p> : null}
                {task.campaignName ? <p className="m-0 text-[13px] text-muted-foreground">Campaign: {task.campaignName}</p> : null}
              </div>
            )}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
      <Dialog open={shareOpen && Boolean(task)} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share task</DialogTitle>
            <DialogDescription>Copy this link to share “{task?.title}”.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input aria-label="Task share link" readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} />
            {shareMessage ? <p role="status" className="m-0 text-[13px] text-muted-foreground">{shareMessage}</p> : null}
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setShareOpen(false)} className="h-9 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground">Close</button>
            <button type="button" onClick={() => void copyShareLink()} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90">
              {shareMessage === "Task link copied" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {shareMessage === "Task link copied" ? "Copied" : "Copy link"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Tasks for one creator, shown on their profile page. The assignee and staff can edit task details. */
export function CreatorTasksPanel({ creatorUid, creatorName, viewer, refreshSignal = 0, assignees }: { creatorUid: string | null | undefined; creatorName: string; viewer: TaskViewer; refreshSignal?: number; assignees?: { uid: string; name: string }[] }) {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = tasks.find((task) => task.id === selectedId) ?? null;
  // Only staff or the assigned creator can change a task; unrelated viewers can only read it.
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
              subtitle={task.dueDate ? `Due ${formatDate(task.dueDate)}` : undefined}
              trailing={<TaskStatusBadge status={task.status} overdue={isOverdue(task)} />}
            />
          ))}
        </ItemCardList>
      )}

      <TaskDetailSheet
        task={selected}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        canEdit={canEdit}
        canDelete={canEdit}
        assignees={viewer.isStaff ? assignees : undefined}
        onChanged={reload}
      />
    </div>
  );
}
