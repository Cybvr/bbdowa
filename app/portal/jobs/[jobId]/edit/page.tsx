import { PortalJobForm } from "@/components/portal-job-form";

export default async function PortalEditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <PortalJobForm jobId={decodeURIComponent(jobId)} />;
}
