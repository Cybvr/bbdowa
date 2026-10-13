import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function WorkflowsPage({ searchParams }: Props) {
  const tab = (await searchParams).tab;
  redirect(tab === "pitch" ? "/dashboard/help?tab=workflows&view=pitch" : "/dashboard/help?tab=workflows");
}
