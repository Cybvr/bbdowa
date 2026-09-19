import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/ui";
import { ResourcesDirectory } from "@/components/resources-directory";

export const metadata: Metadata = { title: "Resources" };

export default function ResourcesPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Resources" />
      <ResourcesDirectory />
    </main>
  );
}
