// Canonical project model. The legacy campaign exports remain available so
// existing page routes can keep their current URLs during this refactor.
export {
  PROJECTS,
  campaignHref,
  campaignLiveDateLabel,
  campaignsDueFrom,
  campaignsLiveNow,
  campaignsWithTrackedTarget,
  getCampaign,
  sortCampaignsByLatestLive,
} from "@/lib/campaigns";
export type { Project, ProjectStatus } from "@/lib/campaigns";
