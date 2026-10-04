import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetail } from "@/components/job-detail";
import { getCampaignBySlug } from "@/lib/firebase/content";

type Params = { params: Promise<{ jobId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { jobId } = await params;
  const campaign = await getCampaignBySlug(jobId);
  return { title: campaign ? campaign.campaign ?? campaign.name : "Job not found" };
}

export default async function JobPage({ params }: Params) {
  const { jobId } = await params;
  const campaign = await getCampaignBySlug(jobId);
  if (!campaign) notFound();
  return <JobDetail campaign={campaign} />;
}
