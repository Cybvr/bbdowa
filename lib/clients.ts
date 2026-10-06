import type { Job } from "@/lib/jobs";
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
  /** Legacy client-level team. Teams now live on jobs; the admin migration copies this onto each of the client's jobs. */
  creatorSlugs?: string[];
  /** ISO timestamp of the last write to this client's record; set by Firestore. */
  updatedAt?: string | null;
  /** ISO timestamp of when this client's record was created; set by Firestore. */
  createdAt?: string | null;
  /** Company information shown on the client's jobs. */
  /** A range from TEAM_SIZE_RANGES. Older records hold a plain number. */
  teamSize?: string | number | null;
  yearFounded?: number | null;
  location?: string | null;
  website?: string | null;
  linkedIn?: string | null;
  /** Older records only; no longer edited or shown. */
  hours?: string | null;
  hoursConverted?: string | null;
  timezone?: string | null;
  /** Firebase uid of the client user who owns this company and can edit its profile. */
  ownerUid?: string | null;
  /** Agency user selected as this company's lead contact. */
  leadContactUserId?: string | null;
  /** Agency staff member responsible for this client relationship. */
  accountManagerUserId?: string | null;
  /** The agency's own work (e.g. BBDO West Africa), not an outside client. */
  internal?: boolean | null;
  /** Legacy free-text contact details live in `clientContacts` (not public). */
};

/**
 * Clients are their own Firestore records. A job belongs to one client
 * via its `clientId`; a client "has" the jobs that point at it (see
 * `getClientJobs`).
 */
export function getClient(slug: string, clients: Client[]): Client | undefined {
  return clients.find((client) => client.slug === slug);
}

/** The jobs that belong to this client. */
export function getClientJobs(slug: string, jobs: Job[]): Job[] {
  return jobs.filter((project) => project.clientId === slug);
}

/**
 * The workspace content for a client, assembled from the fields that live
 * directly on the client's project; clients/jobs without curated content
 * get a blank template so nothing leaks in from another client.
 */
export function getClientWorkspace(
  clientSlug: string,
  clientName: string,
  jobsSource: Job[],
): ClientWorkspace {
  const jobs = getClientJobs(clientSlug, jobsSource);
  const project = jobs.find((item) => item.hasContent) ?? jobs[0];
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
    jobMediaPlans: project.jobMediaPlans ?? empty.jobMediaPlans,
    creativePreviews: project.creativePreviews ?? empty.creativePreviews,
    fontPreview: project.fontPreview ?? empty.fontPreview,
    overviewVideo: project.overviewVideo ?? empty.overviewVideo,
    hasContent: project.hasContent ?? empty.hasContent,
  };
}

export function clientHref(slug: string): string {
  return `/admin/clients/${slug}/overview`;
}

/** The jobs whose team includes this creator (set from each job's Team tab). */
export function getCreatorJobs(creatorSlug: string, jobs: Job[]): Job[] {
  return jobs.filter((job) => job.creatorSlugs?.includes(creatorSlug));
}

export const TEAM_SIZE_RANGES = ["1", "2–5", "6–10", "11–50", "51–100", "101–500", "501–2000", "2000+"] as const;

/** Shows a team size as a range, mapping older plain numbers into the right one. */
export function teamSizeLabel(value: string | number | null | undefined): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string" && !/^\d+$/.test(value)) return value;
  const size = Number(value);
  if (size <= 1) return "1";
  if (size <= 5) return "2–5";
  if (size <= 10) return "6–10";
  if (size <= 50) return "11–50";
  if (size <= 100) return "51–100";
  if (size <= 500) return "101–500";
  if (size <= 2000) return "501–2000";
  return "2000+";
}

export const CLIENT_TIMEZONES = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/Los_Angeles",
  "America/Chicago",
  "America/New_York",
];

/** Client users invited by email, keyed by the lower-case email. */
export const CLIENT_INVITES_COLLECTION = "clientInvites";

export type ClientInvite = {
  email: string;
  name: string;
  title: string;
  clientId: string;
  clientName: string;
  invitedBy: string | null;
  invitedAt: string;
};

/** The agency's own record counts as internal even before the flag is set. */
export function isInternalClient(client: Pick<Client, "slug" | "internal">): boolean {
  return client.internal ?? client.slug === "bbdo-west-africa";
}
