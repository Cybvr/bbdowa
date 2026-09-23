"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { readDocumentsForAssignee } from "@/lib/firebase/client-content";
import { formatDocumentDate, sortDocuments, type AgencyDocument } from "@/lib/documents";
import { DocumentStatus } from "@/components/document-status";
import { DocumentSignDialog } from "@/components/document-sign-dialog";
import { EmptyState } from "@/components/dashboard/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type DocumentViewer = { uid: string | null; name: string | null; isStaff: boolean; isAdmin: boolean; canSign: boolean };

export function CreatorDocumentAddAction({ creatorUid }: { creatorUid: string | null | undefined }) {
  return (
    <Link
      href={`/admin/documents/new?assignee=${encodeURIComponent(creatorUid ?? "")}`}
      aria-label="New document"
      title="New document"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <Plus aria-hidden="true" className="h-5 w-5" />
    </Link>
  );
}

export function CreatorDocumentsPanel({ creatorUid, creatorSlug, creatorName, viewer }: { creatorUid: string | null | undefined; creatorSlug: string; creatorName: string; viewer: DocumentViewer }) {
  const [documents, setDocuments] = React.useState<AgencyDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const load = React.useCallback(async () => {
    setDocuments(sortDocuments(await readDocumentsForAssignee(creatorUid, creatorSlug)));
  }, [creatorUid, creatorSlug]);
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    load().catch((cause) => { console.error("Unable to load creator documents", cause); if (active) setError("Unable to load documents."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);
  if (loading) return <div role="status" aria-label="Loading documents" className="space-y-2"><Skeleton className="h-14 w-full rounded-xl" /><Skeleton className="h-14 w-full rounded-xl" /></div>;
  return (
    <div>
      {error && <p className="text-[13px] text-destructive">{error}</p>}
      {documents.length ? (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <Table className="min-w-[620px]">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="px-4">Document</TableHead>
                <TableHead className="px-4">Status</TableHead>
                <TableHead className="px-4">Activity</TableHead>
                <TableHead className="px-4 text-right"><span className="sr-only">Action</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => {
                const canSign = document.status === "pending_signature" && viewer.canSign && viewer.uid === document.assignedTo;
                return (
                  <TableRow key={document.id}>
                    <TableCell className="max-w-[280px] px-4 py-3">
                      <Link href={`/dashboard/documents/${document.id}`} className="block truncate font-semibold text-foreground hover:text-primary" title={document.title}>{document.title}</Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3"><DocumentStatus status={document.status} /></TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {document.status === "signed" ? `Signed ${formatDocumentDate(document.signedAt)} as ${document.signedName}` : `Sent ${formatDocumentDate(document.createdAt)} by ${document.createdByName ?? "staff"}`}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right">
                      {canSign && <DocumentSignDialog document={document} defaultName={viewer.name ?? ""} onSigned={() => void load()} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState title="No documents yet" description={viewer.isStaff ? `Create a document for ${creatorName}.` : "Documents sent to you will appear here."} />
      )}
    </div>
  );
}
