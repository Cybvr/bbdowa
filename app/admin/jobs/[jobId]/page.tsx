import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetail } from "@/components/job-detail";
import { getCampaignBySlug } from "@/lib/firebase/content";

type Params = { params: Promise<{ jobId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { jobId } = await params;
  const campaign = await getCampaignBySlug(jobId);
  if (!campaign) return { title: "Job not found" };
  return { title: campaign.campaign ?? campaign.name, description: campaign.summary };
}

export default async function AdminJobPage({ params }: Params) {
  const { jobId } = await params;
  const campaign = await getCampaignBySlug(jobId);
  if (!campaign) notFound();
  return <JobDetail campaign={campaign} adminMode />;
}
