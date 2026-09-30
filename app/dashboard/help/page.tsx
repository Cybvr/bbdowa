import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/ui";
import { AboutSection } from "@/components/help/about-section";
import { CareersSection } from "@/components/help/careers-section";
import { GeneralSection } from "@/components/help/general-section";

export const metadata: Metadata = { title: "Help" };

const TABS = [
  { key: "general", label: "General" },
  { key: "about", label: "About" },
  { key: "careers", label: "Careers" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function HelpPage({ searchParams }: Props) {
  const { tab: requested } = await searchParams;
  const tab: TabKey = TABS.some((entry) => entry.key === requested) ? (requested as TabKey) : "general";

  return (
    <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
      <PageHeader title="Help" />

      <nav className="mb-6 mt-4 flex items-center gap-5 border-b border-border" aria-label="Help sections">
        {TABS.map((entry) => (
          <Link
            key={entry.key}
            href={entry.key === "general" ? "/dashboard/help" : `/dashboard/help?tab=${entry.key}`}
            aria-current={tab === entry.key ? "page" : undefined}
            className={`-mb-px border-b-2 px-0.5 pb-2 text-[13px] font-semibold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              tab === entry.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      {tab === "about" ? <AboutSection /> : tab === "careers" ? <CareersSection /> : <GeneralSection />}
    </main>
  );
}
