import type { Metadata } from "next";
import { PaymentDetail } from "@/components/payment-detail";

export const metadata: Metadata = { title: "Payment" };

export default async function PaymentPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  return <PaymentDetail paymentId={paymentId} />;
}
