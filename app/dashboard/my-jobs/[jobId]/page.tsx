import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetail } from "@/components/job-detail";
import { getJobBySlug } from "@/lib/firebase/content";
import { jobTitle } from "@/lib/jobs";

type Params = { params: Promise<{ jobId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getJobBySlug(jobId);
  return { title: job ? jobTitle(job) : "Job not found" };
}

export default async function MyJobPage({ params }: Params) {
  const { jobId } = await params;
  const job = await getJobBySlug(jobId);
  if (!job) notFound();
  return <JobDetail job={job} myJobs />;
}
