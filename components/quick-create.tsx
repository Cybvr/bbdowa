"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";

type CreateType = "update" | "resource";

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "item"}-${Date.now().toString(36)}`;
}

const UPDATE_CATEGORIES = ["News", "People", "Work", "Industry"] as const;

const LABEL =
  "block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const TEXTAREA =
  "flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function QuickCreate() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<CreateType>("update");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Update fields
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<(typeof UPDATE_CATEGORIES)[number]>("News");
  const [excerpt, setExcerpt] = React.useState("");
  const [sourceName, setSourceName] = React.useState("BBDO West Africa");

  // Resource fields
  const [label, setLabel] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [meta, setMeta] = React.useState("");
  const [href, setHref] = React.useState("");

  if (!isAdmin) return null;

  const reset = () => {
    setType("update");
    setTitle("");
    setCategory("News");
    setExcerpt("");
    setSourceName("BBDO West Africa");
    setLabel("");
    setGroup("");
    setMeta("");
    setHref("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const canSave = type === "update" ? title.trim().length > 0 : label.trim().length > 0;

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (type === "update") {
        const slug = slugify(title);
        await setDoc(doc(firebaseDb, "blogs", slug), {
          slug,
          title: title.trim(),
          excerpt: excerpt.trim(),
          category,
          publishedAt: new Date().toISOString().slice(0, 10),
          sourceName: sourceName.trim() || "BBDO West Africa",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setOpen(false);
        reset();
        router.push(`/dashboard/blog/${slug}`);
      } else {
        const slug = slugify(label);
        await setDoc(doc(firebaseDb, "resources", slug), {
          type: "resource",
          slug,
          label: label.trim(),
          group: group.trim() || "Internal",
          meta: meta.trim(),
          image: null,
          ...(href.trim() ? { href: href.trim() } : {}),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setOpen(false);
        reset();
        router.push("/dashboard/resources");
      }
      router.refresh();
    } catch (cause) {
      console.error("Unable to create record", cause);
      setError("Couldn’t save. Try again.");
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="New"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-[13px] font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-4"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">New</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New</DialogTitle>
            <DialogDescription>Add a few details. Saving opens the new item.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <span className={LABEL}>Type</span>
              <Select value={type} onValueChange={(value) => setType(value as CreateType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "update" ? (
              <>
                <div className="space-y-1.5">
                  <span className={LABEL}>Title</span>
                  <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} placeholder="Headline" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Category</span>
                  <Select value={category} onValueChange={(value) => setCategory(value as (typeof UPDATE_CATEGORIES)[number])}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UPDATE_CATEGORIES.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Summary</span>
                  <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} disabled={busy} className={TEXTAREA} placeholder="Short summary" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Source</span>
                  <Input value={sourceName} onChange={(e) => setSourceName(e.target.value)} disabled={busy} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <span className={LABEL}>Name</span>
                  <Input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} disabled={busy} placeholder="Resource name" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Group</span>
                  <Input value={group} onChange={(e) => setGroup(e.target.value)} disabled={busy} placeholder="e.g. Internal" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Detail</span>
                  <Input value={meta} onChange={(e) => setMeta(e.target.value)} disabled={busy} placeholder="Short description" />
                </div>
                <div className="space-y-1.5">
                  <span className={LABEL}>Link</span>
                  <Input value={href} onChange={(e) => setHref(e.target.value)} disabled={busy} placeholder="https://" />
                </div>
              </>
            )}

            {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}

            <DialogFooter>
              <button type="button" onClick={() => handleOpenChange(false)} disabled={busy} className="h-9 rounded-md border border-border px-4 text-xs font-semibold text-foreground transition hover:border-foreground disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={busy || !canSave} className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
