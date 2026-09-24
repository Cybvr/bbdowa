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
import type { Client } from "@/lib/clients";
import type { Campaign } from "@/lib/campaigns";
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

export function NewTaskSheet({ creatorUid, creatorName, createdBy, createdByName, clients = [], campaigns = [], onCreated }: {
  creatorUid: string;
  creatorName: string;
  createdBy: string;
  createdByName: string | null;
  clients?: Client[];
  campaigns?: Campaign[];
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [campaignId, setCampaignId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const clientCampaigns = campaigns.filter((campaign) => campaign.clientId === clientId);

  const reset = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setClientId("");
    setCampaignId("");
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
      const client = clients.find((candidate) => candidate.slug === clientId);
      const campaign = clientCampaigns.find((candidate) => candidate.slug === campaignId);
      await addDoc(collection(firebaseDb, TASK_COLLECTION), {
        title: title.trim(),
        description: description.trim(),
        assignedTo: creatorUid,
        assignedToName: creatorName,
        createdBy,
        createdByName,
        status: "todo",
        dueDate: dueDate || null,
        clientId: clientId || null,
        clientName: client?.name ?? null,
        campaignId: campaign ? campaignId : null,
        campaignName: campaign ? (campaign.campaign ?? campaign.name) : null,
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
              {clients.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Client</span>
                    <Select value={clientId || "none"} onValueChange={(value) => { setClientId(value === "none" ? "" : value); setCampaignId(""); }}>
                      <SelectTrigger disabled={busy} className="h-10"><SelectValue placeholder="No client" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No client</SelectItem>
                        {clients.map((client) => <SelectItem key={client.slug} value={client.slug}>{client.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Campaign</span>
                    <Select value={campaignId || "none"} onValueChange={(value) => setCampaignId(value === "none" ? "" : value)}>
                      <SelectTrigger disabled={busy || !clientId} className="h-10"><SelectValue placeholder={clientId ? "No campaign" : "Pick a client first"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No campaign</SelectItem>
                        {clientCampaigns.map((campaign) => <SelectItem key={campaign.slug} value={campaign.slug}>{campaign.campaign ?? campaign.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : null}
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

const FIELD_LABEL = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

/**
 * Right-side sheet for one task. `canManage` (staff) edits every field and
 * saves; `canEdit` (the assignee) may only change status; everyone else views
 * it read-only. Optionally attaches a client and one of its campaigns.
 */
export function TaskDetailSheet({ task, onOpenChange, canEdit, canManage = false, canDelete, clients = [], campaigns = [], onChanged }: {
  task: Task | null;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canManage?: boolean;
  canDelete: boolean;
  clients?: Client[];
  campaigns?: Campaign[];
  onChanged: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [status, setStatusValue] = React.useState<TaskStatus>("todo");
  const [clientId, setClientId] = React.useState("");
  const [campaignId, setCampaignId] = React.useState("");

  React.useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDueDate(task.dueDate ?? "");
    setStatusValue(task.status);
    setClientId(task.clientId ?? "");
    setCampaignId(task.campaignId ?? "");
    setError(null);
  }, [task]);

  const clientCampaigns = campaigns.filter((campaign) => campaign.clientId === clientId);

  const save = async () => {
    if (!task || !title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const client = clients.find((candidate) => candidate.slug === clientId);
      const campaign = clientCampaigns.find((candidate) => candidate.slug === campaignId);
      await updateDoc(doc(firebaseDb, TASK_COLLECTION, task.id), {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        status,
        clientId: clientId || null,
        clientName: client?.name ?? null,
        campaignId: campaign ? campaignId : null,
        campaignName: campaign ? (campaign.campaign ?? campaign.name) : null,
        updatedAt: new Date().toISOString(),
      });
      onChanged();
      onOpenChange(false);
    } catch (cause) {
      console.error("Unable to save task", cause);
      setError("Couldn’t save that task. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (next: TaskStatus) => {
    if (!task) return;
    setStatusValue(next);
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, TASK_COLLECTION, task.id), { status: next, updatedAt: new Date().toISOString() });
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
              <SheetTitle className="pr-8">{canManage ? "Edit task" : task.title}</SheetTitle>
              <SheetDescription>
                {task.assignedToName ? `For ${task.assignedToName}` : "Unassigned"}
                {task.createdByName ? ` · From ${task.createdByName}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
              {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}

              {canManage ? (
                <>
                  <div>
                    <span className={FIELD_LABEL}>Title</span>
                    <Input value={title} onChange={(event) => setTitle(event.target.value)} disabled={busy} placeholder="What needs doing" />
                  </div>
                  <div>
                    <span className={FIELD_LABEL}>Details</span>
                    <Textarea value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} placeholder="Brief, deliverables, links…" rows={5} />
                  </div>
                  <div>
                    <span className={FIELD_LABEL}>Due date</span>
                    <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={busy} className="h-10" />
                  </div>
                  {clients.length ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <span className={FIELD_LABEL}>Client</span>
                        <Select value={clientId || "none"} onValueChange={(value) => { setClientId(value === "none" ? "" : value); setCampaignId(""); }}>
                          <SelectTrigger disabled={busy} className="h-10"><SelectValue placeholder="No client" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No client</SelectItem>
                            {clients.map((client) => <SelectItem key={client.slug} value={client.slug}>{client.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <span className={FIELD_LABEL}>Campaign</span>
                        <Select value={campaignId || "none"} onValueChange={(value) => setCampaignId(value === "none" ? "" : value)}>
                          <SelectTrigger disabled={busy || !clientId} className="h-10"><SelectValue placeholder={clientId ? "No campaign" : "Pick a client first"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No campaign</SelectItem>
                            {clientCampaigns.map((campaign) => <SelectItem key={campaign.slug} value={campaign.slug}>{campaign.campaign ?? campaign.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <span className={FIELD_LABEL}>Status</span>
                    <Select value={status} onValueChange={(value) => setStatusValue(value as TaskStatus)}>
                      <SelectTrigger disabled={busy} className="h-10 w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((value) => <SelectItem key={value} value={value}>{TASK_STATUS_LABELS[value]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className={FIELD_LABEL}>Status</span>
                    <div className="flex items-center gap-3">
                      <TaskStatusBadge status={task.status} overdue={isOverdue(task)} />
                      {canEdit ? (
                        <Select value={status} onValueChange={(value) => void changeStatus(value as TaskStatus)}>
                          <SelectTrigger disabled={busy} className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TASK_STATUSES.map((value) => <SelectItem key={value} value={value}>{TASK_STATUS_LABELS[value]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <span className={FIELD_LABEL}>Due date</span>
                    <p className="m-0 text-[14px] text-foreground">{task.dueDate ? formatDate(task.dueDate) : "No due date"}</p>
                  </div>
                  {task.clientName || task.campaignName ? (
                    <div>
                      <span className={FIELD_LABEL}>Client · Campaign</span>
                      <p className="m-0 text-[14px] text-foreground">{[task.clientName, task.campaignName].filter(Boolean).join(" · ")}</p>
                    </div>
                  ) : null}
                  <div>
                    <span className={FIELD_LABEL}>Details</span>
                    <p className="m-0 whitespace-pre-wrap text-[14px] leading-[1.55] text-foreground">{task.description || "No details added."}</p>
                  </div>
                </>
              )}
            </div>

            {(canManage || canDelete) ? (
              <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
                {canDelete ? (
                  <button type="button" onClick={() => void removeTask()} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-semibold text-destructive transition hover:border-destructive disabled:opacity-50">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />Delete
                  </button>
                ) : <span />}
                {canManage ? (
                  <button type="button" onClick={() => void save()} disabled={busy || !title.trim()} className="h-9 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/** Tasks for one creator, shown on their profile page. Staff assign and manage them; the creator only moves them through status. */
export function CreatorTasksPanel({ creatorUid, creatorName, viewer, refreshSignal = 0, clients = [], campaigns = [] }: { creatorUid: string | null | undefined; creatorName: string; viewer: TaskViewer; refreshSignal?: number; clients?: Client[]; campaigns?: Campaign[] }) {
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
        canManage={viewer.isStaff}
        canDelete={viewer.isStaff}
        clients={clients}
        campaigns={campaigns}
        onChanged={reload}
      />
    </div>
  );
}
