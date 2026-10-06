import type { Metadata } from "next";
import { ClientAuth } from "@/components/client-auth";
import { ClientAuthFrame } from "@/components/client-auth-frame";

export const metadata: Metadata = { title: "Client sign in" };

export default function ClientLoginPage() {
  return <ClientAuthFrame><ClientAuth mode="signin" /></ClientAuthFrame>;
}
