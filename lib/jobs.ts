import type { ClientWorkspace } from "@/lib/client-workspaces";

export type JobStatus = "live" | "pitch" | "completed";

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
  clientId: string;
  clientName: string;
  category: string;
  year: number | null;
  liveAt?: JobLiveDate;
  status: JobStatus;
  leadUserId: string | null;
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

/** Reads a stored job, mapping old campaign field names across when present. */
export function normalizeJob(data: Record<string, unknown>, id?: string): Job {
  const { [LEGACY_JOB_FIELDS.title]: legacyTitle, [LEGACY_JOB_FIELDS.mediaPlans]: legacyMediaPlans, ...rest } = data;
  return {
    ...rest,
    slug: (rest.slug as string | undefined) ?? id,
    title: (rest.title as string | undefined) ?? (legacyTitle as string | undefined),
    ...(rest.jobMediaPlans === undefined && legacyMediaPlans !== undefined ? { jobMediaPlans: legacyMediaPlans } : {}),
  } as Job;
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pitch: "Pitch",
  live: "Live",
  completed: "Completed",
};

/** A job's page: the admin page for staff tools, or the dashboard page. */
export function jobHref(slug: string, admin = false): string {
  return `${admin ? "/admin/jobs" : "/dashboard/jobs"}/${encodeURIComponent(slug)}`;
}

function liveSortValue(job: Job): number {
  return job.liveAt ? Date.parse(`${job.liveAt.date}T00:00:00Z`) : 0;
}

export function sortJobsByLatestLive(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    const liveStatus = Number(b.status === "live") - Number(a.status === "live");
    if (liveStatus !== 0) return liveStatus;
    return liveSortValue(b) - liveSortValue(a);
  });
}

export function jobsLiveNow(jobs: Job[]): Job[] {
  return jobs.filter((job) => job.status === "live");
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
