"use client";

import * as React from "react";
import { doc, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { DOCUMENT_COLLECTION, type AgencyDocument } from "@/lib/documents";
import { RichTextContent } from "@/components/rich-text-editor";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DocumentSignDialog({ document, defaultName, onSigned, open: controlledOpen, onOpenChange, hideTrigger = false }: { document: AgencyDocument; defaultName: string; onSigned: () => void; open?: boolean; onOpenChange?: (open: boolean) => void; hideTrigger?: boolean }) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [name, setName] = React.useState(defaultName);
  const [agreed, setAgreed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const sign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !agreed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(firebaseDb, DOCUMENT_COLLECTION, document.id), {
        status: "signed", signedAt: now, signedName: name.trim(), updatedAt: now,
      });
      setOpen(false);
      onSigned();
    } catch (cause) {
      console.error("Unable to sign document", cause);
      setError("Couldn’t record your signature. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <>
    {hideTrigger ? null : <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground">Review and sign</button>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{document.title}</DialogTitle><DialogDescription>Read the document, then type your full name to sign.</DialogDescription></DialogHeader>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4 text-[13px] leading-[1.6]"><RichTextContent value={document.body} /></div>
        <form onSubmit={sign} className="space-y-4">
          <label className="block space-y-1.5 text-[13px] font-medium">Full name<Input value={name} onChange={(event) => setName(event.target.value)} disabled={busy} required /></label>
          <label className="flex items-start gap-2 text-[13px]"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} disabled={busy} className="mt-0.5 h-4 w-4" />I have read this document and agree to its terms.</label>
          {error && <p className="text-[13px] text-destructive">{error}</p>}
          <DialogFooter><button type="button" onClick={() => setOpen(false)} disabled={busy} className="h-9 rounded-md border border-border px-4">Cancel</button><button type="submit" disabled={!name.trim() || !agreed || busy} className="h-9 rounded-md bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Signing…" : "Sign document"}</button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
