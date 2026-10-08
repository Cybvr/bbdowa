"use client";

import * as React from "react";
import Link from "next/link";
import { LoginDialog } from "@/components/login-dialog";
import { useAuth } from "@/components/auth-provider";
import { AppraisalStatus } from "@/components/appraisal-status";
import { PageHeader } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { useFirestoreAppraisals } from "@/lib/firebase/client-content";
import { appraisalNeedsCompletion, formatOverall, scoreAppraisal } from "@/lib/appraisals";
import { formatDocumentDate } from "@/lib/documents";

export default function AppraisalsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const { appraisals, loading, error } = useFirestoreAppraisals();
  const [loginOpen, setLoginOpen] = React.useState(false);
  const canManage = role === "admin" || role === "manager";
  if (authLoading || loading) return <UsersTableSkeleton />;
  if (!user) return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8">
    <PageHeader title="Appraisals" />
    <div className="mt-8 rounded-xl border border-border px-5 py-12 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/pencil-empty-state.webp" alt="" className="mx-auto mb-4 h-32 w-auto" />
      <p className="m-0 text-[15px] font-semibold">Your appraisals are in here somewhere</p>
      <p className="mb-5 mt-1 text-sm text-muted-foreground">Sign in and we will find them.</p>
      <button type="button" onClick={() => setLoginOpen(true)} className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Sign in</button>
    </div>
    <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} redirectTo="/dashboard/appraisals" />
  </main>;
  const mine = appraisals.filter((appraisal) => appraisal.assignedTo === user.uid);
  return <DashboardListPage title="Appraisals" actions={canManage ? <Link href="/admin/appraisals" className="text-[13px] font-semibold text-primary hover:underline">Manage appraisals</Link> : undefined}>
    {error ? <p className="mb-4 text-[13px] text-destructive">{error}</p> : null}
    {mine.length ? <ul className="m-0 mt-4 list-none divide-y divide-border rounded-xl border border-border p-0">{mine.map((appraisal) => <li key={appraisal.id}>
      <Link href={`/dashboard/appraisals/${appraisal.id}`} className="flex items-center justify-between gap-4 px-4 py-4 text-foreground no-underline hover:bg-muted/40">
        <span className="min-w-0"><span className="block truncate font-semibold">{appraisal.period || "Performance appraisal"}</span><span className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground"><AppraisalStatus status={appraisal.status} /><span>Assigned by {appraisal.createdByName || "—"}</span><span>Updated {formatDocumentDate(appraisal.updatedAt)}</span></span></span>
        <span className="shrink-0 text-[14px] font-semibold text-primary">{appraisalNeedsCompletion(appraisal) ? "Complete" : formatOverall(scoreAppraisal(appraisal.ratings).overall)}</span>
      </Link>
    </li>)}</ul> : <div className="px-5 py-12 text-center"><p className="m-0 text-[15px] font-semibold">No appraisals yet</p><p className="mb-0 mt-1 text-sm text-muted-foreground">Appraisals assigned to you will appear here.</p></div>}
  </DashboardListPage>;
}
