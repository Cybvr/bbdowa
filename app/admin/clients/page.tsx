import type { Metadata } from "next";
import { ClientsDirectory } from "@/components/clients-directory";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { getClients, getJobs } from "@/lib/firebase/content";

export const metadata: Metadata = {
  title: "Clients",
  description: "Client accounts by date and industry.",
};

export default async function ClientsPage() {
  const [clients, jobs] = await Promise.all([getClients(), getJobs()]);

  return (
    <DashboardListPage title="Clients">
      <ClientsDirectory clients={clients} jobs={jobs} createType="client" />
    </DashboardListPage>
  );
}
