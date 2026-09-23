"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { DocumentEditor } from "@/components/document-editor";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { firebaseDb } from "@/lib/firebase/client";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { DOCUMENT_COLLECTION, type AgencyDocument } from "@/lib/documents";

export default function EditDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const { user, role, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [document, setDocument] = React.useState<AgencyDocument | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (authLoading) return;
    if (!user || (role !== "admin" && role !== "manager")) { setLoading(false); return; }
    let active = true;
    getDoc(doc(firebaseDb, DOCUMENT_COLLECTION, id)).then((snapshot) => {
      if (active) setDocument(snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as Omit<AgencyDocument, "id">) } : null);
    }).catch((cause) => { console.error("Unable to load document", cause); if (active) setError("Unable to load this document."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, id, role, user]);
  if (authLoading || loading || usersLoading) return <PageLoadingSkeleton titleWidth="w-40" />;
  if (!user || (role !== "admin" && role !== "manager")) return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"><PageHeader title="Document" /><p className="mt-6 text-sm text-muted-foreground">A staff account is required.</p></main>;
  if (!document) return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"><PageHeader title="Document" /><p className="mt-6 text-sm text-destructive">{error ?? "Document not found."}</p></main>;
  return <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-4 sm:px-8"><DocumentEditor document={document} user={{ uid: user.uid, name: user.name ?? user.email }} users={users} /></main>;
}
