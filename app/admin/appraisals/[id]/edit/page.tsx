"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { AppraisalEditor } from "@/components/appraisal-editor";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { firebaseDb } from "@/lib/firebase/client";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { APPRAISAL_COLLECTION, normalizeAppraisal, type Appraisal } from "@/lib/appraisals";

export default function EditAppraisalPage() {
  const { id } = useParams<{ id: string }>();
  const { user, role, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [appraisal, setAppraisal] = React.useState<Appraisal | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (authLoading) return;
    if (!user || (role !== "admin" && role !== "manager")) { setLoading(false); return; }
    let active = true;
    getDoc(doc(firebaseDb, APPRAISAL_COLLECTION, id)).then((snapshot) => {
      if (active) setAppraisal(snapshot.exists() ? normalizeAppraisal(snapshot.id, snapshot.data() as Partial<Appraisal>) : null);
    }).catch((cause) => { console.error("Unable to load appraisal", cause); if (active) setError("Unable to load this appraisal."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, id, role, user]);
  if (authLoading || loading || usersLoading) return <PageLoadingSkeleton titleWidth="w-40" />;
  if (!user || (role !== "admin" && role !== "manager")) return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"><PageHeader title="Appraisal" /><p className="mt-6 text-sm text-muted-foreground">A staff account is required.</p></main>;
  if (!appraisal) return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"><PageHeader title="Appraisal" /><p className="mt-6 text-sm text-destructive">{error ?? "Appraisal not found."}</p></main>;
  return <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-10 pt-4 sm:px-8"><AppraisalEditor appraisal={appraisal} user={{ uid: user.uid, name: user.name ?? user.email }} users={users} /></main>;
}
