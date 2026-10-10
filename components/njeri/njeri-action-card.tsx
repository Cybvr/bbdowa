"use client";

import React from "react";
import { collection, deleteDoc, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { sendAppEmail } from "@/lib/app-email";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { TASK_COLLECTION } from "@/lib/creator-tasks";
import { readUsersFromFirestore } from "@/lib/firebase/client-content";
import type { NjeriActionProposal } from "./types";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "record";
}

/** Jobs live in `campaigns` until the migration runs. */
async function collectionPath(collectionName: "users" | "clients" | "jobs"): Promise<string> {
  return collectionName === "jobs" ? jobsCollection() : collectionName;
}

export async function availableSlug(collectionName: "users" | "clients" | "jobs", value: string): Promise<string> {
  const path = await collectionPath(collectionName);
  const base = slugify(value);
  let slug = base;
  let suffix = 2;
  while ((await getDoc(doc(firebaseDb, path, slug))).exists()) slug = `${base}-${suffix++}`;
  return slug;
}

async function userProfileForUid(uid: string) {
  const direct = await getDoc(doc(firebaseDb, "users", uid));
  if (direct.exists()) return direct;
  return (await getDocs(query(collection(firebaseDb, "users"), where("uid", "==", uid), limit(1)))).docs[0] ?? null;
}

export async function executeNjeriAction(
  action: NjeriActionProposal,
  user: { uid: string; name?: string | null; canManage: boolean } | null | undefined,
): Promise<{ success: boolean; error?: string }> {
  if (!user) {
    return { success: false, error: "Please sign in before saving a record." };
  }
  if (!user.canManage && !(action.type === "update_task" || action.type === "delete_task")) {
    return { success: false, error: "Only admins and managers can save workspace records." };
  }

  try {
    if (action.type === "create_task") {
      const assignee = await userProfileForUid(action.record.assignedTo);
      const job = action.record.jobId ? await getDoc(doc(firebaseDb, await jobsCollection(), action.record.jobId)) : null;
      const client = action.record.clientId ? await getDoc(doc(firebaseDb, "clients", action.record.clientId)) : null;
      if (!assignee?.exists() || !action.record.assignedTo) throw new Error("I couldn't match that assignee to an account. Choose someone who has signed in.");
      if (job && !job.exists()) throw new Error("That job is no longer in the workspace. Refresh and try again.");
      if (client && !client.exists()) throw new Error("That client is no longer in the workspace. Refresh and try again.");
      const now = new Date().toISOString();
      const taskRef = doc(collection(firebaseDb, TASK_COLLECTION));
      await setDoc(taskRef, {
        ...action.record,
        createdBy: user.uid,
        createdByName: user.name ?? null,
        createdAt: now,
        updatedAt: now,
      });
      void sendAppEmail({ type: "task", taskId: taskRef.id });
      return { success: true };
    }

    if (action.type === "update_task" || action.type === "delete_task") {
      const taskRef = doc(firebaseDb, TASK_COLLECTION, action.taskId);
      const taskSnapshot = await getDoc(taskRef);
      if (!taskSnapshot.exists()) throw new Error("That task no longer exists. Refresh and try again.");
      const task = taskSnapshot.data();
      if (!user.canManage && task.assignedTo !== user.uid) {
        throw new Error("You can only change or remove tasks assigned to you.");
      }
      if (action.type === "delete_task") {
        await deleteDoc(taskRef);
        return { success: true };
      }

      const allowedFields = user.canManage
        ? ["title", "description", "assignedTo", "assignedToName", "clientId", "clientName", "jobId", "jobName", "dueDate", "status"]
        : ["title", "description", "clientId", "clientName", "jobId", "jobName", "dueDate", "status"];
      const changes = Object.fromEntries(Object.entries(action.changes).filter(([field]) => allowedFields.includes(field)));
      if (typeof changes.assignedTo === "string") {
        const assignee = await userProfileForUid(changes.assignedTo);
        if (!assignee?.exists()) throw new Error("I couldn't match that assignee to an account. Refresh and try again.");
        const data = assignee.data();
        changes.assignedToName = typeof data.name === "string" ? data.name : changes.assignedToName;
      }
      if (typeof changes.clientId === "string" && !(await getDoc(doc(firebaseDb, "clients", changes.clientId))).exists()) {
        throw new Error("That client is no longer in the workspace. Refresh and try again.");
      }
      if (typeof changes.jobId === "string" && !(await getDoc(doc(firebaseDb, await jobsCollection(), changes.jobId))).exists()) {
        throw new Error("That job is no longer in the workspace. Refresh and try again.");
      }
      await updateDoc(taskRef, { ...changes, updatedAt: new Date().toISOString() });
      return { success: true };
    }

    if (!user.canManage) return { success: false, error: "Only admins and managers can save workspace records." };

    if (action.type === "update_record" || action.type === "delete_record") {
      const recordPath = await collectionPath(action.collection);
      const directRef = doc(firebaseDb, recordPath, action.recordId);
      const directSnapshot = await getDoc(directRef);
      const recordRef = directSnapshot.exists()
        ? directRef
        : (await getDocs(query(collection(firebaseDb, recordPath), where("slug", "==", action.recordId), limit(1)))).docs[0]?.ref;
      if (!recordRef) throw new Error("Record not found");
      if (action.type === "update_record") {
        await updateDoc(recordRef, { ...action.changes, updatedAt: serverTimestamp() });
      } else {
        await deleteDoc(recordRef);
      }
      return { success: true };
    }

    if (action.type === "create_creator") {
      const slug = await availableSlug("users", action.record.name);
      await setDoc(doc(firebaseDb, "users", slug), {
        slug,
        name: action.record.name.trim(),
        role: "creator",
        roles: ["creator"],
        title: action.record.title || "",
        department: action.record.department || "",
        category: action.record.category || "Content",
        tags: [],
        location: action.record.location || "",
        entity: "Freelancer",
        dayRate: "",
        rateMin: null,
        rateCurrency: "NGN",
        hideRate: true,
        terms: "",
        availability: "unconfirmed",
        clearance: "pending",
        vetted: false,
        vouchedBy: "Njeri research draft",
        workedOn: [],
        yearsActive: action.record.yearsActive,
        portfolio: action.record.portfolio,
        behance: null,
        email: action.record.email,
        phone: action.record.phone,
        profileImage: action.record.profileImage,
        addedAt: new Date().toISOString(),
        featuredImage: null,
        workHistory: action.record.workHistory ?? [],
        linkedin: action.record.linkedin,
        instagram: action.record.instagram,
        referralSource: action.record.referralSource,
        contactNote: null,
        followerCount: action.record.followerCount,
        followerPlatform: action.record.followerPlatform,
        gender: null,
        age: null,
        niche: action.record.niche,
        lastEngaged: null,
        craftNote: action.record.craftNote || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (action.type === "create_client") {
      const slug = await availableSlug("clients", action.record.name);
      await setDoc(doc(firebaseDb, "clients", slug), {
        type: "client",
        slug,
        name: action.record.name.trim(),
        date: action.record.date || null,
        industry: action.record.industry || "Other",
        profileImage: action.record.profileImage,
        description: action.record.description,
        targetAudience: action.record.targetAudience,
        creatorSlugs: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const slug = await availableSlug("jobs", action.record.name);
      const jobName = action.record.name.trim();
      const clientId = slugify(action.record.clientName);
      await setDoc(doc(firebaseDb, await jobsCollection(), slug), {
        slug,
        name: jobName,
        title: jobName,
        clientId,
        clientName: action.record.clientName.trim(),
        category: action.record.category || "General",
        year: action.record.year ?? new Date().getFullYear(),
        liveAt: action.record.liveAt ? { date: action.record.liveAt } : null,
        status: action.record.status,
        leadUserId: null,
        publishedBy: user.uid,
        fee: "To be confirmed",
        target: action.record.target || "To be confirmed",
        result: action.record.outcome || "To be confirmed",
        image: "/images/projects/project-placeholder.svg",
        imageAlt: `${jobName} job placeholder`,
        media: [],
        summary: action.record.summary || "Job details will be added.",
        challenge: action.record.challenge || "Challenge details coming soon.",
        insight: action.record.insight || "Insight details coming soon.",
        strategy: action.record.strategy || "Strategy details coming soon.",
        platform: action.record.platform.length ? action.record.platform : ["Channels to be confirmed"],
        execution: action.record.execution || "Execution details coming soon.",
        outcome: action.record.outcome || "Outcome details coming soon.",
        placeholder: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return { success: true };
  } catch (cause) {
    console.error("Unable to save Njeri draft", cause);
    return {
      success: false,
      error: cause instanceof Error ? cause.message : "Couldn't save that change. Please try again.",
    };
  }
}

function actionSummary(action: NjeriActionProposal): string {
  switch (action.type) {
    case "create_task":
      return [action.record.title, action.record.assignedToName, action.record.dueDate].filter(Boolean).join(" · ");
    case "create_creator":
    case "create_client":
    case "create_job":
      return action.record.name;
    default:
      return action.label;
  }
}

function batchVerb(actions: NjeriActionProposal[]): string {
  const types = new Set(actions.map((action) => action.type));
  if (types.size === 1) {
    const [type] = [...types];
    if (type === "create_task") return `Create ${actions.length} tasks`;
    if (type === "create_creator") return `Add ${actions.length} creators`;
    if (type === "create_client") return `Add ${actions.length} clients`;
    if (type === "create_job") return `Add ${actions.length} jobs`;
    if (type === "delete_task" || type === "delete_record") return `Delete ${actions.length} records`;
  }
  return `Confirm ${actions.length} changes`;
}

/** One summary and one button for a batch, instead of a form per record. */
export function BatchActionCard({ actions, onConfirmAll }: { actions: NjeriActionProposal[]; onConfirmAll: () => void }) {
  const saved = actions.filter((action) => action.status === "saved").length;
  const failed = actions.filter((action) => action.status === "failed").length;
  const running = actions.some((action) => action.status === "saving");
  const remaining = actions.length - saved;
  return (
    <div className="mt-3 rounded-xl border border-primary/25 bg-background/95 p-3.5 text-xs shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm font-semibold text-foreground">{actions.length} items</strong>
        {running ? (
          <span className="inline-flex items-center gap-1 font-medium text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving {saved + 1} of {actions.length}...</span>
        ) : saved === actions.length ? (
          <span className="inline-flex items-center gap-1 font-semibold text-green-600 dark:text-green-400"><CheckCircle2 className="h-3.5 w-3.5" />All saved</span>
        ) : saved ? (
          <span className="font-medium text-muted-foreground">{saved} saved</span>
        ) : null}
      </div>
      <ul className="m-0 mt-2 max-h-60 list-none space-y-1 overflow-y-auto p-0">
        {actions.map((action, index) => (
          <li key={index} className="flex items-start gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5">
            <span className="mt-0.5 shrink-0">
              {action.status === "saved" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                : action.status === "failed" ? <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                : action.status === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                : <span className="block h-3.5 w-3.5 rounded-full border border-border" />}
            </span>
            <span className="min-w-0 text-foreground">
              {actionSummary(action)}
              {action.status === "failed" && action.error ? <span className="block text-destructive">{action.error}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      {!running && remaining > 0 ? (
        <button
          type="button"
          onClick={onConfirmAll}
          className="mt-3 inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-2 font-medium text-primary-foreground transition hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {failed ? `Retry ${failed} failed` : saved ? `Save remaining ${remaining}` : batchVerb(actions)}
        </button>
      ) : null}
    </div>
  );
}

export function ActionCard({
  action,
  onConfirm,
}: {
  action: NjeriActionProposal;
  onConfirm: (action: NjeriActionProposal) => void;
}) {
  const [draft, setDraft] = React.useState(action);
  React.useEffect(() => {
    setDraft(action);
  }, [action.status, action.error]);
  const isCreator = draft.type === "create_creator";
  const isJob = draft.type === "create_job";
  const isTaskCreate = draft.type === "create_task";
  const isTaskUpdate = draft.type === "update_task";
  const isTaskDelete = draft.type === "delete_task";
  const isUpdate = draft.type === "update_record" || isTaskUpdate;
  const isDelete = draft.type === "delete_record" || isTaskDelete;
  const isTaskAction = isTaskCreate || isTaskUpdate || isTaskDelete;
  const title = isTaskAction ? "Task" : isCreator ? "Creator" : isJob ? "Job" : isUpdate ? "Update" : isDelete ? "Delete" : "Client";
  const record = "record" in draft ? draft.record : null;
  const creatorRecord = draft.type === "create_creator" ? draft.record : null;
  const jobRecord = draft.type === "create_job" ? draft.record : null;
  const clientRecord = draft.type === "create_client" ? draft.record : null;
  const status = draft.status ?? "pending";
  const [creators, setCreators] = React.useState<{ uid: string; name: string }[]>([]);
  React.useEffect(() => {
    if (!isTaskCreate) return;
    let cancelled = false;
    readUsersFromFirestore()
      .then((users) => {
        if (cancelled) return;
        setCreators(users.flatMap((user) => user.uid ? [{ uid: user.uid, name: user.name }] : []).sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((cause) => console.warn("Unable to load creators for task assignment", cause));
    return () => { cancelled = true; };
  }, [isTaskCreate]);
  const updateTask = (field: string, value: string) => {
    setDraft((current) => {
      if (current.type === "create_task") {
        return { ...current, record: { ...current.record, [field]: field === "dueDate" ? value || null : value } } as NjeriActionProposal;
      }
      if (current.type === "update_task") {
        return { ...current, changes: { ...current.changes, [field]: field === "dueDate" ? value || null : value }, status: "pending", error: undefined } as NjeriActionProposal;
      }
      return current;
    });
  };
  const updateRecord = (field: string, value: string) => {
    setDraft((current) => {
      if (!("record" in current)) return current;
      return {
        ...current,
        record: {
          ...current.record,
          [field]: field === "platform" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value,
        },
        status: "pending",
        error: undefined,
      } as NjeriActionProposal;
    });
  };

  return (
    <div className="mt-3 rounded-xl border border-primary/25 bg-background/95 p-3.5 text-xs shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm font-semibold text-foreground">{title}</strong>
        {status === "saved" ? (
          <span className="inline-flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved
          </span>
        ) : status === "saving" ? (
          <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving...
          </span>
        ) : null}
      </div>

      {isTaskDelete ? (
        <p className="mt-2 text-sm text-foreground">Delete <strong>{draft.label}</strong>?</p>
      ) : draft.type === "delete_record" ? (
        <p className="mt-2 text-sm text-foreground">Delete <strong>{draft.label}</strong> from {draft.collection === "users" ? "creators" : draft.collection}?</p>
      ) : isTaskUpdate ? (
        <div className="mt-2 grid gap-2">
          <p className="m-0 text-sm font-medium text-foreground">{draft.label}</p>
          {"title" in draft.changes ? <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Title<input value={draft.changes.title ?? ""} onChange={(event) => updateTask("title", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label> : null}
          {"description" in draft.changes ? <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description<textarea value={draft.changes.description ?? ""} onChange={(event) => updateTask("description", event.target.value)} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label> : null}
          {"dueDate" in draft.changes ? <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Due date<input type="date" value={draft.changes.dueDate ?? ""} onChange={(event) => updateTask("dueDate", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label> : null}
          {"status" in draft.changes ? <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status<select value={draft.changes.status ?? "todo"} onChange={(event) => updateTask("status", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary"><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select></label> : null}
          {draft.changes.assignedToName ? <p className="m-0 text-xs text-muted-foreground">Assigned to {draft.changes.assignedToName}</p> : null}
          {[draft.changes.clientName, draft.changes.jobName].filter(Boolean).length ? <p className="m-0 text-xs text-muted-foreground">{[draft.changes.clientName, draft.changes.jobName].filter(Boolean).join(" · ")}</p> : null}
        </div>
      ) : draft.type === "update_record" ? (
        <div className="mt-3 grid gap-2">
          <p className="m-0 text-sm font-semibold text-foreground">{draft.label}</p>
          {Object.entries(draft.changes).map(([field, value]) => (
            <div key={field} className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-muted-foreground">{field}</span>
              <span className="text-right font-medium text-foreground">{Array.isArray(value) ? value.join(", ") : String(value ?? "—")}</span>
            </div>
          ))}
        </div>
      ) : isTaskCreate && draft.type === "create_task" ? (
        <div className="mt-2 grid gap-2">
          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Title<input value={draft.record.title} onChange={(event) => updateTask("title", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description<textarea value={draft.record.description} onChange={(event) => updateTask("description", event.target.value)} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Assign to
            <select
              value={draft.record.assignedTo}
              onChange={(event) => {
                const creator = creators.find((item) => item.uid === event.target.value);
                setDraft((current) => current.type === "create_task"
                  ? { ...current, record: { ...current.record, assignedTo: creator?.uid ?? "", assignedToName: creator?.name ?? "" }, status: "pending", error: undefined }
                  : current);
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary"
            >
              {creators.some((item) => item.uid === draft.record.assignedTo) ? null : <option value={draft.record.assignedTo}>Choose a person</option>}
              {creators.map((item) => <option key={item.uid} value={item.uid}>{item.name}</option>)}
            </select>
          </label>
          {draft.record.clientName || draft.record.jobName ? <p className="m-0 text-xs text-muted-foreground">{[draft.record.clientName, draft.record.jobName].filter(Boolean).join(" · ")}</p> : null}
          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Due date<input type="date" value={draft.record.dueDate ?? ""} onChange={(event) => updateTask("dueDate", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
        </div>
      ) : (
      <div className="mt-3 grid gap-2">
        {record && "name" in record ? <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Name<input value={record.name} onChange={(event) => updateRecord("name", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label> : null}
        {isCreator ? (
          <>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Category<input value={creatorRecord?.category ?? ""} onChange={(event) => updateRecord("category", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email<input type="email" value={creatorRecord?.email ?? ""} onChange={(event) => updateRecord("email", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Referral source<input value={creatorRecord?.referralSource ?? ""} onChange={(event) => updateRecord("referralSource", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">About<textarea value={creatorRecord?.craftNote ?? ""} onChange={(event) => updateRecord("craftNote", event.target.value)} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
          </>
        ) : isJob ? (
          <>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Client<input value={jobRecord?.clientName ?? ""} onChange={(event) => updateRecord("clientName", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">What we&apos;re trying to do<textarea value={jobRecord?.summary ?? ""} onChange={(event) => updateRecord("summary", event.target.value)} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Strategy<textarea value={jobRecord?.strategy ?? ""} onChange={(event) => updateRecord("strategy", event.target.value)} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Channels<input value={jobRecord?.platform.join(", ") ?? ""} onChange={(event) => updateRecord("platform", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
          </>
        ) : (
          <>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Industry<input value={clientRecord?.industry ?? ""} onChange={(event) => updateRecord("industry", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description<textarea value={clientRecord?.description ?? ""} onChange={(event) => updateRecord("description", event.target.value)} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
          </>
        )}
      </div>
      )}

      {action.sources.length ? (
        <p className="mt-2 truncate text-[11px] text-muted-foreground">
          Sources: {draft.sources.join(", ")}
        </p>
      ) : null}

      {draft.error ? (
        <div className="mt-2.5 flex items-start gap-1.5 text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{draft.error}</span>
        </div>
      ) : null}

      {status === "pending" || status === "failed" ? (
        <button
          type="button"
          onClick={() => onConfirm(draft)}
          className="mt-3 inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-2 font-medium text-primary-foreground transition hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {isTaskDelete ? "Delete task" : isDelete ? "Confirm delete" : isTaskUpdate ? "Save task" : isUpdate ? "Confirm update" : isTaskCreate ? "Create task" : `Add ${isCreator ? "creator" : isJob ? "job" : "client"}`}
        </button>
      ) : null}
    </div>
  );
}
