"use client";

import * as React from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Plus } from "lucide-react";
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
import { firebaseDb } from "@/lib/firebase/client";
import type { CreativePreview } from "@/lib/client-workspaces";

export function ClientMediaAddAction({
  campaignId,
  clientName,
  mediaItems,
  onSaved,
}: {
  campaignId: string | null;
  clientName: string;
  mediaItems: CreativePreview[];
  onSaved: (mediaItems: CreativePreview[]) => void;
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
    if (!campaignId || !imageUrl || !imageAlt || busy) return;

    setBusy(true);
    setError(null);
    const nextMediaItems = [...mediaItems, { src: imageUrl, alt: imageAlt }];

    try {
      await updateDoc(doc(firebaseDb, "campaigns", campaignId), {
        moodboardImages: nextMediaItems,
        updatedAt: serverTimestamp(),
      });
      onSaved(nextMediaItems);
      setOpen(false);
      reset();
    } catch (cause) {
      console.error("Unable to add client media", cause);
      setError("Couldn’t add this media. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!campaignId}
        title={campaignId ? undefined : "Create a campaign before adding media"}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        Add
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add media</DialogTitle>
            <DialogDescription>Add an image to {clientName}’s media collection.</DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="client-media-url" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Image URL</label>
              <Input id="client-media-url" autoFocus value={src} onChange={(event) => setSrc(event.target.value)} disabled={busy} placeholder="https://" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="client-media-alt" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Description</label>
              <Input id="client-media-alt" value={alt} onChange={(event) => setAlt(event.target.value)} disabled={busy} placeholder="Describe the image" required />
            </div>
            {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}
            <DialogFooter>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="h-9 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={busy || !src.trim() || !alt.trim() || !campaignId} className="h-9 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Saving…" : "Add media"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
