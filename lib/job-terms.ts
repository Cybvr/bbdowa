import type { PaymentCurrency } from "@/lib/payments";

/**
 * The job record holds the job details, but it is
 * public (the homepage reads it), so the assignment and pay terms live here in
 * a private record keyed by the job slug. Staff, the assignee and everyone
 * on the job's team can read it.
 */
export type JobTerms = {
  /** The first assignee: the default payee. Also counted as part of the team. */
  assignedTo: string | null;
  /** Everyone the job is assigned to, in order. `assignedTo` is the first of these. */
  assignees?: { uid: string; name: string }[];
  /** Firebase uids of everyone on the job's team; gives them access to the job. */
  teamUids?: string[];
  assignedToName: string | null;
  billingCycle: "weekly" | "biweekly" | "monthly" | "milestone";
  rateAmount: number | null;
  rateCurrency: PaymentCurrency;
  rateUnit: "hour" | "day" | "fixed";
  commitment: string | null;
  workdayOverlap: string | null;
  /** The client-side person for this job. Falls back to the client's contact when empty. */
  contact?: { name: string | null; role: string | null; email: string | null } | null;
  updatedAt?: string | null;
};

export const JOB_TERMS_COLLECTION = "jobTerms";

export const EMPTY_JOB_TERMS: JobTerms = {
  assignedTo: null,
  assignedToName: null,
  billingCycle: "monthly",
  rateAmount: null,
  rateCurrency: "NGN",
  rateUnit: "hour",
  commitment: null,
  workdayOverlap: null,
};

export const BILLING_CYCLE_LABELS: Record<JobTerms["billingCycle"], string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  milestone: "By milestone",
};

/**
 * A client's point of contact. Kept out of the public client record so the
 * email isn't readable by anyone; signed-in team members can read it.
 */
export type ClientContact = {
  name: string | null;
  email: string | null;
  role: string | null;
  outOfOfficeUntil: string | null;
  note: string | null;
  updatedAt?: string | null;
};

export const CLIENT_CONTACTS_COLLECTION = "clientContacts";

/** Everyone assigned to a job, falling back to the single assignee on older records. */
export function jobAssignees(terms: Pick<JobTerms, "assignedTo" | "assignedToName" | "assignees">): { uid: string; name: string }[] {
  if (terms.assignees?.length) return terms.assignees;
  return terms.assignedTo ? [{ uid: terms.assignedTo, name: terms.assignedToName ?? "Assignee" }] : [];
}
