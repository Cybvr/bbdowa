import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/ui";
import { AboutSection } from "@/components/help/about-section";
import { BRAND_SECTIONS, BrandSection } from "@/components/help/brand-section";
import { CareersSection } from "@/components/help/careers-section";
import { GeneralSection, HELP_TOPICS } from "@/components/help/general-section";
import { HelpGuide, type HelpArticle } from "@/components/help/help-guide";
import { ResourcesSection } from "@/components/help/resources-section";
import { TeamSection } from "@/components/help/team-section";
import { WORKFLOWS, WorkflowsSection } from "@/components/help/workflows-section";
import { getOpenings, getResources } from "@/lib/firebase/content";
import { openingHref } from "@/lib/openings";

export const metadata: Metadata = { title: "Help" };

const SECTION_LABELS = {
  general: "General",
  workflows: "Workflows",
  team: "Team",
  resources: "Resources",
  brand: "Brand assets",
  about: "About",
  careers: "Careers",
} as const;

type SectionKey = keyof typeof SECTION_LABELS;

const ABOUT_HEADINGS = ["Akwaaba", "Mission", "Vision", "Who we are", "What we do", "How we work", "The numbers"];

type Props = { searchParams: Promise<{ tab?: string; view?: string }> };

const TEAM_HEADINGS = ["Agency organogram", "The client pod", "Shared capability network"];

export default async function HelpPage({ searchParams }: Props) {
  const { tab: requested, view } = await searchParams;
  const tab = requested && requested in SECTION_LABELS ? (requested as SectionKey) : null;

  if (tab) {
    return (
      <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
        <Link href="/dashboard/help" className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />Help Guide
        </Link>
        <div className="mt-4 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
          <nav aria-label="Help pages" className="lg:sticky lg:top-6 lg:self-start">
            <ul className="m-0 flex list-none gap-1 overflow-x-auto p-0 lg:flex-col">
              {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
                <li key={key}>
                  <Link
                    href={`/dashboard/help?tab=${key}`}
                    aria-current={key === tab ? "page" : undefined}
                    className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm no-underline transition ${key === tab ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    {SECTION_LABELS[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-w-0">
            <PageHeader title={SECTION_LABELS[tab]} />
            {tab === "workflows" ? <WorkflowsSection view={view} />
              : tab === "team" ? <TeamSection />
              : tab === "resources" ? <ResourcesSection />
              : tab === "brand" ? <BrandSection />
              : tab === "about" ? <AboutSection />
              : tab === "careers" ? <CareersSection />
              : <GeneralSection />}
          </div>
        </div>
      </main>
    );
  }

  const [resources, openings] = await Promise.all([getResources(), getOpenings()]);
  const groups: Record<SectionKey, HelpArticle[]> = {
    general: HELP_TOPICS.map((topic) => ({ title: topic.title, section: SECTION_LABELS.general, href: topic.href })),
    workflows: WORKFLOWS.map((item) => ({ title: item.label, section: SECTION_LABELS.workflows, href: item.key === "pitch" ? "/dashboard/help?tab=workflows&view=pitch" : "/dashboard/help?tab=workflows" })),
    team: TEAM_HEADINGS.map((heading) => ({ title: heading, section: SECTION_LABELS.team, href: "/dashboard/help?tab=team" })),
    resources: resources.map((resource) => ({ title: resource.label, section: SECTION_LABELS.resources, href: resource.href || "/dashboard/help?tab=resources" })),
    brand: BRAND_SECTIONS.map((section) => ({ title: section.label, section: SECTION_LABELS.brand, href: `/dashboard/help?tab=brand#${section.id}` })),
    about: ABOUT_HEADINGS.map((heading) => ({ title: heading, section: SECTION_LABELS.about, href: "/dashboard/help?tab=about" })),
    careers: openings.map((opening) => ({ title: opening.title, section: SECTION_LABELS.careers, href: openingHref(opening.slug) })),
  };
  const sections = (Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => ({ key, label: SECTION_LABELS[key], count: groups[key].length }));

  return (
    <main className="flex-1 bg-muted px-5 pb-16 pt-4 sm:px-8">
      <HelpGuide sections={sections} articles={Object.values(groups).flat()} popular={groups.general} />
    </main>
  );
}
