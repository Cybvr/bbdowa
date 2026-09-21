import type { Metadata } from "next";
import { ClientsDirectory } from "@/components/clients-directory";
import { PageHeader } from "@/components/dashboard/ui";
import { getClients } from "@/lib/firebase/content";

export const metadata: Metadata = {
  title: "Clients",
  description: "Client accounts by date and industry.",
};

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
      <PageHeader title="Clients" createType="client" />
      <ClientsDirectory clients={clients} />
    </main>
  );
}
