import { PROJECTS, type Project } from "@/lib/projects";

export type Organization = {
  type: "organization";
  slug: string;
  name: string;
  /** First live/engagement date; used to sort the clients directory. */
  date: string | null;
  industry: string;
  /** Optional short bio shown on the client page; editable per organization. */
  description?: string | null;
  /** Client logo/headshot; null/absent falls back to the placeholder. */
  profileImage?: string | null;
};

/**
 * Organizations are their own records. A project belongs to one organization
 * via its `organizationId`; an organization "has" the projects that point at
 * it (see `getOrganizationProjects`). Edit an organization here without
 * touching its projects, and vice versa.
 */
export const ORGANIZATIONS: Organization[] = [
  {
    type: "organization",
    slug: "1utility",
    name: "1 Utility Bank",
    date: "2026-08-19",
    industry: "Finance",
    profileImage: "/images/one-utility-logo.svg",
  },
  {
    type: "organization",
    slug: "benin-tourism",
    name: "Benin Tourism",
    date: "2026-05-15",
    industry: "Travel & tourism",
    profileImage: "/images/clients/benin-tourism.png",
  },
  {
    type: "organization",
    slug: "brown-forman",
    name: "Brown-Forman",
    date: "2026-08-01",
    industry: "Food & beverages",
    profileImage: "/images/clients/brown-forman.png",
  },
  {
    type: "organization",
    slug: "central-bank-of-nigeria",
    name: "Central Bank of Nigeria",
    date: "2026-08-15",
    industry: "Finance",
    profileImage: "/images/clients/central-bank-of-nigeria.png",
  },
  {
    type: "organization",
    slug: "chicken-republic",
    name: "Chicken Republic",
    date: "2020-04-15",
    industry: "Food & beverages",
    profileImage: "/images/clients/chicken-republic.png",
  },
  {
    type: "organization",
    slug: "diageo",
    name: "Diageo",
    date: "2021-07-15",
    industry: "Food & beverages",
    profileImage: "/images/clients/diageo.png",
  },
  {
    type: "organization",
    slug: "google",
    name: "Google",
    date: "2020-06-15",
    industry: "Technology",
    profileImage: "/images/clients/google.png",
  },
  {
    type: "organization",
    slug: "interswitch",
    name: "Interswitch",
    date: "2021-04-15",
    industry: "Finance",
    profileImage: "/images/clients/interswitch.png",
  },
  {
    type: "organization",
    slug: "keizen-games",
    name: "Keizen Games",
    date: "2026-01-15",
    industry: "Entertainment",
    profileImage: "/images/clients/keizen-games.png",
  },
  {
    type: "organization",
    slug: "orijin",
    name: "Orijin",
    date: "2019-09-15",
    industry: "Food & beverages",
    profileImage: "/images/clients/orijin.png",
  },
  {
    type: "organization",
    slug: "pringles",
    name: "Pringles",
    date: "2018-07-15",
    industry: "Food & beverages",
    profileImage: "/images/clients/pringles.png",
  },
  {
    type: "organization",
    slug: "proforce-nigeria",
    name: "Proforce Nigeria",
    date: "2026-03-15",
    industry: "Defence & manufacturing",
    profileImage: "/images/clients/proforce-nigeria.png",
  },
  {
    type: "organization",
    slug: "unilever",
    name: "Unilever",
    date: "2026-02-15",
    industry: "Consumer goods",
    profileImage: "/images/clients/unilever.png",
  },
  {
    type: "organization",
    slug: "visa",
    name: "Visa",
    date: "2016-08-05",
    industry: "Finance",
    profileImage: "/images/clients/visa.png",
  },
].sort((a, b) => a.name.localeCompare(b.name));

export function getOrganization(slug: string): Organization | undefined {
  return ORGANIZATIONS.find((organization) => organization.slug === slug);
}

/** The projects that belong to this organization. */
export function getOrganizationProjects(slug: string): Project[] {
  return PROJECTS.filter((project) => project.organizationId === slug);
}

export function organizationHref(slug: string): string {
  return `/dashboard/clients/${slug}/overview`;
}
