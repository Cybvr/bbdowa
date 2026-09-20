import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/ui";
import { ResourcesDirectory } from "@/components/resources-directory";
import { getResources } from "@/lib/firebase/content";

export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Resources" createType="resource" />
      <ResourcesDirectory resources={resources} />
    </main>
  );
}
