"use client";

import * as React from "react";
import Link from "next/link";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import { Badge, StatItem, StatRow } from "@/components/dashboard/ui";
import { usePortalClient } from "@/components/portal-shell";
import { firebaseDb } from "@/lib/firebase/client";
import { longDate, plural } from "@/lib/format";
import { INVOICES_COLLECTION, INVOICE_STATUS_LABELS, invoiceTotals, isInvoiceOverdue, type Invoice } from "@/lib/invoices";
import { formatAmount } from "@/lib/payments";

const statusLabel = (invoice: Invoice) => (isInvoiceOverdue(invoice) ? "Overdue" : INVOICE_STATUS_LABELS[invoice.status]);

/** The client's invoices: what's due and what's been paid. Drafts never show. */
export function PortalInvoices() {
  const portal = usePortalClient();
  const [invoices, setInvoices] = React.useState<Invoice[] | null>(null);
  const clientId = portal?.clientId;

  React.useEffect(() => {
    if (!clientId) return;
    return onSnapshot(
      query(collection(firebaseDb, INVOICES_COLLECTION), where("clientId", "==", clientId), where("status", "in", ["sent", "paid"])),
      (snapshot) => setInvoices(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Invoice).sort((a, b) => b.issueDate.localeCompare(a.issueDate))),
      (cause) => {
        console.error("Unable to load invoices", cause);
        setInvoices([]);
      },
    );
  }, [clientId]);

  const due = (invoices ?? []).filter((invoice) => invoice.status === "sent");
  const paid = (invoices ?? []).filter((invoice) => invoice.status === "paid");

  return (
    <div>
      <h1 className="m-0 text-page-title font-bold max-nav:hidden sm:text-page-title-lg">Payments</h1>
      <div className="mt-4 max-nav:mt-0">
        <StatRow>
          <StatItem label="Due" value={invoiceTotals(due)} detail={plural(due.length, "invoice")} />
          <StatItem label="Paid" value={invoiceTotals(paid)} detail={plural(paid.length, "invoice")} />
          <StatItem label="All invoices" value={invoices ? invoices.length : "–"} />
        </StatRow>
      </div>

      {invoices === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : invoices.length ? (
        <ul className="m-0 mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link href={`/portal/payments/${invoice.id}`} className="block rounded-xl border border-border bg-background p-4 text-foreground no-underline transition hover:border-foreground/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 truncate text-body font-semibold">{invoice.description}</p>
                    <p className="m-0 truncate text-sm text-muted-foreground">{invoice.number}{invoice.jobName ? ` · ${invoice.jobName}` : ""}</p>
                  </div>
                  <p className="m-0 shrink-0 text-body font-semibold tabular-nums">{formatAmount(invoice.amount, invoice.currency)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">{invoice.status === "paid" && invoice.paidAt ? `Paid ${longDate(invoice.paidAt.slice(0, 10))}` : invoice.dueDate ? `Due ${longDate(invoice.dueDate)}` : `Issued ${longDate(invoice.issueDate)}`}</span>
                  <Badge tone={invoice.status === "paid" ? "neutral" : "active"}>{statusLabel(invoice)}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="m-0 font-semibold">No invoices yet</p>
          <p className="mb-0 mt-1 text-sm text-muted-foreground">Invoices for your jobs will show here.</p>
        </div>
      )}
    </div>
  );
}

/** Invoices for one job, shown in the shared job detail's Payments tab. */
export function PortalJobInvoices({ jobId }: { jobId: string }) {
  const portal = usePortalClient();
  const [invoices, setInvoices] = React.useState<Invoice[] | null>(null);
  const clientId = portal?.clientId;

  React.useEffect(() => {
    if (!clientId) return;
    return onSnapshot(
      query(collection(firebaseDb, INVOICES_COLLECTION), where("clientId", "==", clientId), where("status", "in", ["sent", "paid"])),
      (snapshot) => setInvoices(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Invoice).filter((invoice) => invoice.jobId === jobId).sort((a, b) => b.issueDate.localeCompare(a.issueDate))),
      (cause) => { console.error("Unable to load job invoices", cause); setInvoices([]); },
    );
  }, [clientId, jobId]);

  return <section className="pt-6">
    <h2 className="m-0 text-item-title font-semibold">Payments</h2>
    {invoices === null ? <p className="mt-4 text-sm text-muted-foreground">Loading…</p> : invoices.length ? <ul className="m-0 mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">{invoices.map((invoice) => <li key={invoice.id}><Link href={`/portal/payments/${invoice.id}`} className="block rounded-xl border border-border bg-background p-4 text-foreground no-underline hover:border-foreground/30"><div className="flex items-start justify-between gap-3"><div><p className="m-0 font-semibold">{invoice.description}</p><p className="m-0 mt-1 text-sm text-muted-foreground">{invoice.number} · {statusLabel(invoice)}</p></div><span className="shrink-0 font-semibold tabular-nums">{formatAmount(invoice.amount, invoice.currency)}</span></div></Link></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No invoices for this job yet.</p>}
  </section>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-1.5 text-body">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 break-words font-medium">{children}</dd>
    </div>
  );
}

/** One invoice, as the client sees it. */
export function PortalInvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const portal = usePortalClient();
  const [invoice, setInvoice] = React.useState<Invoice | null | undefined>(undefined);

  React.useEffect(() => {
    let active = true;
    getDoc(doc(firebaseDb, INVOICES_COLLECTION, invoiceId))
      .then((snapshot) => { if (active) setInvoice(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Invoice) : null); })
      .catch(() => { if (active) setInvoice(null); });
    return () => { active = false; };
  }, [invoiceId]);

  const back = <Link href="/portal/payments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Payments</Link>;
  if (invoice === undefined) return <div>{back}<p className="mt-6 text-sm text-muted-foreground">Loading…</p></div>;
  if (!invoice || invoice.clientId !== portal?.clientId || invoice.status === "draft") return <div>{back}<p className="mt-6 text-sm text-muted-foreground">This invoice doesn’t exist or isn’t yours.</p></div>;

  return (
    <div className="grid gap-3">
      {back}
      <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
        <p className="m-0 text-sm text-muted-foreground">{invoice.number}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-page-title font-semibold tabular-nums">{formatAmount(invoice.amount, invoice.currency)}</p>
          <Badge tone={invoice.status === "paid" ? "neutral" : "active"}>{statusLabel(invoice)}</Badge>
        </div>
        <p className="mb-0 mt-2 text-body">{invoice.description}</p>
      </section>
      <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
        <h2 className="m-0 text-item-title font-semibold">Details</h2>
        <dl className="m-0 mt-3">
          <Row label="Invoice">{invoice.number}</Row>
          <Row label="Issued">{longDate(invoice.issueDate)}</Row>
          <Row label="Due">{invoice.dueDate ? longDate(invoice.dueDate) : "—"}</Row>
          <Row label="Paid on">{invoice.paidAt ? longDate(invoice.paidAt.slice(0, 10)) : "—"}</Row>
          <Row label="Job">{invoice.jobId ? <Link href={`/portal/jobs/${encodeURIComponent(invoice.jobId)}`} className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">{invoice.jobName ?? "View job"}</Link> : "—"}</Row>
        </dl>
      </section>
    </div>
  );
}
