"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { DOCUMENT_COLLECTION, type AgencyDocument } from "@/lib/documents";
import { isCreatorUser, type User } from "@/lib/users";
import { RichTextContent, RichTextEditor, richTextHasContent } from "@/components/rich-text-editor";
import { CreatorPicker } from "@/components/creator-picker";
import { DocumentStatus } from "@/components/document-status";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DocumentEditor({ document, user, users, initialAssignee }: { document?: AgencyDocument; user: { uid: string; name: string | null }; users: User[]; initialAssignee?: string }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(document?.title ?? "");
  const [body, setBody] = React.useState(document?.body ?? "");
  const [assignee, setAssignee] = React.useState(initialAssignee ?? document?.assignedTo ?? "");
  const [sendOpen, setSendOpen] = React.useState(false);
  const [reassignOpen, setReassignOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const canEdit = !document || document.status === "draft";
  const validContent = title.trim().length > 0 && richTextHasContent(body);
  const creators = users.filter((candidate): candidate is User & { uid: string } => Boolean(candidate.uid) && isCreatorUser(candidate)).sort((a, b) => a.name.localeCompare(b.name));
  const selectedCreator = creators.find((candidate) => candidate.uid === assignee);

  const write = async (send: boolean) => {
    if (!canEdit || !validContent || busy || (send && !selectedCreator)) return;
    setBusy(true);
    setError(null);
    const now = new Date().toISOString();
    try {
      if (document) {
        await updateDoc(doc(firebaseDb, DOCUMENT_COLLECTION, document.id), {
          title: title.trim(), body: body.trim(), updatedAt: now,
          status: send ? "pending_signature" : "draft",
          assignedTo: send ? selectedCreator!.uid : null,
          assignedToName: send ? selectedCreator!.name : null,
        });
      } else {
        await addDoc(collection(firebaseDb, DOCUMENT_COLLECTION), {
          title: title.trim(), body: body.trim(), status: send ? "pending_signature" : "draft",
          createdBy: user.uid, createdByName: user.name, createdAt: now, updatedAt: now,
          assignedTo: send ? selectedCreator!.uid : null, assignedToName: send ? selectedCreator!.name : null,
          signedAt: null, signedName: null, sourceDocumentId: null,
        });
      }
      router.push("/admin/documents");
      router.refresh();
    } catch (cause) {
      console.error("Unable to save document", cause);
      setError(send ? "Couldn’t send the document. Please try again." : "Couldn’t save the document. Please try again.");
      setBusy(false);
    }
  };

  const reassign = async () => {
    if (!document || document.status !== "pending_signature" || !selectedCreator || busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, DOCUMENT_COLLECTION, document.id), {
        assignedTo: selectedCreator.uid, assignedToName: selectedCreator.name, updatedAt: new Date().toISOString(),
      });
      router.push("/admin/documents");
      router.refresh();
    } catch (cause) {
      console.error("Unable to reassign document", cause);
      setError("Couldn’t change the signer. Please try again.");
      setBusy(false);
    }
  };

  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="min-w-0 flex-1">
        <input aria-label="Document title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={!canEdit} placeholder="Untitled document" className="w-full bg-transparent text-[22px] font-bold outline-none placeholder:text-muted-foreground disabled:opacity-70" />
        {document && <div className="mt-2"><DocumentStatus status={document.status} /></div>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => router.push("/admin/documents")} className="h-10 rounded-md border border-border px-4 text-[13px] font-semibold">Back</button>
        {canEdit && <><button type="button" disabled={!validContent || busy} onClick={() => void write(false)} className="h-10 rounded-md border border-border px-4 text-[13px] font-semibold disabled:opacity-50">{busy ? "Saving…" : "Save draft"}</button><button type="button" disabled={!validContent || busy} onClick={() => setSendOpen(true)} className="h-10 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground disabled:opacity-50">Send for signature</button></>}
        {document?.status === "pending_signature" && <button type="button" disabled={busy} onClick={() => setReassignOpen(true)} className="h-10 rounded-md border border-border px-4 text-[13px] font-semibold disabled:opacity-50">Change signer</button>}
      </div>
    </header>
    {!canEdit && <p className="text-[13px] text-muted-foreground">This document was sent for signature and its text is locked. Duplicate it to make changes.</p>}
    {error && <p className="text-[13px] text-destructive">{error}</p>}
    {canEdit ? <RichTextEditor hideLabel label="Document text" value={body} onChange={setBody} placeholder="Write the document text…" /> : <div className="rounded-xl border border-border bg-background p-5 text-[14px] leading-relaxed"><RichTextContent value={body} /></div>}
    <Dialog open={sendOpen} onOpenChange={setSendOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Send for signature</DialogTitle><DialogDescription>Choose the creator who should sign this document. Its text will lock when sent.</DialogDescription></DialogHeader>
        {creators.length ? <CreatorPicker value={assignee} onChange={setAssignee} options={creators.map((candidate) => ({ value: candidate.uid, label: candidate.name }))} /> : <p className="text-[13px] text-muted-foreground">No creators with accounts are available to sign.</p>}
        <DialogFooter><button type="button" disabled={busy} onClick={() => setSendOpen(false)} className="h-9 rounded-md border border-border px-4">Cancel</button><button type="button" disabled={!selectedCreator || busy} onClick={() => void write(true)} className="h-9 rounded-md bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Sending…" : "Send document"}</button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Change signer</DialogTitle><DialogDescription>Choose a creator with a linked sign-in account. The document text stays locked.</DialogDescription></DialogHeader>
        {creators.length ? <CreatorPicker value={assignee} onChange={setAssignee} options={creators.map((candidate) => ({ value: candidate.uid, label: candidate.name }))} /> : <p className="text-[13px] text-muted-foreground">No creators with accounts are available.</p>}
        <DialogFooter><button type="button" disabled={busy} onClick={() => setReassignOpen(false)} className="h-9 rounded-md border border-border px-4">Cancel</button><button type="button" disabled={!selectedCreator || busy} onClick={() => void reassign()} className="h-9 rounded-md bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Saving…" : "Change signer"}</button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
