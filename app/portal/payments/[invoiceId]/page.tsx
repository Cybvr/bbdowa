import { PortalInvoiceDetail } from "@/components/portal-invoices";

export default async function PortalInvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  return <PortalInvoiceDetail invoiceId={invoiceId} />;
}
