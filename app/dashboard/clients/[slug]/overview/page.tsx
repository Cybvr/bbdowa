import { redirect } from "next/navigation";

export default async function DashboardClientOverviewRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/admin/clients/${encodeURIComponent(slug)}/overview`);
}
