import type { Metadata } from "next";
import { CampaignsTable } from "@/components/campaigns-table";
import { getCampaigns, getClients } from "@/lib/firebase/content";
import { DashboardListPage } from "@/components/dashboard/list-page";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Browse live and completed BBDO West Africa campaigns.",
};

export default async function CampaignsPage() {
  const [campaigns, clients] = await Promise.all([getCampaigns(), getClients()]);

  return (
    <DashboardListPage title="Campaigns" createType="campaign">
      <CampaignsTable campaigns={campaigns} clients={clients} />
    </DashboardListPage>
  );
}
