"use client";

import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { JOB_TERMS_COLLECTION } from "@/lib/job-terms";
import type { User } from "@/lib/users";

/** Firebase uids for a list of user slugs; people without an account are skipped. */
export function teamUidsFor(slugs: string[], users: Pick<User, "slug" | "uid">[]): string[] {
  return [...new Set(slugs.map((slug) => users.find((user) => user.slug === slug)?.uid).filter((uid): uid is string => Boolean(uid)))];
}

/**
 * Saves a job's team. The slugs go on the public job record (for profiles and
 * avatars); the matching uids go on the private terms record, which is what
 * gives team members access to the job, its time logging and their dashboards.
 */
export async function saveJobTeam(jobSlug: string, slugs: string[], users: Pick<User, "slug" | "uid">[]) {
  const cleanSlugs = [...new Set(slugs.filter(Boolean))];
  await updateDoc(doc(firebaseDb, await jobsCollection(), jobSlug), {
    creatorSlugs: cleanSlugs,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(firebaseDb, JOB_TERMS_COLLECTION, jobSlug), {
    teamUids: teamUidsFor(cleanSlugs, users),
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  return cleanSlugs;
}

/** Slugs of the jobs this person is on: as the assignee or as a team member. */
export async function readMyJobIds(uid: string): Promise<Set<string>> {
  const terms = collection(firebaseDb, JOB_TERMS_COLLECTION);
  const [assigned, team] = await Promise.all([
    getDocs(query(terms, where("assignedTo", "==", uid))),
    getDocs(query(terms, where("teamUids", "array-contains", uid))),
  ]);
  return new Set([...assigned.docs, ...team.docs].map((item) => item.id));
}
