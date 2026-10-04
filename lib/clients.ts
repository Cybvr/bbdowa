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
  /** Creators assigned to this client, set from the client workspace's Team tab. */
  creatorSlugs?: string[];
  /** ISO timestamp of the last write to this client's record; set by Firestore. */
  updatedAt?: string | null;
  /** ISO timestamp of when this client's record was created; set by Firestore. */
  createdAt?: string | null;
  /** Company information shown on the client's jobs. */
  teamSize?: number | null;
  yearFounded?: number | null;
  location?: string | null;
  website?: string | null;
  linkedIn?: string | null;
  /** Client working hours, e.g. "09:00 – 17:00", and the same hours in our time zone. */
  hours?: string | null;
  hoursConverted?: string | null;
  timezone?: string | null;
  /** Point of contact details live in `clientContacts` (not public). */
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
 * Jobs for the clients a creator is rostered on (set from the client
 * workspace's Team tab). There's no per-job creator assignment yet, so
 * this is the closest real link between a creator and the work they're on.
 */
export function getCreatorJobs(creatorSlug: string, clients: Client[], jobs: Job[]): Job[] {
  const clientSlugs = new Set(clients.filter((client) => client.creatorSlugs?.includes(creatorSlug)).map((client) => client.slug));
  return jobs.filter((job) => clientSlugs.has(job.clientId));
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
  return `/dashboard/clients/${slug}/overview`;
}
