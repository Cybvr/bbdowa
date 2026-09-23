"use client";

import React from "react";
import { collection, deleteDoc, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import type { NjeriActionProposal } from "./types";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "record";
}

export async function availableSlug(collectionName: "users" | "clients" | "campaigns", value: string): Promise<string> {
  const base = slugify(value);
  let slug = base;
  let suffix = 2;
  while ((await getDoc(doc(firebaseDb, collectionName, slug))).exists()) slug = `${base}-${suffix++}`;
  return slug;
}

export async function executeNjeriAction(
  action: NjeriActionProposal,
  user: { uid: string; canManage: boolean } | null | undefined,
): Promise<{ success: boolean; error?: string }> {
  if (!user) {
    return { success: false, error: "Please sign in before saving a record." };
  }
  if (!user.canManage) {
    return { success: false, error: "Only admins and managers can save workspace records." };
  }

  try {
    if (action.type === "update_record" || action.type === "delete_record") {
      const directRef = doc(firebaseDb, action.collection, action.recordId);
      const directSnapshot = await getDoc(directRef);
      const recordRef = directSnapshot.exists()
        ? directRef
        : (await getDocs(query(collection(firebaseDb, action.collection), where("slug", "==", action.recordId), limit(1)))).docs[0]?.ref;
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
      const slug = await availableSlug("campaigns", action.record.name);
      const campaignName = action.record.name.trim();
      const clientId = slugify(action.record.clientName);
      await setDoc(doc(firebaseDb, "campaigns", slug), {
        slug,
        name: campaignName,
        campaign: campaignName,
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
        imageAlt: `${campaignName} campaign placeholder`,
        media: [],
        summary: action.record.summary || "Campaign details will be added.",
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
      error: "I prepared the draft, but your account is not allowed to save this record. Please ask an admin or use the dashboard action.",
    };
  }
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
  const isCampaign = draft.type === "create_campaign";
  const isUpdate = draft.type === "update_record";
  const isDelete = draft.type === "delete_record";
  const title = isCreator ? "Creator draft" : isCampaign ? "Campaign draft" : isUpdate ? "Update draft" : isDelete ? "Delete draft" : "Client draft";
  const record = !isUpdate && !isDelete ? draft.record : null;
  const status = draft.status ?? "pending";
  const updateRecord = (field: string, value: string) => {
    setDraft((current) => ({
      ...current,
      record: { ...current.record, [field]: field === "platform" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value },
      status: "pending",
      error: undefined,
    } as NjeriActionProposal));
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

      {isDelete ? (
        <p className="mt-3 text-sm text-foreground">Delete <strong>{draft.label}</strong> from {draft.collection === "users" ? "creators" : draft.collection}?</p>
      ) : isUpdate ? (
        <div className="mt-3 grid gap-2">
          <p className="m-0 text-sm font-semibold text-foreground">{draft.label}</p>
          {Object.entries(draft.changes).map(([field, value]) => (
            <div key={field} className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-muted-foreground">{field}</span>
              <span className="text-right font-medium text-foreground">{Array.isArray(value) ? value.join(", ") : String(value ?? "—")}</span>
            </div>
          ))}
        </div>
      ) : (
      <div className="mt-3 grid gap-2">
        <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Name
          <input value={record!.name} onChange={(event) => updateRecord("name", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" />
        </label>
        {isCreator ? (
          <>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Category<input value={record!.category} onChange={(event) => updateRecord("category", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email<input type="email" value={record!.email ?? ""} onChange={(event) => updateRecord("email", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">About<textarea value={record!.craftNote} onChange={(event) => updateRecord("craftNote", event.target.value)} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
          </>
        ) : isCampaign ? (
          <>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Client<input value={record!.clientName} onChange={(event) => updateRecord("clientName", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">What we&apos;re trying to do<textarea value={record!.summary} onChange={(event) => updateRecord("summary", event.target.value)} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Strategy<textarea value={record!.strategy} onChange={(event) => updateRecord("strategy", event.target.value)} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Channels<input value={record!.platform.join(", ")} onChange={(event) => updateRecord("platform", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
          </>
        ) : (
          <>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Industry<input value={record!.industry} onChange={(event) => updateRecord("industry", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description<textarea value={record!.description ?? ""} onChange={(event) => updateRecord("description", event.target.value)} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary" /></label>
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
          {isDelete ? "Confirm delete" : isUpdate ? "Confirm update" : `Confirm and add ${isCreator ? "to creators" : isCampaign ? "campaign" : "client"}`}
        </button>
      ) : null}
    </div>
  );
}
