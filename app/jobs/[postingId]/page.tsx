import type { Metadata } from "next";
import { JobPostingPage } from "@/components/job-posting-page";
import { getJobPostingHeadline } from "@/lib/firebase/content";

type Params = { params: Promise<{ postingId: string }> };

// Shared job links. Public and brandless: no sign-in needed to read or start applying.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { postingId } = await params;
  const headline = await getJobPostingHeadline(postingId);
  return {
    title: headline ?? "Open job",
    robots: { index: false, follow: false },
  };
}

export default async function PublicJobPostingPage({ params }: Params) {
  const { postingId } = await params;
  return <JobPostingPage postingId={postingId} />;
}
