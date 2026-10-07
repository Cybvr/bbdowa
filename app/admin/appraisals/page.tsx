"use client";

import * as React from "react";
import Link from "next/link";
import { deleteDoc, doc } from "firebase/firestore";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { AppraisalStatus } from "@/components/appraisal-status";
import { PageHeader } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { useFirestoreAppraisals } from "@/lib/firebase/client-content";
import { APPRAISAL_COLLECTION, formatOverall, scoreAppraisal } from "@/lib/appraisals";
import { formatDocumentDate } from "@/lib/documents";
import { firebaseDb } from "@/lib/firebase/client";
import { plural } from "@/lib/format";

export default function AppraisalsAdminPage() {
  const { role, loading: authLoading } = useAuth();
  const { appraisals, loading, error } = useFirestoreAppraisals();
  const [search, setSearch] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const isStaff = role === "admin" || role === "manager";
  const visible = appraisals.filter((appraisal) =>
    [appraisal.employeeName, appraisal.employeeTitle, appraisal.preparerName, appraisal.period]
      .join(" ").toLowerCase().includes(search.trim().toLowerCase()),
  );

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Delete the appraisal for “${name}”? This can’t be undone.`)) return;
    setBusyId(id);
    setActionError(null);
    try {
      await deleteDoc(doc(firebaseDb, APPRAISAL_COLLECTION, id));
      window.location.reload();
    } catch (cause) {
      console.error("Unable to delete appraisal", cause);
      setActionError("Couldn’t delete the appraisal. Please try again.");
      setBusyId(null);
    }
  };

  if (authLoading || loading) return <UsersTableSkeleton />;
  if (!isStaff) return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8"><PageHeader title="Appraisals" /><p className="mt-8 text-sm text-muted-foreground">A staff account is required to manage appraisals.</p></main>;

  return <DashboardListPage title="Appraisals" actions={<Link href="/admin/appraisals/new" className={LIST_ACTION_CLASS}><Plus aria-hidden="true" className="h-3.5 w-3.5" />Assign appraisal</Link>}
    toolbar={<FilterBar panelId="admin-appraisals-filter" search={search} onSearchChange={setSearch} searchPlaceholder="Search appraisals" resultCount={plural(visible.length, "appraisal")} />}>
    {error || actionError ? <p className="mb-4 text-[13px] text-destructive">{error ?? actionError}</p> : null}
    <section className="mt-4 overflow-x-auto">
      {visible.length ? <Table className="w-full table-fixed border-collapse"><TableHeader><TableRow><TableHead className="px-4 py-3">Employee</TableHead><TableHead className="hidden w-32 px-4 py-3 sm:table-cell">Score</TableHead><TableHead className="w-28 px-4 py-3 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{visible.map((appraisal) => <ClickableTableRow key={appraisal.id} href={`/admin/appraisals/${appraisal.id}/edit`} label={`Open appraisal for ${appraisal.employeeName}`}>
        <TableCell className="px-4 py-3"><div className="min-w-0"><Link href={`/admin/appraisals/${appraisal.id}/edit`} className="block truncate font-semibold hover:text-primary">{appraisal.employeeName || "Unnamed"}</Link><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground"><AppraisalStatus status={appraisal.status} />{appraisal.period ? <span>{appraisal.period}</span> : null}<span>Updated {formatDocumentDate(appraisal.updatedAt)}</span></div></div></TableCell>
        <TableCell className="hidden px-4 py-3 text-[14px] font-semibold sm:table-cell">{formatOverall(scoreAppraisal(appraisal.ratings).overall)}</TableCell>
        <TableCell className="px-4 py-3"><div className="flex justify-end gap-1.5"><Link href={`/admin/appraisals/${appraisal.id}/edit`} aria-label={`Edit appraisal for ${appraisal.employeeName}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></Link>{role === "admin" && <button type="button" onClick={() => void remove(appraisal.id, appraisal.employeeName)} disabled={busyId === appraisal.id} aria-label={`Delete appraisal for ${appraisal.employeeName}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>}</div></TableCell>
      </ClickableTableRow>)}</TableBody></Table> : <div className="px-5 py-12 text-center"><p className="m-0 text-[15px] font-semibold">{appraisals.length ? "No appraisals match" : "No appraisals yet"}</p><p className="mb-0 mt-1 text-sm text-muted-foreground">{appraisals.length ? "Try another search." : "Assign an appraisal to get started."}</p></div>}
    </section>
  </DashboardListPage>;
}
