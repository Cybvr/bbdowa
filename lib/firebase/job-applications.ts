"use client";

import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { loadNdaState, sendMasterNda } from "@/lib/firebase/master-nda";
import { JOB_APPLICATIONS_COLLECTION, type ApplicationStatus, type JobApplication } from "@/lib/job-postings";
import { EMPTY_JOB_TERMS, JOB_TERMS_COLLECTION, type JobTerms } from "@/lib/job-terms";
import { sendAppEmail } from "@/lib/app-email";
import { notify } from "@/lib/email/notify";
import { jobTeamKey, type User } from "@/lib/users";
import type { Job } from "@/lib/jobs";

/** Shared by the job's Applicants tab and the admin applicant directory. */
export async function updateJobApplication({ application, status, job, users, staff, masterId }: {
  application: JobApplication;
  status: ApplicationStatus;
  job: Job;
  users: User[];
  staff: { uid: string; name?: string | null; email?: string | null };
  masterId: string | null;
}): Promise<JobApplication> {
  if (status === "shortlisted" && masterId) {
    await sendMasterNda(masterId, { uid: application.uid, name: application.name }, { uid: staff.uid, name: staff.name ?? staff.email ?? null });
  }
  if (status === "hired") {
    if (masterId && (await loadNdaState(application.uid, masterId))?.status !== "signed") {
      throw new Error("They need to sign the master NDA before you can hire them.");
    }
    const person = users.find((candidate) => candidate.uid === application.uid);
    const key = person ? jobTeamKey(person) : `uid:${application.uid}`;
    const termsRef = doc(firebaseDb, JOB_TERMS_COLLECTION, job.slug);
    const terms = await getDoc(termsRef);
    if (terms.exists()) await updateDoc(termsRef, { teamUids: arrayUnion(application.uid), updatedAt: new Date().toISOString() });
    else await setDoc(termsRef, { ...EMPTY_JOB_TERMS, teamUids: [application.uid], updatedAt: new Date().toISOString() } satisfies JobTerms);
    if (key && !(job.creatorSlugs ?? []).includes(key)) await updateDoc(doc(firebaseDb, await jobsCollection(), job.slug), { creatorSlugs: arrayUnion(key) });
    void sendAppEmail({ type: "job", jobSlug: job.slug, uids: [application.uid] });
    void notify({ event: "job.assigned", id: job.slug, uids: [application.uid] });
  }
  const changes = { status, jobSlug: status === "declined" ? application.jobSlug : job.slug, updatedAt: new Date().toISOString() };
  await updateDoc(doc(firebaseDb, JOB_APPLICATIONS_COLLECTION, application.id), changes);
  return { ...application, ...changes };
}
