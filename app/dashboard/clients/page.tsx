import type { Metadata } from "next";
import { ClientsDirectory } from "@/components/clients-directory";
import { PageHeader } from "@/components/dashboard/ui";
import { ORGANIZATIONS } from "@/lib/organizations";

export const metadata: Metadata = {
  title: "Clients",
  description: "Client accounts by date and industry.",
};

export default function ClientsPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Clients" />
      <ClientsDirectory clients={ORGANIZATIONS} />
    </main>
  );
}
