import type { JobBrief } from "@/lib/portal-jobs";

/** JobBrief fields that Njeri may choose for a short in-chat intake form. */
export const JOB_INTAKE_FIELDS = {
  title: { label: "Job title", type: "text", placeholder: "Give this job a name" },
  category: { label: "Category", type: "text", placeholder: "e.g. Social media" },
  workSetup: { label: "Work setup", type: "select", options: ["remote", "hybrid", "onsite"] },
  startDate: { label: "Desired start", type: "date" },
  estimatedLength: { label: "Estimated length", type: "text", placeholder: "e.g. 4 weeks" },
  budget: { label: "Budget", type: "text", placeholder: "An amount or range, if known" },
} as const satisfies Partial<Record<keyof JobBrief, {
  label: string;
  type: "text" | "date" | "select";
  placeholder?: string;
  options?: readonly string[];
}>>;

export type JobIntakeField = keyof typeof JOB_INTAKE_FIELDS;
export type JobIntakeForm = { fields: JobIntakeField[] };
export type JobIntakeAnswers = Partial<Record<JobIntakeField, string>>;

export function isJobIntakeField(value: unknown): value is JobIntakeField {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(JOB_INTAKE_FIELDS, value);
}
