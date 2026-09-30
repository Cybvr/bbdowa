import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/ui";
import { PageTabs, resolveTab } from "@/components/dashboard/page-tabs";
import { PitchChecklist } from "@/components/pitch-checklist";
import { AgencyWorkflow } from "@/components/workflows/agency-workflow";

export const metadata: Metadata = { title: "Workflows" };

const TABS = [
  { key: "agency", label: "Agency" },
  { key: "pitch", label: "Pitch" },
] as const;

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function WorkflowsPage({ searchParams }: Props) {
  const tab = resolveTab(TABS, (await searchParams).tab);

  return (
    <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
      <PageHeader title="Workflows" />
      <PageTabs basePath="/dashboard/workflows" tabs={TABS} active={tab} label="Workflows" />
      {tab === "pitch" ? <PitchChecklist /> : <AgencyWorkflow />}
    </main>
  );
}
