"use client";

import React from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import type { NjeriActionProposal } from "./types";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "record";
}

export async function availableSlug(collectionName: "users" | "clients", value: string): Promise<string> {
  const base = slugify(value);
  let slug = base;
  let suffix = 2;
  while ((await getDoc(doc(firebaseDb, collectionName, slug))).exists()) slug = `${base}-${suffix++}`;
  return slug;
}

export async function executeNjeriAction(
  action: NjeriActionProposal,
  user: { uid: string } | null | undefined,
): Promise<{ success: boolean; error?: string }> {
  if (!user) {
    return { success: false, error: "Please sign in before saving a record." };
  }

  try {
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
    } else {
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
  onConfirm: () => void;
}) {
  const isCreator = action.type === "create_creator";
  const title = isCreator ? "Creator draft" : "Client draft";
  const record = action.record;
  const status = action.status ?? "pending";

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

      <p className="mt-2 text-sm font-semibold text-foreground">{record.name}</p>
      <p className="mt-1 text-muted-foreground">
        {action.type === "create_creator"
          ? [action.record.category, action.record.location, action.record.title].filter(Boolean).join(" · ") ||
            "Research details included"
          : [action.record.industry, action.record.date].filter(Boolean).join(" · ") ||
            "Research details included"}
      </p>

      {action.sources.length ? (
        <p className="mt-2 truncate text-[11px] text-muted-foreground">
          Sources: {action.sources.join(", ")}
        </p>
      ) : null}

      {action.error ? (
        <div className="mt-2.5 flex items-start gap-1.5 text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{action.error}</span>
        </div>
      ) : null}

      {status === "pending" || status === "failed" ? (
        <button
          type="button"
          onClick={onConfirm}
          className="mt-3 inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-2 font-medium text-primary-foreground transition hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Confirm and add {isCreator ? "to creators" : "client"}
        </button>
      ) : null}
    </div>
  );
}
