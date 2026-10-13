import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { newJobRecord } from "@/lib/job-records";

/** The parts of a job a client writes themselves. */
export type JobBrief = {
  title: string;
  summary: string;
  category: string;
  workSetup: string;
  estimatedLength: string;
  startDate: string;
  endDate: string;
  budget: string;
  tags: string[];
};

/** A job draft Njeri hands over, so "Edit in form" can open it in the post-a-job steps. */
export const NJERI_DRAFT_KEY = "bbdo_portal_njeri_draft";

export const EMPTY_BRIEF: JobBrief = {
  title: "",
  summary: "",
  category: "",
  workSetup: "remote",
  estimatedLength: "",
  startDate: "",
  endDate: "",
  budget: "",
  tags: [],
};

function slugFor(title: string) {
  const base = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "job";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Brief fields as stored on the job record. Only these may be changed by a client. */
function briefFields(brief: JobBrief) {
  return {
    name: brief.title.trim(),
    title: brief.title.trim(),
    campaignTitle: brief.title.trim(),
    summary: brief.summary,
    category: brief.category.trim() || "General",
    requiredSkills: brief.tags,
    workSetup: brief.workSetup || "remote",
    estimatedLength: brief.estimatedLength.trim() || null,
    desiredStartDate: brief.startDate || null,
    startDate: brief.startDate || null,
    endDate: brief.endDate || null,
    fee: brief.budget.trim(),
    updatedAt: serverTimestamp(),
  };
}

/** Creates a job for the client's company and returns its slug. */
export async function createClientJob(brief: JobBrief, company: { slug: string; name: string }, postedBy: { uid: string; name: string | null }) {
  const slug = slugFor(brief.title);
  await setDoc(doc(firebaseDb, await jobsCollection(), slug), {
    ...newJobRecord({ slug, title: brief.title.trim(), client: company }),
    ...briefFields(brief),
    placeholder: false,
    languages: [],
    postedBy: postedBy.uid,
    postedByName: postedBy.name,
  });
  return slug;
}

export async function updateClientJob(slug: string, brief: JobBrief) {
  await updateDoc(doc(firebaseDb, await jobsCollection(), slug), briefFields(brief));
}

/** A brief from a stored job, for editing. */
export function briefFromJob(job: { title?: string | null; name?: string | null; summary?: string | null; category?: string | null; workSetup?: string | null; estimatedLength?: string | null; desiredStartDate?: string | null; startDate?: string | null; endDate?: string | null; fee?: string | null; requiredSkills?: string[] | null }): JobBrief {
  return {
    title: job.title ?? job.name ?? "",
    summary: job.summary ?? "",
    category: job.category ?? "",
    workSetup: job.workSetup ?? "remote",
    estimatedLength: job.estimatedLength ?? "",
    startDate: job.desiredStartDate ?? job.startDate ?? "",
    endDate: job.endDate ?? "",
    budget: job.fee && job.fee !== "To be confirmed" ? job.fee : "",
    tags: job.requiredSkills ?? [],
  };
}
