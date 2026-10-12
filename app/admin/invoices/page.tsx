"use client";

import * as React from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Pencil, Plus } from "lucide-react";
import { Badge, EmptyState, StatItem, StatRow } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { CardGrid, CardMenu, ListCard } from "@/components/dashboard/list-card";
import { TableActionsCell } from "@/components/dashboard/table-row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
import { InvoiceDialog } from "@/components/invoice-dialog";
import { FilterBar, useListView, type SortOption } from "@/components/dashboard/filter-bar";
import { firebaseDb } from "@/lib/firebase/client";
import { sendAppEmail } from "@/lib/app-email";
import { plural, updatedDate } from "@/lib/format";
import { INVOICES_COLLECTION, INVOICE_STATUS_LABELS, invoiceTotals, isInvoiceOverdue, type Invoice, type InvoiceStatus } from "@/lib/invoices";
import { formatAmount } from "@/lib/payments";
import { notify } from "@/lib/email/notify";

const TABS: { key: "all" | InvoiceStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "sent", label: "Due" },
  { key: "paid", label: "Paid" },
];

const INVOICE_SORTS: SortOption<"recent" | "due" | "client">[] = [
  { key: "recent", label: "Last updated" },
  { key: "due", label: "Due date" },
  { key: "client", label: "Client (A–Z)" },
];

/** Admin: every invoice we've raised to client companies. */
export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [tab, setTab] = React.useState<(typeof TABS)[number]["key"]>("all");
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<Invoice | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [sort, setSort] = React.useState<"recent" | "due" | "client">("recent");
  const [view, setView] = useListView("invoices");

  React.useEffect(() => onSnapshot(
    collection(firebaseDb, INVOICES_COLLECTION),
    (snapshot) => setInvoices(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Invoice).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    (cause) => console.error("Unable to load invoices", cause),
  ), []);

  const term = search.trim().toLowerCase();
  const visible = invoices.filter((invoice) => (tab === "all" || invoice.status === tab)
    && (!term || [invoice.number, invoice.clientName, invoice.jobName, invoice.description].filter(Boolean).join(" ").toLowerCase().includes(term)));
  const due = invoices.filter((invoice) => invoice.status === "sent");
  const overdue = due.filter((invoice) => isInvoiceOverdue(invoice));
  const year = String(new Date().getFullYear());
  const paidThisYear = invoices.filter((invoice) => invoice.status === "paid" && invoice.paidAt?.startsWith(year));

  const setStatus = (invoice: Invoice, status: InvoiceStatus) =>
    updateDoc(doc(firebaseDb, INVOICES_COLLECTION, invoice.id), { status, paidAt: status === "paid" ? new Date().toISOString() : null, updatedAt: new Date().toISOString() })
      .then(() => {
        if (status !== "sent" || invoice.status === "sent") return;
        void sendAppEmail({ type: "invoice", invoiceId: invoice.id });
        void notify({ event: "invoice.sent", id: invoice.id });
      })
      .catch((cause) => console.error("Unable to update invoice", cause));

  const sorted = [...visible].sort((a, b) => sort === "client"
    ? (a.clientName ?? "").localeCompare(b.clientName ?? "")
    : sort === "due" ? (a.dueDate || "9999").localeCompare(b.dueDate || "9999")
    : (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt));
  const statusBadge = (invoice: Invoice) => <Badge tone={invoice.status === "paid" ? "neutral" : "active"}>{isInvoiceOverdue(invoice) ? "Overdue" : INVOICE_STATUS_LABELS[invoice.status]}</Badge>;
  return (
    <DashboardListPage
      title="Invoices"
      actions={<button type="button" onClick={() => setCreating(true)} className={LIST_ACTION_CLASS}><Plus aria-hidden="true" className="h-4 w-4" />Add</button>}
      toolbar={<>
        <div className="mt-4">
          <StatRow>
            <StatItem label="Due" value={invoiceTotals(due)} detail={plural(due.length, "invoice")} />
            <StatItem label="Overdue" value={invoiceTotals(overdue)} detail={plural(overdue.length, "invoice")} />
            <StatItem label={`Paid in ${year}`} value={invoiceTotals(paidThisYear)} detail={plural(paidThisYear.length, "invoice")} />
          </StatRow>
        </div>
        <FilterBar
          panelId="admin-invoices-filter"
          tabs={TABS}
          activeTab={tab}
          onTabChange={setTab}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search invoices"
          sortOptions={INVOICE_SORTS}
          activeSort={sort}
          onSortChange={setSort}
          resultCount={plural(visible.length, "invoice")}
          view={view}
          onViewChange={setView}
        />
      </>}
    >
      <section aria-label="Invoices">
        {sorted.length ? view === "cards" ? (
          <CardGrid>
            {sorted.map((invoice) => (
              <ListCard
                key={invoice.id}
                onActivate={() => setEditing(invoice)}
                title={`${invoice.number} · ${invoice.clientName}`}
                subtitle={updatedDate(invoice.updatedAt ?? invoice.createdAt)}
                menu={<CardMenu items={[
                  ...(invoice.status === "draft" ? [{ label: "Send to client", onSelect: () => void setStatus(invoice, "sent") }] : []),
                  ...(invoice.status === "sent" ? [{ label: "Mark paid", onSelect: () => void setStatus(invoice, "paid") }] : []),
                  { label: "Edit", onSelect: () => setEditing(invoice) },
                ]} />}
              />
            ))}
          </CardGrid>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((invoice) => (
                  <ClickableTableRow key={invoice.id} onActivate={() => setEditing(invoice)} label={`Edit invoice ${invoice.number}`}>
                    <TableCell><span className="block font-semibold">{invoice.clientName}</span><span className="mt-1 block text-sm text-muted-foreground">{invoice.number}</span></TableCell>
                    <TableCell className="text-muted-foreground">{invoice.jobName || "—"}</TableCell>
                    <TableCell>{statusBadge(invoice)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{updatedDate(invoice.updatedAt ?? invoice.createdAt)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatAmount(invoice.amount, invoice.currency)}</TableCell>
                    <TableActionsCell
                      primary={[
                        ...(invoice.status === "draft" ? [{ label: "Send to client", onSelect: () => void setStatus(invoice, "sent") }] : []),
                        ...(invoice.status === "sent" ? [{ label: "Mark paid", onSelect: () => void setStatus(invoice, "paid") }] : []),
                        { label: "Edit", icon: <Pencil className="h-4 w-4" />, onSelect: () => setEditing(invoice) },
                      ]}
                      label={`More actions for invoice ${invoice.number}`}
                    />
                  </ClickableTableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title={invoices.length ? "No invoices match" : "No invoices yet"} description={invoices.length ? "Try another search or status." : "Create an invoice to bill a client."} />
        )}
      </section>

      <InvoiceDialog open={creating || Boolean(editing)} onOpenChange={(open) => { if (!open) { setCreating(false); setEditing(null); } }} invoice={editing} existing={invoices} />
    </DashboardListPage>
  );
}
