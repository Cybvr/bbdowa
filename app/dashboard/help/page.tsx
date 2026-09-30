import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/ui";
import { PageTabs, resolveTab } from "@/components/dashboard/page-tabs";
import { AboutSection } from "@/components/help/about-section";
import { CareersSection } from "@/components/help/careers-section";
import { GeneralSection } from "@/components/help/general-section";

export const metadata: Metadata = { title: "Help" };

const TABS = [
  { key: "general", label: "General" },
  { key: "about", label: "About" },
  { key: "careers", label: "Careers" },
] as const;

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function HelpPage({ searchParams }: Props) {
  const tab = resolveTab(TABS, (await searchParams).tab);

  return (
    <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
      <PageHeader title="Help" />
      <PageTabs basePath="/dashboard/help" tabs={TABS} active={tab} label="Help sections" />
      {tab === "about" ? <AboutSection /> : tab === "careers" ? <CareersSection /> : <GeneralSection />}
    </main>
  );
}
