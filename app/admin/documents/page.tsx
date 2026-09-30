"use client";

import * as React from "react";
import Link from "next/link";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { DocumentStatus } from "@/components/document-status";
import { PageHeader } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { richTextToPlainText } from "@/components/rich-text-editor";
import { useFirestoreDocuments, useFirestoreUsers } from "@/lib/firebase/client-content";
import { DOCUMENT_COLLECTION, type DocumentStatus as Status } from "@/lib/documents";
import { firebaseDb } from "@/lib/firebase/client";
import { plural } from "@/lib/format";
import { isCreatorUser } from "@/lib/users";

export default function DocumentsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const { documents, loading, error } = useFirestoreDocuments();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<Status | "all">("all");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const isStaff = role === "admin" || role === "manager";
  const visible = documents.filter((document) => {
    if (status !== "all" && document.status !== status) return false;
    return [document.title, document.assignedToName, richTextToPlainText(document.body)]
      .filter(Boolean).join(" ").toLowerCase().includes(search.trim().toLowerCase());
  });

  const duplicate = async (source: (typeof documents)[number]) => {
    if (!user) return;
    setBusyId(source.id);
    setActionError(null);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(firebaseDb, DOCUMENT_COLLECTION), {
        title: `${source.title} (Copy)`, body: source.body, status: "draft",
        createdBy: user.uid, createdByName: user.name ?? user.email,
        createdAt: now, updatedAt: now, assignedTo: null, assignedToName: null,
        signedAt: null, signedName: null, sourceDocumentId: source.id,
      });
      window.location.reload();
    } catch (cause) {
      console.error("Unable to duplicate document", cause);
      setActionError("Couldn’t duplicate the document. Please try again.");
      setBusyId(null);
    }
  };

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Delete “${title}”? This can’t be undone.`)) return;
    setBusyId(id);
    setActionError(null);
    try {
      await deleteDoc(doc(firebaseDb, DOCUMENT_COLLECTION, id));
      window.location.reload();
    } catch (cause) {
      console.error("Unable to delete document", cause);
      setActionError("Couldn’t delete the document. Please try again.");
      setBusyId(null);
    }
  };

  if (authLoading || loading || usersLoading) return <UsersTableSkeleton />;
  if (!isStaff) return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8"><PageHeader title="Documents" /><p className="mt-8 text-sm text-muted-foreground">A staff account is required to manage documents.</p></main>;

  return <DashboardListPage title="Documents" actions={<Link href="/admin/documents/new" className={LIST_ACTION_CLASS}><Plus aria-hidden="true" className="h-3.5 w-3.5" />New document</Link>}
    toolbar={<div className="space-y-3"><FilterBar panelId="admin-documents-filter" search={search} onSearchChange={setSearch} searchPlaceholder="Search documents" resultCount={plural(visible.length, "document")} /><div className="flex flex-wrap gap-2" aria-label="Document status filter">{(["all", "draft", "pending_signature", "signed"] as const).map((value) => <button key={value} type="button" onClick={() => setStatus(value)} aria-pressed={status === value} className={`rounded-md border px-3 py-1.5 text-[13px] font-medium ${status === value ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"}`}>{value === "all" ? "All" : value === "pending_signature" ? "Pending" : value === "draft" ? "Drafts" : "Signed"}</button>)}</div></div>}>
    {error || actionError ? <p className="mb-4 text-[13px] text-destructive">{error ?? actionError}</p> : null}
    <section className="mt-4 overflow-x-auto">
      {visible.length ? <Table className="w-full table-fixed border-collapse"><TableHeader><TableRow><TableHead className="px-4 py-3">Document</TableHead><TableHead className="w-36 px-4 py-3 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{visible.map((document) => {
        const recipient = users.find((candidate) =>
          candidate.uid === document.assignedTo || candidate.slug === document.assignedTo,
        );
        const creator = recipient?.slug && isCreatorUser(recipient) ? recipient : null;
        const recipientName = document.assignedToName ?? recipient?.name ?? "Unassigned";
        return <ClickableTableRow key={document.id} href={`/dashboard/documents/${document.id}`} label={`Open document ${document.title}`}>
        <TableCell className="px-4 py-3"><div className="min-w-0"><Link href={`/dashboard/documents/${document.id}`} className="block truncate font-semibold hover:text-primary">{document.title}</Link><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground"><span className="hidden sm:inline-flex"><DocumentStatus status={document.status} /></span>{creator ? (
            <Link href={`/dashboard/discover/${creator.slug}`} className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">
              Sent to {recipientName}
            </Link>
          ) : <span>Sent to {recipientName}</span>}</div></div></TableCell>
        <TableCell className="px-4 py-3"><div className="flex justify-end gap-1.5"><Link href={`/admin/documents/${document.id}/edit`} aria-label={`Open ${document.title}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></Link><button type="button" onClick={() => void duplicate(document)} disabled={busyId === document.id} aria-label={`Duplicate ${document.title}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50"><Copy className="h-4 w-4" /></button>{role === "admin" && <button type="button" onClick={() => void remove(document.id, document.title)} disabled={busyId === document.id} aria-label={`Delete ${document.title}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>}</div></TableCell>
      </ClickableTableRow>})}</TableBody></Table> : <div className="px-5 py-12 text-center"><p className="m-0 text-[15px] font-semibold">{documents.length ? "No documents match" : "No documents yet"}</p><p className="mb-0 mt-1 text-sm text-muted-foreground">{documents.length ? "Try another search or status." : "Create a document to get started."}</p></div>}
    </section>
  </DashboardListPage>;
}
