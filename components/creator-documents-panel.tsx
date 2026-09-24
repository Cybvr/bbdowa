"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { readDocumentsForAssignee } from "@/lib/firebase/client-content";
import { formatDocumentDate, sortDocuments, type AgencyDocument } from "@/lib/documents";
import { DocumentStatus } from "@/components/document-status";
import { EmptyState } from "@/components/dashboard/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard, ItemCardList } from "@/components/dashboard/item-card";

export type DocumentViewer = { uid: string | null; name: string | null; isStaff: boolean; isAdmin: boolean; canSign: boolean };

export function CreatorDocumentAddAction({ creatorUid }: { creatorUid: string | null | undefined }) {
  return (
    <Link
      href={`/admin/documents/new?assignee=${encodeURIComponent(creatorUid ?? "")}`}
      aria-label="New document"
      title="New document"
      className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <Plus aria-hidden="true" className="h-4 w-4" />New
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
        <ItemCardList>
          {documents.map((document) => (
            <ItemCard
              key={document.id}
              href={`/dashboard/documents/${document.id}`}
              icon={<FileText className="h-5 w-5" aria-hidden="true" />}
              title={document.title}
              subtitle={document.status === "signed"
                ? `Signed ${formatDocumentDate(document.signedAt)} as ${document.signedName}`
                : `Sent ${formatDocumentDate(document.createdAt)} by ${document.createdByName ?? "staff"}`}
              trailing={<DocumentStatus status={document.status} />}
            />
          ))}
        </ItemCardList>
      ) : (
        <EmptyState title="No documents yet" description={viewer.isStaff ? `Create a document for ${creatorName}.` : "Documents sent to you will appear here."} />
      )}
    </div>
  );
}
