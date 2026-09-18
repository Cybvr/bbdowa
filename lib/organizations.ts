import { PROJECTS } from "@/lib/projects";

export type Organization = {
  type: "organization";
  slug: string;
  name: string;
  date: string | null;
  industry: string;
  profileImage?: string | null;
  projectSlugs: string[];
};

const ORGANIZATION_PROFILE_IMAGES: Record<string, string> = {
  "1utility": "/images/one-utility-logo.svg",
  "benin-tourism": "/images/clients/benin-tourism.png",
  "brown-forman": "/images/clients/brown-forman.png",
  "central-bank-of-nigeria": "/images/clients/central-bank-of-nigeria.png",
  "chicken-republic": "/images/clients/chicken-republic.png",
  "diageo": "/images/clients/diageo.png",
  "google": "/images/clients/google.png",
  "interswitch": "/images/clients/interswitch.png",
  "keizen-games": "/images/clients/keizen-games.png",
  "orijin": "/images/clients/orijin.png",
  "pringles": "/images/clients/pringles.png",
  "proforce-nigeria": "/images/clients/proforce-nigeria.png",
  "unilever": "/images/clients/unilever.png",
  "visa": "/images/clients/visa.png",
};

export const ORGANIZATIONS: Organization[] = Array.from(
  new Map(
    PROJECTS.map((project) => [
      project.organizationId,
      {
        type: "organization" as const,
        slug: project.organizationId,
        name: project.organizationName,
        date: project.liveAt?.date ?? null,
        industry: project.category,
        profileImage: ORGANIZATION_PROFILE_IMAGES[project.organizationId] ?? null,
        projectSlugs: PROJECTS.filter((item) => item.organizationId === project.organizationId).map(
          (item) => item.slug,
        ),
      },
    ]),
  ).values(),
).sort((a, b) => a.name.localeCompare(b.name));

export function getOrganization(slug: string): Organization | undefined {
  return ORGANIZATIONS.find((organization) => organization.slug === slug);
}

export function organizationHref(slug: string): string {
  return `/dashboard/clients/${slug}/overview`;
}
