import type { PaymentCurrency } from "@/lib/payments";

// A posting is the brandless, shareable version of a job. It lives in its own
// public collection under a random id, so the share link never names the brand
// or points at the job. Only staff can see which job a posting belongs to
// (`jobPostingLinks/{jobSlug}`).
//
// Freelancers apply with a proposal (Upwork-style). Their application doubles
// as sign-up: the name, email and password on the form create their account. Shortlisting
// sends the master NDA once; after it's signed the applicant can open the job.

export const JOB_POSTINGS_COLLECTION = "jobPostings";
export const JOB_POSTING_LINKS_COLLECTION = "jobPostingLinks";
export const JOB_APPLICATIONS_COLLECTION = "jobApplications";
/** `settings/masterNda` holds `{ documentId }`: the document every freelancer signs once. */
export const MASTER_NDA_SETTINGS = { collection: "settings", id: "masterNda" } as const;

export type JobPostingStatus = "open" | "closed";

export type JobPosting = {
  id: string;
  status: JobPostingStatus;
  /** Brandless headline, e.g. "Social campaign for a drinks brand". */
  headline: string;
  /** How the client is described instead of its name, e.g. "Global drinks brand". */
  clientLabel: string;
  /** Rich text brief with no brand names. */
  brief: string;
  deliverables: string[];
  /** Shown as the rate, e.g. "₦500,000 a month". */
  budget: string;
  /** Job length, one of DURATION_OPTIONS. */
  duration: string;
  /** Hours a week, one of COMMITMENT_OPTIONS. */
  commitment: string;
  industry: string;
  /** Shown as Job type: Remote, Hybrid or Onsite. */
  workSetup: string;
  skills: string[];
  /** Up to three screening questions. */
  questions: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationStatus = "submitted" | "shortlisted" | "hired" | "declined";

export type ApplicationLink = { title: string; url: string };

export type ApplicationAttachment = { name: string; url: string; path: string };

export type JobApplication = {
  /** `${postingId}_${uid}`: one application per person per posting. */
  id: string;
  postingId: string;
  uid: string;
  name: string | null;
  email: string | null;
  /** The cover letter. Older applications also split it into coverApproach and coverNext. */
  coverIntro: string;
  answers: { question: string; answer: string }[];
  attachment?: ApplicationAttachment | null;
  /** Fields from the earlier proposal form, kept so older applications still read. */
  rateAmount?: number | null;
  rateCurrency?: PaymentCurrency;
  rateUnit?: "hour" | "fixed";
  duration?: string;
  coverApproach?: string;
  coverNext?: string;
  portfolio?: ApplicationLink[];
  samples?: ApplicationLink[];
  testimonial?: { quote: string; name: string; company: string } | null;
  status: ApplicationStatus;
  /** Set by staff on shortlist, so the applicant can open the job once the NDA is signed. */
  jobSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

export const DURATION_OPTIONS = ["Less than 1 month", "1 to 3 months", "3 to 6 months", "6+ months"];

export const COMMITMENT_OPTIONS = ["5 hrs/wk", "10 hrs/wk", "20 hrs/wk", "40 hrs/wk"];

export const INDUSTRY_OPTIONS = [
  "Advertising and marketing",
  "Agriculture",
  "Automotive",
  "Banking",
  "Beverages",
  "Consumer goods",
  "Education",
  "Energy",
  "Entertainment and media",
  "Fashion and beauty",
  "Finance",
  "Food",
  "Government and public sector",
  "Healthcare",
  "Hospitality and travel",
  "Insurance",
  "Logistics",
  "Manufacturing",
  "Non-profit",
  "Oil and gas",
  "Real estate",
  "Retail and e-commerce",
  "Sports",
  "Technology",
  "Telecoms",
  "Other",
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "New",
  shortlisted: "Shortlisted",
  hired: "Hired",
  declined: "Declined",
};

/** The same statuses as the applicant sees them. */
export const APPLICANT_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "In review",
  shortlisted: "Shortlisted",
  hired: "Hired",
  declined: "Not selected",
};

export function applicationId(postingId: string, uid: string): string {
  return `${postingId}_${uid}`;
}

/** A random, unguessable id for the share link. */
export function newPostingId(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 14);
}

export function postingHref(id: string): string {
  return `/jobs/${encodeURIComponent(id)}`;
}

export function normalizePosting(id: string, data: Record<string, unknown>): JobPosting {
  const list = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  return {
    id,
    status: data.status === "closed" ? "closed" : "open",
    headline: text(data.headline),
    clientLabel: text(data.clientLabel),
    brief: text(data.brief),
    deliverables: list(data.deliverables),
    budget: text(data.budget),
    duration: text(data.duration),
    commitment: text(data.commitment),
    industry: text(data.industry),
    workSetup: text(data.workSetup),
    skills: list(data.skills),
    questions: list(data.questions).slice(0, 3),
    createdBy: text(data.createdBy),
    createdAt: text(data.createdAt),
    updatedAt: text(data.updatedAt),
  };
}

/** The application's proposal as one plain cover letter, for email and copy. */
export function coverLetter(application: Pick<JobApplication, "coverIntro" | "coverApproach" | "coverNext">): string {
  return [application.coverIntro, application.coverApproach, application.coverNext].map((part) => (part ?? "").trim()).filter(Boolean).join("\n\n");
}
