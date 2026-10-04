import type { Metadata } from "next";
import { JobDetail } from "@/components/job-detail";

export const metadata: Metadata = { title: "Job" };

export default async function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <JobDetail jobId={jobId} />;
}
