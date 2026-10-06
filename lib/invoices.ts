import { formatAmount, type PaymentCurrency } from "@/lib/payments";

// Invoices are what we bill client companies. They're separate from
// `payments`, which are what we pay creators and staff.
export const INVOICES_COLLECTION = "invoices";

/** Draft: only staff see it. Sent: the client sees it. Paid: settled. */
export type InvoiceStatus = "draft" | "sent" | "paid";

export type Invoice = {
  id: string;
  /** Human-friendly number, e.g. INV-2026-0007. */
  number: string;
  clientId: string;
  clientName: string;
  jobId: string | null;
  jobName: string | null;
  description: string;
  amount: number;
  currency: PaymentCurrency;
  status: InvoiceStatus;
  /** YYYY-MM-DD. */
  issueDate: string;
  /** YYYY-MM-DD, or null. */
  dueDate: string | null;
  /** ISO timestamp for when it was marked paid. */
  paidAt: string | null;
  createdBy: string;
  createdAt: string;
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = { draft: "Draft", sent: "Due", paid: "Paid" };

/** The next number for this year, e.g. INV-2026-0008 when 0007 is the highest. */
export function nextInvoiceNumber(existing: Pick<Invoice, "number">[], year = new Date().getFullYear()): string {
  const prefix = `INV-${year}-`;
  const highest = existing.reduce((max, invoice) => {
    if (!invoice.number?.startsWith(prefix)) return max;
    const value = Number(invoice.number.slice(prefix.length));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, "0")}`;
}

/** Totals per currency, e.g. "NGN 750,000 · USD 300". */
export function invoiceTotals(invoices: Pick<Invoice, "amount" | "currency">[]): string {
  const totals = new Map<PaymentCurrency, number>();
  invoices.forEach((invoice) => totals.set(invoice.currency, (totals.get(invoice.currency) ?? 0) + invoice.amount));
  if (!totals.size) return formatAmount(0, "NGN");
  return [...totals].map(([currency, total]) => formatAmount(total, currency)).join(" · ");
}

export function isInvoiceOverdue(invoice: Pick<Invoice, "status" | "dueDate">, today = new Date().toISOString().slice(0, 10)): boolean {
  return invoice.status === "sent" && Boolean(invoice.dueDate) && invoice.dueDate! < today;
}
