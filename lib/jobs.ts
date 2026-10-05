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
  const status: JobStatus = rawStatus === "live" ? "active" : rawStatus === "pitch" ? "archived" : rawStatus === "completed" ? "completed" : "active";
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

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

/** A job's page: the admin page, shared jobs overview, or assigned-job workspace. */
export function jobHref(slug: string, admin = false, myJobs = false): string {
  const base = admin ? "/admin/jobs" : myJobs ? "/dashboard/my-jobs" : "/dashboard/jobs";
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
