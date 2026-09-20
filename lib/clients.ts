import type { Campaign } from "@/lib/campaigns";
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
  /** Optional audience description shown in the client workspace. */
  targetAudience?: string | null;
  /** Client logo/headshot; null/absent falls back to the placeholder. */
  profileImage?: string | null;
  /** Creators assigned to this client, set from the client workspace's Team tab. */
  creatorSlugs?: string[];
  /** ISO timestamp of the last write to this client's record; set by Firestore. */
  updatedAt?: string | null;
  /** ISO timestamp of when this client's record was created; set by Firestore. */
  createdAt?: string | null;
};

/**
 * Clients are their own Firestore records. A campaign belongs to one client
 * via its `clientId`; a client "has" the campaigns that point at it (see
 * `getClientCampaigns`).
 */
export function getClient(slug: string, clients: Client[]): Client | undefined {
  return clients.find((client) => client.slug === slug);
}

/** The campaigns that belong to this client. */
export function getClientCampaigns(slug: string, campaigns: Campaign[]): Campaign[] {
  return campaigns.filter((project) => project.clientId === slug);
}

/**
 * Campaigns for the clients a creator is rostered on (set from the client
 * workspace's Team tab). There's no per-campaign creator assignment yet, so
 * this is the closest real link between a creator and the work they're on.
 */
export function getCreatorCampaigns(creatorSlug: string, clients: Client[], campaigns: Campaign[]): Campaign[] {
  const clientSlugs = new Set(clients.filter((client) => client.creatorSlugs?.includes(creatorSlug)).map((client) => client.slug));
  return campaigns.filter((campaign) => clientSlugs.has(campaign.clientId));
}

/**
 * The workspace content for a client, assembled from the fields that live
 * directly on the client's project; clients/campaigns without curated content
 * get a blank template so nothing leaks in from another client.
 */
export function getClientWorkspace(
  clientSlug: string,
  clientName: string,
  campaignsSource: Campaign[],
): ClientWorkspace {
  const campaigns = getClientCampaigns(clientSlug, campaignsSource);
  const project = campaigns.find((item) => item.hasContent) ?? campaigns[0];
  const website = project?.externalLinks?.find((link) => link.label === "Website")?.href ?? "";
  const empty = makeEmptyWorkspace({ clientName, category: project?.category ?? "", website });
  // Media is added per client from the workspace UI, independent of the
  // curated "hasContent" preset — it must survive even when a client has no
  // curated content, or every add gets thrown away on the next load.
  const moodboardImages = project?.moodboardImages ?? empty.moodboardImages;

  if (!project?.hasContent) return { ...empty, moodboardImages };

  return {
    preset: project.preset ?? empty.preset,
    strategyMarkdown: project.strategyMarkdown ?? empty.strategyMarkdown,
    phaseContent: project.phaseContent ?? empty.phaseContent,
    valueProposition: project.valueProposition ?? empty.valueProposition,
    palette: project.palette ?? empty.palette,
    primaryColor: project.primaryColor ?? empty.primaryColor,
    brandArchetype: project.brandArchetype ?? empty.brandArchetype,
    moodboardImages,
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
