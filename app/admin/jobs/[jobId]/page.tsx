import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetail } from "@/components/job-detail";
import { getJobBySlug } from "@/lib/firebase/content";

type Params = { params: Promise<{ jobId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getJobBySlug(jobId);
  if (!job) return { title: "Job not found" };
  return { title: job.title ?? job.name, description: job.summary };
}

export default async function AdminJobPage({ params }: Params) {
  const { jobId } = await params;
  const job = await getJobBySlug(jobId);
  if (!job) notFound();
  return <JobDetail job={job} adminMode />;
}
