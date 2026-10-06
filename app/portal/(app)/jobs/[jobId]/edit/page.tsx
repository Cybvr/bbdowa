import { redirect } from "next/navigation";

export default async function PortalEditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  redirect(`/portal/jobs/${encodeURIComponent(decodeURIComponent(jobId))}`);
}
