"use client";

import * as React from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Plus } from "lucide-react";
import { Badge, PageHeader, StatItem, StatRow } from "@/components/dashboard/ui";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
import { InvoiceDialog } from "@/components/invoice-dialog";
import { firebaseDb } from "@/lib/firebase/client";
import { sendAppEmail } from "@/lib/app-email";
import { longDate, plural } from "@/lib/format";
import { INVOICES_COLLECTION, INVOICE_STATUS_LABELS, invoiceTotals, isInvoiceOverdue, type Invoice, type InvoiceStatus } from "@/lib/invoices";
import { formatAmount } from "@/lib/payments";

const TABS: { key: "all" | InvoiceStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "sent", label: "Due" },
  { key: "paid", label: "Paid" },
];

/** Admin: every invoice we've raised to client companies. */
export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [tab, setTab] = React.useState<(typeof TABS)[number]["key"]>("all");
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<Invoice | null>(null);
  const [creating, setCreating] = React.useState(false);

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
    updateDoc(doc(firebaseDb, INVOICES_COLLECTION, invoice.id), { status, paidAt: status === "paid" ? new Date().toISOString() : null })
      .then(() => { if (status === "sent" && invoice.status !== "sent") void sendAppEmail({ type: "invoice", invoiceId: invoice.id }); })
      .catch((cause) => console.error("Unable to update invoice", cause));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-4 sm:px-8">
      <PageHeader
        title="Invoices"
        actions={<button type="button" onClick={() => setCreating(true)} className={LIST_ACTION_CLASS}><Plus aria-hidden="true" className="h-3.5 w-3.5" />New invoice</button>}
      />

      <div className="mt-4">
        <StatRow>
          <StatItem label="Due" value={invoiceTotals(due)} detail={plural(due.length, "invoice")} />
          <StatItem label="Overdue" value={invoiceTotals(overdue)} detail={plural(overdue.length, "invoice")} />
          <StatItem label={`Paid in ${year}`} value={invoiceTotals(paidThisYear)} detail={plural(paidThisYear.length, "invoice")} />
        </StatRow>
      </div>

      <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoices" aria-label="Search invoices" className="mt-5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/40" />
      <div className="mt-4 flex gap-5 overflow-x-auto border-b border-border" role="group" aria-label="Invoice status">
        {TABS.map((item) => (
          <button key={item.key} type="button" onClick={() => setTab(item.key)} aria-pressed={tab === item.key} className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-medium ${tab === item.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{item.label}</button>
        ))}
      </div>

      {visible.length ? (
        <ul className="m-0 mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">
          {visible.map((invoice) => (
            <li key={invoice.id} onClick={(event) => { if (!(event.target as HTMLElement).closest("button")) setEditing(invoice); }} className="cursor-pointer rounded-xl border border-border bg-background p-4 transition hover:border-foreground/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 truncate text-body font-semibold">{invoice.clientName}</p>
                  <p className="m-0 truncate text-sm text-muted-foreground">{invoice.number} · {invoice.description}</p>
                </div>
                <p className="m-0 shrink-0 text-body font-semibold tabular-nums">{formatAmount(invoice.amount, invoice.currency)}</p>
              </div>
              {invoice.jobName ? <p className="m-0 mt-1 truncate text-xs text-muted-foreground">{invoice.jobName}</p> : null}
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{invoice.dueDate ? `Due ${longDate(invoice.dueDate)}` : `Issued ${longDate(invoice.issueDate)}`}</span>
                <Badge tone={invoice.status === "paid" ? "neutral" : "active"}>{isInvoiceOverdue(invoice) ? "Overdue" : INVOICE_STATUS_LABELS[invoice.status]}</Badge>
              </div>
              <div className="mt-3 flex gap-4">
                {invoice.status === "draft" ? <button type="button" onClick={() => void setStatus(invoice, "sent")} className="text-xs font-semibold text-primary hover:underline">Send to client</button> : null}
                {invoice.status === "sent" ? <button type="button" onClick={() => void setStatus(invoice, "paid")} className="text-xs font-semibold text-primary hover:underline">Mark paid</button> : null}
                <button type="button" onClick={() => setEditing(invoice)} className="text-xs font-semibold text-foreground hover:underline">Edit</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="m-0 font-semibold">{invoices.length ? "No invoices match" : "No invoices yet"}</p>
          <p className="mb-0 mt-1 text-sm text-muted-foreground">{invoices.length ? "Try another search or status." : "Create an invoice to bill a client."}</p>
        </div>
      )}

      <InvoiceDialog open={creating || Boolean(editing)} onOpenChange={(open) => { if (!open) { setCreating(false); setEditing(null); } }} invoice={editing} existing={invoices} />
    </main>
  );
}
