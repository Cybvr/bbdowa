export const PAYMENTS_COLLECTION = "payments";

export type PaymentCurrency = "NGN" | "USD";
export type PaymentStatus = "pending" | "paid";

export type Payment = {
  id: string;
  /** Slug of the job (campaign) this payment belongs to, when applicable. */
  campaignId?: string | null;
  /** Firebase uid of the person being paid. */
  payeeUid: string;
  payeeName: string;
  amount: number;
  currency: PaymentCurrency;
  description: string;
  campaignName: string | null;
  status: PaymentStatus;
  /** YYYY-MM-DD the payment is due, or null. */
  dueDate: string | null;
  /** ISO timestamp for when it was marked paid. */
  paidAt: string | null;
  createdBy: string;
  createdAt: string;
};

export function formatAmount(amount: number, currency: PaymentCurrency): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

/** Sums per currency, joined, e.g. "₦250,000 · $400". */
export function formatTotals(payments: Payment[]): string {
  const totals = new Map<PaymentCurrency, number>();
  payments.forEach((payment) => totals.set(payment.currency, (totals.get(payment.currency) ?? 0) + payment.amount));
  if (totals.size === 0) return formatAmount(0, "NGN");
  return [...totals].map(([currency, total]) => formatAmount(total, currency)).join(" · ");
}
