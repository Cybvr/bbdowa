import type { PaymentCurrency } from "@/lib/payments";

/**
 * The job record holds the job details, but it is
 * public (the homepage reads it), so the assignment and pay terms live here in
 * a private record keyed by the job slug. Staff and the assigned person
 * can read it.
 */
export type JobTerms = {
  assignedTo: string | null;
  assignedToName: string | null;
  billingCycle: "weekly" | "biweekly" | "monthly" | "milestone";
  rateAmount: number | null;
  rateCurrency: PaymentCurrency;
  rateUnit: "hour" | "day" | "fixed";
  commitment: string | null;
  workdayOverlap: string | null;
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
