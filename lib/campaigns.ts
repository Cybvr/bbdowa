import type { ClientWorkspace } from "@/lib/client-workspaces";

export type CampaignStatus = "live" | "pitch" | "completed";

export type CampaignMedia = {
  kind: "image" | "video";
  src: string;
  alt: string;
  poster?: string;
};

export type CampaignLiveDate = {
  date: string;
};

export type CampaignExternalLink = {
  label: string;
  href: string;
};

export type Campaign = {
  slug: string;
  name: string;
  campaign?: string;
  clientId: string;
  clientName: string;
  category: string;
  year: number | null;
  liveAt?: CampaignLiveDate;
  status: CampaignStatus;
  leadUserId: string | null;
  publishedBy?: string | null;
  fee: string;
  target: string;
  result: string;
  image: string;
  imageAlt: string;
  media: CampaignMedia[];
  externalLinks?: CampaignExternalLink[];
  summary: string;
  challenge: string;
  insight: string;
  strategy: string;
  platform: string[];
  execution: string;
  outcome: string;
  placeholder: boolean;
  /** ISO timestamp of the last write to this campaign's record; set by Firestore. */
  updatedAt?: string | null;
  /** ISO timestamp of when this campaign's record was created; set by Firestore. */
  createdAt?: string | null;
  /** Job details. A campaign is a job; pay and assignment live in `jobTerms`. */
  startDate?: string | null;
  endDate?: string | null;
  specialization?: string | null;
  workSetup?: "remote" | "hybrid" | "onsite" | string | null;
  estimatedLength?: string | null;
  languages?: string[];
  desiredStartDate?: string | null;
  jobPostedAt?: string | null;
  requiredSkills?: string[];
} & Partial<ClientWorkspace>;

export const JOB_STATUS_LABELS: Record<CampaignStatus, string> = {
  pitch: "Pitch",
  live: "Live",
  completed: "Completed",
};

export function campaignHref(slug: string): string {
  return `/admin/jobs/${slug}`;
}

function liveSortValue(campaign: Campaign): number {
  return campaign.liveAt ? Date.parse(`${campaign.liveAt.date}T00:00:00Z`) : 0;
}

export function sortCampaignsByLatestLive(campaigns: Campaign[]): Campaign[] {
  return [...campaigns].sort((a, b) => {
    const liveStatus = Number(b.status === "live") - Number(a.status === "live");
    if (liveStatus !== 0) return liveStatus;
    return liveSortValue(b) - liveSortValue(a);
  });
}

export function campaignsLiveNow(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter((campaign) => campaign.status === "live");
}

export function campaignsDueFrom(campaigns: Campaign[], from: Date, limit = 3): Campaign[] {
  const fromTime = from.getTime();
  return campaigns
    .filter((campaign) => campaign.liveAt && liveSortValue(campaign) >= fromTime)
    .sort((a, b) => liveSortValue(a) - liveSortValue(b))
    .slice(0, limit);
}

export function campaignsWithTrackedTarget(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter((campaign) => campaign.target.toLowerCase() !== "to be confirmed");
}

export function campaignLiveDateLabel(campaign: Campaign): string {
  if (!campaign.liveAt) return "Date TBC";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${campaign.liveAt.date}T00:00:00Z`));
}
