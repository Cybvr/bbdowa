import { PortalJobDetail } from "@/components/portal-job-detail";

export default async function PortalJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <PortalJobDetail jobId={decodeURIComponent(jobId)} />;
}
