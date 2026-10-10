"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { ArrowLeft, Save, Share2, Users } from "lucide-react";
import { firebaseDb } from "@/lib/firebase/client";
import { sendAppEmail } from "@/lib/app-email";
import { DOCUMENT_COLLECTION, type AgencyDocument } from "@/lib/documents";
import { type User } from "@/lib/users";
import { RichTextContent, RichTextEditor, richTextHasContent } from "@/components/rich-text-editor";
import { CreatorPicker } from "@/components/creator-picker";
import { DocumentStatus } from "@/components/document-status";
import { MobileHeaderActions, MobileHeaderTitle } from "@/components/dashboard/mobile-header";
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
  // Anyone with a sign-in account can be sent a document to sign.
  const people: { uid: string; name: string }[] = users
    .filter((candidate) => candidate.uid)
    .map((candidate) => ({ uid: candidate.uid as string, name: candidate.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  // Always allow sharing with yourself, even if your own record has no uid yet.
  if (user.uid && !people.some((person) => person.uid === user.uid)) {
    people.unshift({ uid: user.uid, name: `${user.name ?? "Me"} (you)` });
  }
  const selectedPerson = people.find((candidate) => candidate.uid === assignee);

  const write = async (send: boolean) => {
    if (!canEdit || !validContent || busy || (send && !selectedPerson)) return;
    setBusy(true);
    setError(null);
    const now = new Date().toISOString();
    try {
      if (document) {
        await updateDoc(doc(firebaseDb, DOCUMENT_COLLECTION, document.id), {
          title: title.trim(), body: body.trim(), updatedAt: now,
          status: send ? "pending_signature" : "draft",
          assignedTo: send ? selectedPerson!.uid : null,
          assignedToName: send ? selectedPerson!.name : null,
        });
        if (send && (document.status !== "pending_signature" || document.assignedTo !== selectedPerson!.uid)) {
          void sendAppEmail({ type: "document", documentId: document.id });
        }
      } else {
        const created = await addDoc(collection(firebaseDb, DOCUMENT_COLLECTION), {
          title: title.trim(), body: body.trim(), status: send ? "pending_signature" : "draft",
          createdBy: user.uid, createdByName: user.name, createdAt: now, updatedAt: now,
          assignedTo: send ? selectedPerson!.uid : null, assignedToName: send ? selectedPerson!.name : null,
          signedAt: null, signedName: null, sourceDocumentId: null,
        });
        if (send) void sendAppEmail({ type: "document", documentId: created.id });
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
    if (!document || document.status !== "pending_signature" || !selectedPerson || busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, DOCUMENT_COLLECTION, document.id), {
        assignedTo: selectedPerson.uid, assignedToName: selectedPerson.name, updatedAt: new Date().toISOString(),
      });
      if (selectedPerson.uid !== document.assignedTo) void sendAppEmail({ type: "document", documentId: document.id });
      router.push("/admin/documents");
      router.refresh();
    } catch (cause) {
      console.error("Unable to reassign document", cause);
      setError("Couldn’t change the signer. Please try again.");
      setBusy(false);
    }
  };

  const actionButtons = <>
    <button type="button" onClick={() => router.push("/admin/documents")} aria-label="Back" title="Back" className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-semibold">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Back</span>
    </button>
    {canEdit && <>
      <button type="button" disabled={!validContent || busy} onClick={() => void write(false)} aria-label="Save draft" title="Save draft" className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-semibold disabled:opacity-50">
        <Save className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">{busy ? "Saving…" : "Save draft"}</span>
      </button>
      <button type="button" disabled={!validContent || busy} onClick={() => setSendOpen(true)} aria-label="Share" title="Share" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-50">
        <Share2 className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Share</span>
      </button>
    </>}
    {document?.status === "pending_signature" && <button type="button" disabled={busy} onClick={() => setReassignOpen(true)} aria-label="Change signer" title="Change signer" className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-semibold disabled:opacity-50">
      <Users className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Change signer</span>
    </button>}
  </>;

  return <div className="space-y-6">
    <MobileHeaderTitle title={title.trim() || (document ? "Edit document" : "New document")} />
    <MobileHeaderActions>{actionButtons}</MobileHeaderActions>
    {/* On phones the title and actions live in the dashboard top bar; this
     * header is desktop only. */}
    <header className="hidden flex-wrap items-center justify-between gap-3 border-b border-border pb-4 nav:flex">
      <div className="min-w-0 flex-1">
        <input aria-label="Document title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={!canEdit} placeholder="Untitled document" className="w-full bg-transparent text-[22px] font-bold outline-none placeholder:text-muted-foreground disabled:opacity-70" />
        {document && <div className="mt-2"><DocumentStatus status={document.status} /></div>}
      </div>
      <div className="flex items-center gap-2">{actionButtons}</div>
    </header>
    {/* Phones: the title lives in the dashboard top bar; keep just the status here. */}
    {document && <div className="nav:hidden"><DocumentStatus status={document.status} /></div>}
    {!canEdit && <p className="text-[13px] text-muted-foreground">This document was sent for signature and its text is locked. Duplicate it to make changes.</p>}
    {error && <p className="text-[13px] text-destructive">{error}</p>}
    {canEdit ? <RichTextEditor hideLabel label="Document text" value={body} onChange={setBody} placeholder="Write the document text…" /> : <div className="rounded-xl border border-border bg-background p-5 text-[14px] leading-relaxed"><RichTextContent value={body} /></div>}
    <Dialog open={sendOpen} onOpenChange={setSendOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Share document</DialogTitle><DialogDescription>Choose who to share this document with for signing. Its text will lock once shared.</DialogDescription></DialogHeader>
        {people.length ? <CreatorPicker value={assignee} onChange={setAssignee} placeholder="Search people" emptyText="No people found." options={people.map((candidate) => ({ value: candidate.uid, label: candidate.name }))} /> : <p className="text-[13px] text-muted-foreground">No people with accounts are available to sign.</p>}
        <DialogFooter><button type="button" disabled={busy} onClick={() => setSendOpen(false)} className="h-9 rounded-md border border-border px-4">Cancel</button><button type="button" disabled={!selectedPerson || busy} onClick={() => void write(true)} className="h-9 rounded-md bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Sharing…" : "Share document"}</button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Change signer</DialogTitle><DialogDescription>Choose anyone with a sign-in account. The document text stays locked.</DialogDescription></DialogHeader>
        {people.length ? <CreatorPicker value={assignee} onChange={setAssignee} placeholder="Search people" emptyText="No people found." options={people.map((candidate) => ({ value: candidate.uid, label: candidate.name }))} /> : <p className="text-[13px] text-muted-foreground">No people with accounts are available.</p>}
        <DialogFooter><button type="button" disabled={busy} onClick={() => setReassignOpen(false)} className="h-9 rounded-md border border-border px-4">Cancel</button><button type="button" disabled={!selectedPerson || busy} onClick={() => void reassign()} className="h-9 rounded-md bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Saving…" : "Change signer"}</button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
