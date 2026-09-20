import type { Metadata } from "next";
import { CampaignsTable } from "@/components/campaigns-table";
import { getCampaigns } from "@/lib/firebase/content";
import { PageHeader } from "@/components/dashboard/ui";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Browse live and completed BBDO West Africa campaigns.",
};

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Campaigns" createType="campaign" />
      <CampaignsTable campaigns={campaigns} />
    </main>
  );
}
