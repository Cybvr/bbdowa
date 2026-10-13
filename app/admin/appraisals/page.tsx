"use client";

import * as React from "react";
import Link from "next/link";
import { deleteDoc, doc } from "firebase/firestore";
import { CalendarRange, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { AppraisalStatus } from "@/components/appraisal-status";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar, useListView, type SortOption } from "@/components/dashboard/filter-bar";
import { CardGrid, CardMenu, DesktopTable, ListCard, MobileRow, MobileRows, ROW_ICON_ACTION, type CardMenuItem } from "@/components/dashboard/list-card";
import { TableActionsCell } from "@/components/dashboard/table-row-actions";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { useFirestoreAppraisals } from "@/lib/firebase/client-content";
import { APPRAISAL_COLLECTION, formatOverall, scoreAppraisal } from "@/lib/appraisals";
import { formatDocumentDate } from "@/lib/documents";
import { firebaseDb } from "@/lib/firebase/client";
import { plural } from "@/lib/format";
import { confirmDialog } from "@/components/confirm-dialog";

const APPRAISAL_SORTS: SortOption<"recent" | "name">[] = [
  { key: "recent", label: "Last updated" },
  { key: "name", label: "Name (A–Z)" },
];

export default function AppraisalsAdminPage() {
  const { role, loading: authLoading } = useAuth();
  const { appraisals, loading, error } = useFirestoreAppraisals();
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<"recent" | "name">("recent");
  const [view, setView] = useListView("appraisals");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const canManage = role === "admin" || role === "manager";
  const visible = appraisals.filter((appraisal) =>
    [appraisal.assignedToName, appraisal.assignedToTitle, appraisal.createdByName, appraisal.period]
      .join(" ").toLowerCase().includes(search.trim().toLowerCase()),
  );

  const remove = async (id: string, name: string) => {
    if (!await confirmDialog(`Delete the appraisal for “${name}”? This can’t be undone.`)) return;
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
  if (!canManage) return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8"><PageHeader title="Appraisals" /><p className="mt-8 text-sm text-muted-foreground">An admin or manager account is required to manage appraisals.</p></main>;

  const sorted = [...visible].sort((a, b) => sort === "name" ? (a.assignedToName ?? "").localeCompare(b.assignedToName ?? "") : (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  const menuItems = (appraisal: (typeof appraisals)[number]): CardMenuItem[] => [
    { label: "Edit", icon: <Pencil className="h-4 w-4" />, href: `/admin/appraisals/${appraisal.id}/edit` },
    ...(role === "admin" ? [{ label: "Delete", icon: <Trash2 className="h-4 w-4" />, onSelect: () => void remove(appraisal.id, appraisal.assignedToName), destructive: true, disabled: busyId === appraisal.id }] : []),
  ];
  return <DashboardListPage title="Appraisals" actions={<Link href="/admin/appraisals/new" className={LIST_ACTION_CLASS}><Plus aria-hidden="true" className="h-4 w-4" />Add</Link>}
    toolbar={<FilterBar panelId="admin-appraisals-filter" search={search} onSearchChange={setSearch} searchPlaceholder="Search appraisals" sortOptions={APPRAISAL_SORTS} activeSort={sort} onSortChange={setSort} resultCount={plural(visible.length, "appraisal")} view={view} onViewChange={setView} />}>
    {error || actionError ? <p className="mb-4 text-[13px] text-destructive">{error ?? actionError}</p> : null}
    <section aria-label="Appraisals">
      {sorted.length ? view === "cards" ? <CardGrid>{sorted.map((appraisal) => (
        <ListCard key={appraisal.id} href={`/admin/appraisals/${appraisal.id}/edit`} title={appraisal.assignedToName || "Unnamed"} subtitle={formatDocumentDate(appraisal.updatedAt)} menu={<CardMenu items={menuItems(appraisal)} />} />
      ))}</CardGrid> : <><MobileRows>{sorted.map((appraisal) => (
        <MobileRow key={appraisal.id} href={`/admin/appraisals/${appraisal.id}/edit`} title={appraisal.assignedToName || "Unnamed"} chip={appraisal.period || "No period"} chipIcon={<CalendarRange className="h-4 w-4 shrink-0" aria-hidden="true" />} detail={`${formatOverall(scoreAppraisal(appraisal.ratings).overall)} · ${formatDocumentDate(appraisal.updatedAt)}`} status={<AppraisalStatus status={appraisal.status} />} actions={<Link href={`/admin/appraisals/${appraisal.id}/edit`} aria-label={`View appraisal for ${appraisal.assignedToName}`} className={ROW_ICON_ACTION}><Eye className="h-5 w-5" aria-hidden="true" /></Link>} menu={<CardMenu items={menuItems(appraisal)} triggerClassName={ROW_ICON_ACTION} />} />
      ))}</MobileRows><DesktopTable><Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Score</TableHead><TableHead>Updated</TableHead><TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{sorted.map((appraisal) => (
        <ClickableTableRow key={appraisal.id} href={`/admin/appraisals/${appraisal.id}/edit`} label={`Open appraisal for ${appraisal.assignedToName}`}>
          <TableCell className="font-semibold"><Link href={`/admin/appraisals/${appraisal.id}/edit`} className="text-foreground no-underline hover:text-primary">{appraisal.assignedToName || "Unnamed"}</Link></TableCell>
          <TableCell className="text-muted-foreground">{appraisal.period || "—"}</TableCell>
          <TableCell><AppraisalStatus status={appraisal.status} /></TableCell>
          <TableCell className="font-semibold">{formatOverall(scoreAppraisal(appraisal.ratings).overall)}</TableCell>
          <TableCell className="whitespace-nowrap text-muted-foreground">{formatDocumentDate(appraisal.updatedAt)}</TableCell>
          <TableActionsCell
            primary={{ label: "Edit", icon: <Pencil className="h-4 w-4" />, href: `/admin/appraisals/${appraisal.id}/edit` }}
            items={role === "admin" ? [{ label: "Delete", icon: <Trash2 className="h-4 w-4" />, onSelect: () => void remove(appraisal.id, appraisal.assignedToName), destructive: true, disabled: busyId === appraisal.id }] : []}
            label={`More actions for ${appraisal.assignedToName || "appraisal"}`}
          />
        </ClickableTableRow>
      ))}</TableBody></Table></DesktopTable></> : <EmptyState title={appraisals.length ? "No appraisals match" : "No appraisals yet"} description={appraisals.length ? "Try another search." : "Assign an appraisal to get started."} />}
    </section>
  </DashboardListPage>;
}
