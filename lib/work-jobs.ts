import type { PaymentCurrency } from "@/lib/payments";

/** A paid assignment. Tasks, time entries, and payments may link to its id. */
export type WorkJob = {
  id: string;
  title: string;
  description: string;
  status: "active" | "paused" | "completed";
  clientId: string | null;
  clientName: string | null;
  campaignId: string | null;
  campaignName: string | null;
  assignedTo: string;
  assignedToName: string;
  startDate: string | null;
  endDate: string | null;
  billingCycle: "weekly" | "biweekly" | "monthly" | "milestone";
  rateAmount: number | null;
  rateCurrency: PaymentCurrency;
  rateUnit: "hour" | "day" | "fixed";
  commitment: string;
  contactName: string;
  contactEmail: string;
  contactRole?: string | null;
  contactOutOfOfficeUntil?: string | null;
  contactNote?: string | null;
  /** Company profile information shown alongside the engagement. */
  companyTeamSize?: number | null;
  companyYearFounded?: number | null;
  companyIndustry?: string | null;
  companyLocation?: string | null;
  companyWebsite?: string | null;
  companyLinkedIn?: string | null;
  /** Role and working expectations supplied by the client. */
  specialization?: string | null;
  workSetup?: "remote" | "hybrid" | "onsite" | string | null;
  clientHours?: string | null;
  clientHoursTimezone?: string | null;
  workdayOverlap?: string | null;
  clientTimezone?: string | null;
  estimatedLength?: string | null;
  languages?: string[];
  desiredStartDate?: string | null;
  jobPostedAt?: string | null;
  requiredSkills?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export const WORK_JOBS_COLLECTION = "workJobs";

export const WORK_JOB_STATUS_LABELS: Record<WorkJob["status"], string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

export const BILLING_CYCLE_LABELS: Record<WorkJob["billingCycle"], string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  milestone: "By milestone",
};
