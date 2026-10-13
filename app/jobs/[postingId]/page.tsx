import type { Metadata } from "next";
import { JobPostingPage } from "@/components/job-posting-page";

type Params = { params: Promise<{ postingId: string }> };

// Shared job links. Public and brandless: no sign-in needed to read or start applying.
export const metadata: Metadata = {
  title: "Open job — BBDO West Africa",
  robots: { index: false, follow: false },
};

export default async function PublicJobPostingPage({ params }: Params) {
  const { postingId } = await params;
  return <JobPostingPage postingId={postingId} />;
}
