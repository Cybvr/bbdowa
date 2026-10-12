"use client";

import * as React from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageUploadField } from "@/components/detail-editor";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import type { JobMedia } from "@/lib/jobs";
import { confirmDialog } from "@/components/confirm-dialog";

export function JobMediaAddAction({
  jobSlug,
  jobName,
  mediaItems,
  onSaved,
}: {
  jobSlug: string;
  jobName: string;
  mediaItems: JobMedia[];
  onSaved: (mediaItems: JobMedia[]) => void;
}) {
  const { isAdmin } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [src, setSrc] = React.useState("");
  const [alt, setAlt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isAdmin) return null;

  const reset = () => {
    setSrc("");
    setAlt("");
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const imageUrl = src.trim();
    const imageAlt = alt.trim();
    if (!imageUrl || !imageAlt || busy) return;

    setBusy(true);
    setError(null);
    const nextMediaItems: JobMedia[] = [...mediaItems, { kind: "image", src: imageUrl, alt: imageAlt }];

    try {
      await updateDoc(doc(firebaseDb, await jobsCollection(), jobSlug), {
        media: nextMediaItems,
        updatedAt: serverTimestamp(),
      });
      onSaved(nextMediaItems);
      setOpen(false);
      reset();
    } catch (cause) {
      console.error("Unable to add job media", cause);
      setError("Couldn’t add this media. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
      >
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        Add
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add media</DialogTitle>
            <DialogDescription>Add an image to {jobName}.</DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <ImageUploadField label="Image" value={src} onChange={setSrc} disabled={busy} />
            <div className="space-y-1.5">
              <label htmlFor="job-media-alt" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Description</label>
              <Input id="job-media-alt" value={alt} onChange={(event) => setAlt(event.target.value)} disabled={busy} placeholder="Describe the image" required />
            </div>
            {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button type="submit" disabled={busy || !src.trim() || !alt.trim()}>{busy ? "Saving…" : "Add media"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function JobMediaDeleteAction({
  jobSlug,
  jobName,
  mediaItems,
  mediaIndex,
  onSaved,
  onError,
  triggerClassName,
}: {
  jobSlug: string;
  jobName: string;
  mediaItems: JobMedia[];
  mediaIndex: number;
  onSaved: (mediaItems: JobMedia[]) => void;
  onError?: (message: string) => void;
  triggerClassName?: string;
}) {
  const { isAdmin } = useAuth();
  const [busy, setBusy] = React.useState(false);

  if (!isAdmin) return null;

  const remove = async () => {
    const media = mediaItems[mediaIndex];
    if (!media || busy || !await confirmDialog(`Delete this media from ${jobName}? This can’t be undone.`)) return;

    setBusy(true);
    try {
      const nextMediaItems = mediaItems.filter((_, index) => index !== mediaIndex);
      await updateDoc(doc(firebaseDb, await jobsCollection(), jobSlug), {
        media: nextMediaItems,
        updatedAt: serverTimestamp(),
      });
      onSaved(nextMediaItems);
    } catch (cause) {
      console.error("Unable to delete job media", cause);
      onError?.("Couldn’t delete this media. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${mediaItems[mediaIndex]?.alt ?? "media"}`}
          disabled={busy}
          className={triggerClassName ?? "grid h-10 w-10 place-items-center rounded-lg border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-wait disabled:opacity-50"}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem variant="destructive" className="text-xs" onSelect={() => void remove()}>
          <Trash2 className="h-4 w-4" />Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
