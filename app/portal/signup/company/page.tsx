import type { Metadata } from "next";
import { CompanySetup } from "@/components/client-auth";
import { ClientAuthFrame } from "@/components/client-auth-frame";

export const metadata: Metadata = { title: "Set up your company" };

export default function CompanySetupPage() {
  return <ClientAuthFrame><CompanySetup /></ClientAuthFrame>;
}
