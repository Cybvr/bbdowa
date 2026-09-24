"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { DocumentSignDialog } from "@/components/document-sign-dialog";
import { DocumentStatus } from "@/components/document-status";
import { DetailBreadcrumb } from "@/components/dashboard/detail-hero";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { RichTextContent } from "@/components/rich-text-editor";
import { firebaseDb } from "@/lib/firebase/client";
import { DOCUMENT_COLLECTION, formatDocumentDateTime, type AgencyDocument } from "@/lib/documents";

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, role, loading: authLoading } = useAuth();
  const [document, setDocument] = React.useState<AgencyDocument | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const load = React.useCallback(async () => {
    const snapshot = await getDoc(doc(firebaseDb, DOCUMENT_COLLECTION, id));
    setDocument(snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as Omit<AgencyDocument, "id">) } : null);
  }, [id]);
  React.useEffect(() => {
    if (authLoading) return;
    let active = true;
    load().catch((cause) => { console.error("Unable to load document", cause); if (active) setError("Unable to load this document."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, load]);
  if (authLoading || loading) return <PageLoadingSkeleton titleWidth="w-48" />;
  if (!document) return <main className="flex-1 px-4 py-8 text-sm text-destructive">{error ?? "Document not found."}</main>;
  const isStaff = role === "admin" || role === "manager";
  const canSign = document.status === "pending_signature" && user?.uid === document.assignedTo;
  return <main className="flex flex-1 flex-col px-4 pb-8 pt-4 sm:px-8">
    <DetailBreadcrumb crumbs={[{ label: "Documents", href: isStaff ? "/admin/documents" : "/dashboard/me" }, { label: document.title }]} actions={<div className="flex items-center gap-2">{isStaff && <Link href={`/admin/documents/${document.id}/edit`} className="inline-flex h-9 items-center rounded-md border border-border px-3 text-[13px] font-semibold">{document.status === "draft" ? "Edit" : "View record"}</Link>}{canSign && <DocumentSignDialog document={document} defaultName={user?.name ?? ""} onSigned={() => void load()} />}</div>} />
    <div className="mt-4 flex flex-col gap-5 nav:flex-row">
      <aside className="space-y-4 self-start rounded-xl border border-border bg-muted/20 p-5 nav:sticky nav:top-5 nav:w-[300px] nav:flex-none">
        <h1 className="m-0 text-[17px] font-bold">{document.title}</h1><DocumentStatus status={document.status} />
        <dl className="space-y-3 text-[13px]"><div><dt className="text-muted-foreground">Created</dt><dd className="m-0 font-medium">{formatDocumentDateTime(document.createdAt)}</dd></div><div><dt className="text-muted-foreground">Sent to</dt><dd className="m-0 font-medium">{document.assignedToName ?? "—"}</dd></div><div><dt className="text-muted-foreground">Signed</dt><dd className="m-0 font-medium">{formatDocumentDateTime(document.signedAt)}</dd></div><div><dt className="text-muted-foreground">Signed by</dt><dd className="m-0 font-medium">{document.signedName ?? "—"}</dd></div></dl>
      </aside>
      <section aria-label="Document" className="min-w-0 flex-1 rounded-xl border border-border bg-muted/30 p-4 sm:p-6">
        <article className="mx-auto max-w-[720px] rounded-sm border border-border/60 bg-white text-black shadow-md">
          <div className="px-8 py-10 text-[14px] leading-[1.8] text-black sm:px-12 sm:py-14 [&_a]:text-primary">
            <RichTextContent value={document.body} />
          </div>
        </article>
      </section>
    </div>
  </main>;
}
