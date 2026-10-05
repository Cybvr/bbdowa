import { redirect } from "next/navigation";

export default async function DashboardClientMoodboardRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/admin/clients/${encodeURIComponent(slug)}/jobs`);
}
