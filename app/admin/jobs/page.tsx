import type { Metadata } from "next";
import { CampaignsTable } from "@/components/campaigns-table";
import { getCampaigns, getClients } from "@/lib/firebase/content";
import { DashboardListPage } from "@/components/dashboard/list-page";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Every client job, with its tasks, timesheets and payments.",
};

export default async function AdminJobsPage() {
  const [campaigns, clients] = await Promise.all([getCampaigns(), getClients()]);

  return (
    <DashboardListPage title="Jobs" createType="campaign">
      <CampaignsTable campaigns={campaigns} clients={clients} />
    </DashboardListPage>
  );
}
