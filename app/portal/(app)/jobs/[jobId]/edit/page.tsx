import { redirect } from "next/navigation";

// Jobs are edited on the job page itself now.
export default async function PortalEditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  redirect(`/portal/jobs/${jobId}`);
}
