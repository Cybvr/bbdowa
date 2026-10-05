import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetail } from "@/components/job-detail";
import { getJobBySlug } from "@/lib/firebase/content";
import { jobDisplayTitle } from "@/lib/jobs";
import { richTextToPlainText } from "@/lib/rich-text";
import { pageMetadata } from "@/lib/metadata";

type Params = { params: Promise<{ jobId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getJobBySlug(jobId);
  if (!job) return pageMetadata("Job not found", "This job could not be found.", `/admin/jobs/${encodeURIComponent(jobId)}`);
  return pageMetadata(jobDisplayTitle(job), richTextToPlainText(job.summary), `/admin/jobs/${encodeURIComponent(jobId)}`);
}

export default async function AdminJobPage({ params }: Params) {
  const { jobId } = await params;
  const job = await getJobBySlug(jobId);
  if (!job) notFound();
  return <JobDetail job={job} adminMode />;
}
