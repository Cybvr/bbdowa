import type { Metadata } from "next";
import { ClientsDirectory } from "@/components/clients-directory";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { getClients } from "@/lib/firebase/content";

export const metadata: Metadata = {
  title: "Clients",
  description: "Client accounts by date and industry.",
};

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <DashboardListPage title="Clients" createType="client">
      <ClientsDirectory clients={clients} />
    </DashboardListPage>
  );
}
