import type { Metadata } from "next";
import { CampaignsTable } from "@/components/campaigns-table";
import { CAMPAIGNS } from "@/lib/campaigns";
import { PageHeader } from "@/components/dashboard/ui";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Browse live and completed BBDO West Africa campaigns.",
};

export default function CampaignsPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Campaigns" />
      <CampaignsTable campaigns={CAMPAIGNS} />
    </main>
  );
}
