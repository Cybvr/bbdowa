import type { Metadata } from "next";
import { ClientAuth } from "@/components/client-auth";
import { ClientAuthFrame } from "@/components/client-auth-frame";

export const metadata: Metadata = { title: "Create a client account" };

export default function ClientSignupPage() {
  return <ClientAuthFrame><ClientAuth mode="signup" /></ClientAuthFrame>;
}
