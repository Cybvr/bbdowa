"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { AppraisalReport } from "@/components/appraisal-report";
import { AppraisalResponseForm } from "@/components/appraisal-response-form";
import { MobileHeaderTitle } from "@/components/dashboard/mobile-header";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { firebaseDb } from "@/lib/firebase/client";
import { APPRAISAL_COLLECTION, appraisalNeedsCompletion, normalizeAppraisal, type Appraisal } from "@/lib/appraisals";

export default function AppraisalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, role, loading: authLoading } = useAuth();
  const [appraisal, setAppraisal] = React.useState<Appraisal | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    let active = true;
    getDoc(doc(firebaseDb, APPRAISAL_COLLECTION, id)).then((snapshot) => {
      if (active) setAppraisal(snapshot.exists() ? normalizeAppraisal(snapshot.id, snapshot.data() as Partial<Appraisal>) : null);
    }).catch((cause) => { console.error("Unable to load appraisal", cause); if (active) setError("Unable to load this appraisal."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, id, user]);
  if (authLoading || loading) return <PageLoadingSkeleton titleWidth="w-48" />;
  if (!appraisal) return <main className="flex-1 px-4 py-8 text-sm text-destructive">{error ?? "Appraisal not found."}</main>;
  const isEmployee = !!user && appraisal.assignedTo === user.uid;
  const isStaff = role === "admin" || role === "manager";
  if (!isEmployee && !isStaff) return <main className="flex-1 px-4 py-8 text-sm text-destructive">Appraisal not found.</main>;
  return <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-4 sm:px-8">
    <MobileHeaderTitle title="Appraisal" />
    <Link href="/dashboard/appraisals" className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground no-underline hover:text-foreground"><ChevronLeft className="h-4 w-4" aria-hidden="true" />Appraisals</Link>
    {isEmployee && appraisalNeedsCompletion(appraisal) ? <AppraisalResponseForm appraisal={appraisal} /> : <>
      <h1 className="m-0 mb-6 text-page-title font-bold leading-tight">{appraisal.period || "Performance appraisal"}</h1>
      <AppraisalReport appraisal={appraisal} />
    </>}
  </main>;
}
