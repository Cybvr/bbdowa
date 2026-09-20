import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCampaignBySlug } from "@/lib/firebase/content";
import { CampaignDetail } from "@/components/campaign-detail";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return { title: "Campaign not found" };
  return { title: campaign.campaign ?? campaign.name, description: campaign.summary };
}

export default async function CampaignDetailPage({ params }: Params) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  return <CampaignDetail campaign={campaign} />;
}
