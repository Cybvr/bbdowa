import { CAMPAIGNS, type Campaign } from "@/lib/campaigns";
import { makeEmptyWorkspace, type ClientWorkspace } from "@/lib/client-workspaces";

export type Client = {
  type: "client";
  slug: string;
  name: string;
  /** First live/engagement date; used to sort the clients directory. */
  date: string | null;
  industry: string;
  /** Optional short bio shown on the client page; editable per client. */
  description?: string | null;
  /** Client logo/headshot; null/absent falls back to the placeholder. */
  profileImage?: string | null;
};

/**
 * Clients are their own records. A project belongs to one client
 * via its `clientId`; an client "has" the campaigns that point at
 * it (see `getClientCampaigns`). Edit a client here without
 * touching its campaigns, and vice versa.
 */
const CLIENT_RECORDS: Client[] = [
  {
    type: "client",
    slug: "bbdo-west-africa",
    name: "BBDO West Africa",
    date: null,
    industry: "Advertising",
    profileImage: "/bbdo-west-africa.png",
  },
  {
    type: "client",
    slug: "1utility",
    name: "1 Utility Bank",
    date: "2026-08-19",
    industry: "Finance",
    profileImage: "/images/one-utility-logo.svg",
  },
  {
    type: "client",
    slug: "benin-tourism",
    name: "Benin Tourism",
    date: "2026-05-15",
    industry: "Travel & tourism",
    profileImage: "/images/clients/benin-tourism.png",
  },
  {
    type: "client",
    slug: "brown-forman",
    name: "Brown-Forman",
    date: "2026-08-01",
    industry: "Food & beverages",
    profileImage: "/images/clients/brown-forman.png",
  },
  {
    type: "client",
    slug: "central-bank-of-nigeria",
    name: "Central Bank of Nigeria",
    date: "2026-08-15",
    industry: "Finance",
    profileImage: "/images/clients/central-bank-of-nigeria.png",
  },
  {
    type: "client",
    slug: "chicken-republic",
    name: "Chicken Republic",
    date: "2020-04-15",
    industry: "Food & beverages",
    profileImage: "/images/clients/chicken-republic.png",
  },
  {
    type: "client",
    slug: "diageo",
    name: "Diageo",
    date: "2021-07-15",
    industry: "Food & beverages",
    profileImage: "/images/clients/diageo.png",
  },
  {
    type: "client",
    slug: "google",
    name: "Google",
    date: "2020-06-15",
    industry: "Technology",
    profileImage: "/images/clients/google.png",
  },
  {
    type: "client",
    slug: "interswitch",
    name: "Interswitch",
    date: "2021-04-15",
    industry: "Finance",
    profileImage: "/images/clients/interswitch.png",
  },
  {
    type: "client",
    slug: "keizen-games",
    name: "Keizen Games",
    date: "2026-01-15",
    industry: "Entertainment",
    profileImage: "/images/clients/keizen-games.png",
  },
  {
    type: "client",
    slug: "orijin",
    name: "Orijin",
    date: "2019-09-15",
    industry: "Food & beverages",
    profileImage: "/images/clients/orijin.png",
  },
  {
    type: "client",
    slug: "pringles",
    name: "Pringles",
    date: "2018-07-15",
    industry: "Food & beverages",
    profileImage: "/images/clients/pringles.png",
  },
  {
    type: "client",
    slug: "proforce-nigeria",
    name: "Proforce Nigeria",
    date: "2026-03-15",
    industry: "Defence & manufacturing",
    profileImage: "/images/clients/proforce-nigeria.png",
  },
  {
    type: "client",
    slug: "unilever",
    name: "Unilever",
    date: "2026-02-15",
    industry: "Consumer goods",
    profileImage: "/images/clients/unilever.png",
  },
  {
    type: "client",
    slug: "visa",
    name: "Visa",
    date: "2016-08-05",
    industry: "Finance",
    profileImage: "/images/clients/visa.png",
  },
];

export const CLIENTS: Client[] = [...CLIENT_RECORDS].sort((a, b) => a.name.localeCompare(b.name));

export function getClient(slug: string, clients: Client[] = CLIENTS): Client | undefined {
  return clients.find((client) => client.slug === slug);
}

/** The campaigns that belong to this client. */
export function getClientCampaigns(slug: string, campaigns: Campaign[] = CAMPAIGNS): Campaign[] {
  return campaigns.filter((project) => project.clientId === slug);
}

/**
 * The workspace content for a client, assembled from the fields that live
 * directly on the client's project; clients/campaigns without curated content
 * get a blank template so nothing leaks in from another client.
 */
export function getClientWorkspace(
  clientSlug: string,
  clientName?: string,
  campaignsSource: Campaign[] = CAMPAIGNS,
): ClientWorkspace {
  const campaigns = getClientCampaigns(clientSlug, campaignsSource);
  const project = campaigns.find((item) => item.hasContent) ?? campaigns[0];
  const name = clientName ?? getClient(clientSlug)?.name ?? clientSlug;
  const website = project?.externalLinks?.find((link) => link.label === "Website")?.href ?? "";
  const empty = makeEmptyWorkspace({ clientName: name, category: project?.category ?? "", website });

  if (!project?.hasContent) return empty;

  return {
    preset: project.preset ?? empty.preset,
    strategyMarkdown: project.strategyMarkdown ?? empty.strategyMarkdown,
    phaseContent: project.phaseContent ?? empty.phaseContent,
    valueProposition: project.valueProposition ?? empty.valueProposition,
    palette: project.palette ?? empty.palette,
    primaryColor: project.primaryColor ?? empty.primaryColor,
    brandArchetype: project.brandArchetype ?? empty.brandArchetype,
    creatorSlugs: project.creatorSlugs ?? empty.creatorSlugs,
    moodboardImages: project.moodboardImages ?? empty.moodboardImages,
    campaignMediaPlans: project.campaignMediaPlans ?? empty.campaignMediaPlans,
    creativePreviews: project.creativePreviews ?? empty.creativePreviews,
    fontPreview: project.fontPreview ?? empty.fontPreview,
    overviewVideo: project.overviewVideo ?? empty.overviewVideo,
    hasContent: project.hasContent ?? empty.hasContent,
  };
}

export function clientHref(slug: string): string {
  return `/dashboard/clients/${slug}/overview`;
}
