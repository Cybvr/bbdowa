import type { ClientWorkspace } from "@/lib/client-workspaces";

export type JobStatus = "active" | "completed" | "archived";

export type JobMedia = {
  kind: "image" | "video";
  src: string;
  alt: string;
  poster?: string;
};

export type JobLiveDate = {
  date: string;
};

export type JobExternalLink = {
  label: string;
  href: string;
};

export type Job = {
  slug: string;
  /** Optional human-readable job number from the workspace record. */
  jobNumber?: string | number | null;
  /** Brand or client-facing name, e.g. "Amstel". */
  name: string;
  /** The job's own title, e.g. "Summer launch". Falls back to `name`. */
  title?: string;
  /** Optional campaign title shown as the client-facing project title. */
  campaignTitle?: string;
  clientId: string;
  clientName: string;
  category: string;
  year: number | null;
  liveAt?: JobLiveDate;
  status: JobStatus;
  leadUserId: string | null;
  /** People working on this job, set from the job's Team tab. */
  creatorSlugs?: string[];
  publishedBy?: string | null;
  fee: string;
  target: string;
  result: string;
  image: string;
  imageAlt: string;
  media: JobMedia[];
  externalLinks?: JobExternalLink[];
  summary: string;
  challenge: string;
  insight: string;
  strategy: string;
  platform: string[];
  execution: string;
  outcome: string;
  placeholder: boolean;
  /** ISO timestamp of the last write to this job's record; set by Firestore. */
  updatedAt?: string | null;
  /** ISO timestamp of when this job's record was created; set by Firestore. */
  createdAt?: string | null;
  /** Job details. Pay and assignment live in `jobTerms`. */
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

/** Field names used by records saved before the campaigns → jobs migration. */
export const LEGACY_JOB_FIELDS = { title: "campaign", mediaPlans: "campaignMediaPlans" } as const;

function timestampAsIso(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return (value.toDate() as Date).toISOString();
  }
  return null;
}

/** Reads a stored job, mapping old campaign field names across when present. */
export function normalizeJob(data: Record<string, unknown>, id?: string): Job {
  const { [LEGACY_JOB_FIELDS.title]: legacyTitle, [LEGACY_JOB_FIELDS.mediaPlans]: legacyMediaPlans, ...rest } = data;
  const rawStatus = rest.status;
  // Current values pass through; "live" and "pitch" are older names for active and archived.
  const status: JobStatus = rawStatus === "completed" || rawStatus === "archived" ? rawStatus : rawStatus === "pitch" ? "archived" : "active";
  return {
    ...rest,
    slug: (rest.slug as string | undefined) ?? id,
    title: (rest.title as string | undefined) ?? (legacyTitle as string | undefined),
    campaignTitle: rest.campaignTitle as string | undefined,
    status,
    createdAt: timestampAsIso(rest.createdAt),
    updatedAt: timestampAsIso(rest.updatedAt),
    ...(rest.jobMediaPlans === undefined && legacyMediaPlans !== undefined ? { jobMediaPlans: legacyMediaPlans } : {}),
  } as Job;
}

/** Record creation date, with the legacy posted date as a fallback. */
export function jobPostedDate(job: Pick<Job, "createdAt" | "jobPostedAt">): string | null {
  return job.createdAt?.slice(0, 10) || job.jobPostedAt?.slice(0, 10) || null;
}

/** Full last-modified timestamp, for sorting newest first. Falls back to older dates. */
export function jobModifiedAt(job: Pick<Job, "updatedAt" | "createdAt" | "jobPostedAt" | "liveAt">): string {
  return job.updatedAt || job.createdAt || job.jobPostedAt || job.liveAt?.date || "";
}

/** Newest-modified first. */
export function byLastModified(a: Job, b: Job): number {
  return jobModifiedAt(b).localeCompare(jobModifiedAt(a));
}

/** The latest date available for compact job cards. */
export function jobRecentDate(job: Pick<Job, "updatedAt" | "createdAt" | "jobPostedAt" | "liveAt">): string | null {
  return job.updatedAt?.slice(0, 10) || job.createdAt?.slice(0, 10) || job.jobPostedAt || job.liveAt?.date || null;
}

export function jobDisplayTitle(job: Pick<Job, "campaignTitle" | "title" | "name">): string {
  return job.campaignTitle?.trim() || job.title?.trim() || job.name;
}

/** The internal job title used by the Jobs and My jobs workspaces. */
export function jobTitle(job: Pick<Job, "title" | "name">): string {
  return job.title?.trim() || job.name;
}

/** A compact numeric identifier for the job detail header. */
export function jobId(job: Pick<Job, "jobNumber" | "slug">): string {
  const configured = String(job.jobNumber ?? "").trim();
  if (/^\d+$/.test(configured)) return configured;

  let hash = 0;
  for (const character of job.slug) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  return String(hash % 100000000).padStart(8, "0");
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

/** Human-readable URL segment for a job's current internal title. */
export function jobUrlSlug(job: Pick<Job, "slug" | "title" | "name">): string {
  const titleSlug = jobTitle(job)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return titleSlug || job.slug;
}

/** A job's page: the admin page, shared jobs overview, or assigned-job workspace. */
export function jobHref(jobOrSlug: string | Pick<Job, "slug" | "title" | "name">, admin = false, myJobs = false): string {
  const base = admin ? "/admin/jobs" : myJobs ? "/dashboard/my-jobs" : "/dashboard/jobs";
  const slug = typeof jobOrSlug === "string" ? jobOrSlug : jobUrlSlug(jobOrSlug);
  return `${base}/${encodeURIComponent(slug)}`;
}

function liveSortValue(job: Job): number {
  return job.liveAt ? Date.parse(`${job.liveAt.date}T00:00:00Z`) : 0;
}

export function sortJobsByLatestLive(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    const liveStatus = Number(b.status === "active") - Number(a.status === "active");
    if (liveStatus !== 0) return liveStatus;
    return liveSortValue(b) - liveSortValue(a);
  });
}

export function jobsLiveNow(jobs: Job[]): Job[] {
  return jobs.filter((job) => job.status === "active");
}

export function jobsDueFrom(jobs: Job[], from: Date, limit = 3): Job[] {
  const fromTime = from.getTime();
  return jobs
    .filter((job) => job.liveAt && liveSortValue(job) >= fromTime)
    .sort((a, b) => liveSortValue(a) - liveSortValue(b))
    .slice(0, limit);
}

export function jobsWithTrackedTarget(jobs: Job[]): Job[] {
  return jobs.filter((job) => job.target.toLowerCase() !== "to be confirmed");
}

export function jobLiveDateLabel(job: Job): string {
  if (!job.liveAt) return "Date TBC";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${job.liveAt.date}T00:00:00Z`));
}
