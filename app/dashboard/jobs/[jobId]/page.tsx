import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetail } from "@/components/job-detail";
import { getJobBySlug } from "@/lib/firebase/content";

type Params = { params: Promise<{ jobId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getJobBySlug(jobId);
  return { title: job ? job.title ?? job.name : "Job not found" };
}

export default async function JobPage({ params }: Params) {
  const { jobId } = await params;
  const job = await getJobBySlug(jobId);
  if (!job) notFound();
  return <JobDetail job={job} />;
}
