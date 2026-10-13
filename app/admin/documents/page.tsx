"use client";

import * as React from "react";
import Link from "next/link";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { Copy, Eye, Pencil, Trash2, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { DocumentStatus } from "@/components/document-status";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar, useListView, type FilterTab, type SortOption } from "@/components/dashboard/filter-bar";
import { CardGrid, CardMenu, DesktopTable, ListCard, MobileRow, MobileRows, ROW_ICON_ACTION, type CardMenuItem } from "@/components/dashboard/list-card";
import { TableActionsCell } from "@/components/dashboard/table-row-actions";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { richTextToPlainText } from "@/components/rich-text-editor";
import { useFirestoreDocuments, useFirestoreUsers } from "@/lib/firebase/client-content";
import { DOCUMENT_COLLECTION, formatDocumentDate, type DocumentStatus as Status } from "@/lib/documents";
import { firebaseDb } from "@/lib/firebase/client";
import { plural } from "@/lib/format";
import { isCreatorUser } from "@/lib/users";
import { confirmDialog } from "@/components/confirm-dialog";

const DOCUMENT_TABS: FilterTab<Status | "all">[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "pending_signature", label: "Pending" },
  { key: "signed", label: "Signed" },
];
const DOCUMENT_SORTS: SortOption<"recent" | "title">[] = [
  { key: "recent", label: "Last updated" },
  { key: "title", label: "Title (A–Z)" },
];

export default function DocumentsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const { documents, loading, error } = useFirestoreDocuments();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<Status | "all">("all");
  const [sort, setSort] = React.useState<"recent" | "title">("recent");
  const [view, setView] = useListView("documents");
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
    if (!await confirmDialog(`Delete “${title}”? This can’t be undone.`)) return;
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

  const sorted = [...visible].sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  const recipientOf = (document: (typeof documents)[number]) => {
    const recipient = users.find((candidate) => candidate.uid === document.assignedTo || candidate.slug === document.assignedTo);
    const creator = recipient?.slug && isCreatorUser(recipient) ? recipient : null;
    const name = document.assignedToName ?? recipient?.name ?? "Unassigned";
    return creator ? <Link href={`/dashboard/discover/${creator.slug}`} className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">{name}</Link> : name;
  };
  const recipientName = (document: (typeof documents)[number]) =>
    document.assignedToName ?? users.find((candidate) => candidate.uid === document.assignedTo || candidate.slug === document.assignedTo)?.name ?? "Unassigned";
  const menuItems = (document: (typeof documents)[number]): CardMenuItem[] => [
    { label: "Edit", icon: <Pencil className="h-4 w-4" />, href: `/admin/documents/${document.id}/edit` },
    { label: "Duplicate", icon: <Copy className="h-4 w-4" />, onSelect: () => void duplicate(document), disabled: busyId === document.id },
    ...(role === "admin" ? [{ label: "Delete", icon: <Trash2 className="h-4 w-4" />, onSelect: () => void remove(document.id, document.title), destructive: true, disabled: busyId === document.id }] : []),
  ];
  return <DashboardListPage title="Documents"
    toolbar={<FilterBar panelId="admin-documents-filter" tabs={DOCUMENT_TABS} activeTab={status} onTabChange={setStatus} search={search} onSearchChange={setSearch} searchPlaceholder="Search documents" sortOptions={DOCUMENT_SORTS} activeSort={sort} onSortChange={setSort} resultCount={plural(visible.length, "document")} view={view} onViewChange={setView} add={{ href: "/admin/documents/new" }} />}>
    {error || actionError ? <p className="mb-4 text-[13px] text-destructive">{error ?? actionError}</p> : null}
    <section aria-label="Documents">
      {sorted.length ? view === "cards" ? <CardGrid>{sorted.map((document) => (
        <ListCard key={document.id} href={`/dashboard/documents/${document.id}`} title={document.title} subtitle={formatDocumentDate(document.updatedAt)} menu={<CardMenu items={menuItems(document)} />} />
      ))}</CardGrid> : <><MobileRows>{sorted.map((document) => (
        <MobileRow key={document.id} href={`/dashboard/documents/${document.id}`} title={document.title} chip={recipientName(document)} chipIcon={<UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />} detail={formatDocumentDate(document.updatedAt)} status={<DocumentStatus status={document.status} />} actions={<Link href={`/dashboard/documents/${document.id}`} aria-label={`View ${document.title}`} className={ROW_ICON_ACTION}><Eye className="h-5 w-5" aria-hidden="true" /></Link>} menu={<CardMenu items={menuItems(document)} triggerClassName={ROW_ICON_ACTION} />} />
      ))}</MobileRows><DesktopTable><Table><TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Sent to</TableHead><TableHead>Status</TableHead><TableHead>Updated</TableHead><TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{sorted.map((document) => (
        <ClickableTableRow key={document.id} href={`/dashboard/documents/${document.id}`} label={`Open document ${document.title}`}>
          <TableCell className="font-semibold"><Link href={`/dashboard/documents/${document.id}`} className="text-foreground no-underline hover:text-primary">{document.title}</Link></TableCell>
          <TableCell className="text-muted-foreground">{recipientOf(document)}</TableCell>
          <TableCell><DocumentStatus status={document.status} /></TableCell>
          <TableCell className="whitespace-nowrap text-muted-foreground">{formatDocumentDate(document.updatedAt)}</TableCell>
          <TableActionsCell
            primary={[
              { label: "Edit", icon: <Pencil className="h-4 w-4" />, href: `/admin/documents/${document.id}/edit` },
              { label: "Duplicate", icon: <Copy className="h-4 w-4" />, onSelect: () => void duplicate(document), disabled: busyId === document.id },
            ]}
            items={role === "admin" ? [{ label: "Delete", icon: <Trash2 className="h-4 w-4" />, onSelect: () => void remove(document.id, document.title), destructive: true, disabled: busyId === document.id }] : []}
            label={`More actions for ${document.title}`}
          />
        </ClickableTableRow>
      ))}</TableBody></Table></DesktopTable></> : <EmptyState title={documents.length ? "No documents match" : "No documents yet"} description={documents.length ? "Try another search or status." : "Create a document to get started."} />}
    </section>
  </DashboardListPage>;
}
