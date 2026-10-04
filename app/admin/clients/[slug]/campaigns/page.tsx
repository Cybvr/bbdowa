import { redirect } from "next/navigation";

type Params = { params: Promise<{ slug: string }> };

export default async function ClientCampaignsPage({ params }: Params) {
  const { slug } = await params;
  redirect(`/admin/clients/${slug}/jobs`);
}
