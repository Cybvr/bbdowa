import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/ui";
import { ABOUT_HEADINGS, AboutSection } from "@/components/help/about-section";
import { BANTABA_HEADINGS, BantabaSection } from "@/components/help/bantaba-section";
import { BRAND_SECTIONS } from "@/components/help/brand-section";
import { CareersSection } from "@/components/help/careers-section";
import { CASERS_HEADINGS, CasersSection } from "@/components/help/casers-section";
import { FAQS, FaqsSection } from "@/components/help/faqs-section";
import { FEATURES, FeaturesSection } from "@/components/help/features-section";
import { HelpGuide, type HelpArticle } from "@/components/help/help-guide";
import { ResourcesSection } from "@/components/help/resources-section";
import { TeamSection } from "@/components/help/team-section";
import { WORKFLOWS, WorkflowsSection } from "@/components/help/workflows-section";
import { getOpenings, getResources } from "@/lib/firebase/content";
import { openingHref } from "@/lib/openings";

export const metadata: Metadata = { title: "Help" };

// The guide runs from the platform (Bantaba and its features) out to the
// company (BBDO West Africa, Casers Group, the team), then reference material.
const SECTION_LABELS = {
  bantaba: "About Bantaba",
  features: "Features",
  workflows: "How we work",
  about: "About BBDO West Africa",
  casers: "About Casers Group",
  team: "The team",
  resources: "Resources",
  careers: "Careers",
  faqs: "FAQs",
} as const;

type SectionKey = keyof typeof SECTION_LABELS;

/** Old tab names, kept so existing links still land in the right place. */
const OLD_TABS: Record<string, string> = {
  general: "/dashboard/help?tab=features",
  brand: "/dashboard/help?tab=resources&view=brand",
};

const TEAM_HEADINGS = ["Agency organogram", "The client pod", "Shared capability network"];

type Props = { searchParams: Promise<{ tab?: string; view?: string }> };

export default async function HelpPage({ searchParams }: Props) {
  const { tab: requested, view } = await searchParams;
  if (requested && OLD_TABS[requested]) redirect(OLD_TABS[requested]);
  const tab = requested && requested in SECTION_LABELS ? (requested as SectionKey) : null;

  if (tab) {
    return (
      <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
        <Link href="/dashboard/help" className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />Help Guide
        </Link>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
          {/* Phones: the section tabs scroll sideways inside their own row, edge to edge. */}
          <nav aria-label="Help pages" className="-mx-5 min-w-0 sm:-mx-8 lg:sticky lg:top-6 lg:mx-0 lg:self-start">
            <ul className="m-0 flex list-none gap-1 overflow-x-auto px-5 py-0 [scrollbar-width:none] sm:px-8 lg:flex-col lg:px-0">
              <li>
                <Link href="/dashboard/help" className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted-foreground no-underline transition hover:bg-muted hover:text-foreground">
                  Home
                </Link>
              </li>
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
            {tab === "bantaba" ? <BantabaSection />
              : tab === "workflows" ? <WorkflowsSection view={view} />
              : tab === "about" ? <AboutSection />
              : tab === "casers" ? <CasersSection />
              : tab === "team" ? <TeamSection />
              : tab === "resources" ? <ResourcesSection view={view} />
              : tab === "careers" ? <CareersSection />
              : tab === "faqs" ? <FaqsSection />
              : <FeaturesSection />}
          </div>
        </div>
      </main>
    );
  }

  const [resources, openings] = await Promise.all([getResources(), getOpenings()]);
  const at = (key: SectionKey, title: string, href = `/dashboard/help?tab=${key}`): HelpArticle => ({ title, section: SECTION_LABELS[key], href });
  const groups: Record<SectionKey, HelpArticle[]> = {
    bantaba: BANTABA_HEADINGS.map((heading) => at("bantaba", heading)),
    features: FEATURES.map((feature) => at("features", feature.title)),
    workflows: WORKFLOWS.map((item) => at("workflows", item.label, item.key === "pitch" ? "/dashboard/help?tab=workflows&view=pitch" : "/dashboard/help?tab=workflows")),
    about: ABOUT_HEADINGS.map((heading) => at("about", heading)),
    casers: CASERS_HEADINGS.map((heading) => at("casers", heading)),
    team: TEAM_HEADINGS.map((heading) => at("team", heading)),
    resources: [
      ...resources.map((resource) => at("resources", resource.label, resource.href || "/dashboard/help?tab=resources")),
      ...BRAND_SECTIONS.map((section) => at("resources", `Brand: ${section.label}`, `/dashboard/help?tab=resources&view=brand#${section.id}`)),
    ],
    careers: openings.map((opening) => at("careers", opening.title, openingHref(opening.slug))),
    faqs: FAQS.map((faq) => at("faqs", faq.question)),
  };
  const sections = (Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => ({ key, label: SECTION_LABELS[key], count: groups[key].length }));

  return (
    <main className="flex-1 bg-muted px-5 pb-16 pt-4 sm:px-8">
      <HelpGuide sections={sections} articles={Object.values(groups).flat()} popular={[...groups.bantaba, ...groups.features.slice(0, 4)]} />
    </main>
  );
}
