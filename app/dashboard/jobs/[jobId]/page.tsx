import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetail } from "@/components/job-detail";
import { getJobBySlug } from "@/lib/firebase/content";
import { jobTitle } from "@/lib/jobs";
import { pageMetadata } from "@/lib/metadata";
import { richTextToPlainText } from "@/lib/rich-text";

type Params = { params: Promise<{ jobId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getJobBySlug(jobId);
  if (!job) return pageMetadata("Job not found", "This job could not be found.", `/dashboard/jobs/${encodeURIComponent(jobId)}`);
  return pageMetadata(jobTitle(job), richTextToPlainText(job.summary), `/dashboard/jobs/${encodeURIComponent(jobId)}`);
}

export default async function JobPage({ params }: Params) {
  const { jobId } = await params;
  const job = await getJobBySlug(jobId);
  if (!job) notFound();
  return <JobDetail job={job} overviewOnly />;
}
