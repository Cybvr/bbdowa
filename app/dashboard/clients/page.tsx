import type { Metadata } from "next";
import { ClientsDirectory } from "@/components/clients-directory";
import { PageHeader } from "@/components/dashboard/ui";
import { CAMPAIGNS } from "@/lib/campaigns";
import { CLIENTS } from "@/lib/users";

export const metadata: Metadata = {
  title: "Clients",
  description: "Clients and their campaigns.",
};

export default function ClientsPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Clients" description="Clients and their campaigns." />
      <ClientsDirectory clients={CLIENTS} campaigns={CAMPAIGNS} />
    </main>
  );
}
