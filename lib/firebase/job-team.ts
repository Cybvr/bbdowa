"use client";

import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { sendAppEmail } from "@/lib/app-email";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { JOB_TERMS_COLLECTION } from "@/lib/job-terms";
import { matchesJobTeamKey, type User } from "@/lib/users";

/** Firebase UIDs for saved job-team keys; people without an account are skipped. */
export function teamUidsFor(slugs: string[], users: Pick<User, "slug" | "uid">[]): string[] {
  return [...new Set(users.filter((user) => slugs.some((key) => matchesJobTeamKey(user, key))).map((user) => user.uid).filter((uid): uid is string => Boolean(uid)))];
}

/**
 * Saves a job's team. Team keys go on the public job record (for profiles and
 * avatars); the matching UIDs go on the private terms record, which is what
 * gives team members access to the job, its time logging and their dashboards.
 */
export async function saveJobTeam(jobSlug: string, slugs: string[], users: Pick<User, "slug" | "uid">[]) {
  const cleanSlugs = [...new Set(slugs.filter(Boolean))];
  const previous = await getDoc(doc(firebaseDb, JOB_TERMS_COLLECTION, jobSlug)).catch(() => null);
  const before = new Set<string>(previous?.exists() ? [previous.data().assignedTo, ...(previous.data().teamUids ?? [])].filter(Boolean) : []);
  const teamUids = teamUidsFor(cleanSlugs, users);
  await updateDoc(doc(firebaseDb, await jobsCollection(), jobSlug), {
    creatorSlugs: cleanSlugs,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(firebaseDb, JOB_TERMS_COLLECTION, jobSlug), {
    teamUids,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  const added = teamUids.filter((uid) => !before.has(uid));
  if (added.length) void sendAppEmail({ type: "job", jobSlug, uids: added });
  return cleanSlugs;
}

/**
 * Job ids this person is on, either as the assignee or as a team member.
 *
 * `jobTerms.teamUids` is the fast private lookup. Older team assignments can
 * predate that field, though, so also resolve the person's directory slug and
 * use the public job team list as a compatibility fallback.
 */
export async function readMyJobIds(uid: string, email?: string | null): Promise<Set<string>> {
  const terms = collection(firebaseDb, JOB_TERMS_COLLECTION);
  const [assigned, team] = await Promise.allSettled([
    getDocs(query(terms, where("assignedTo", "==", uid))),
    getDocs(query(terms, where("teamUids", "array-contains", uid))),
  ]);
  const ids = new Set<string>();
  for (const result of [assigned, team]) {
    if (result.status === "fulfilled") result.value.docs.forEach((item) => ids.add(item.id));
  }

  const slugs = new Set<string>();
  const identityReads = [
    getDoc(doc(firebaseDb, "users", uid)),
    ...(email ? [getDocs(query(collection(firebaseDb, "users"), where("email", "==", email)))] : []),
  ];
  const identities = await Promise.allSettled(identityReads);
  for (const result of identities) {
    if (result.status !== "fulfilled") continue;
    if ("docs" in result.value) {
      result.value.docs.forEach((item) => {
        const slug = item.data().slug;
        if (typeof slug === "string" && slug) slugs.add(slug);
      });
    } else if (result.value.exists()) {
      const slug = result.value.data()?.slug;
      if (typeof slug === "string" && slug) slugs.add(slug);
    }
  }

  if (slugs.size) {
    const jobs = collection(firebaseDb, await jobsCollection());
    const jobReads = await Promise.allSettled(
      [...slugs].map((slug) => getDocs(query(jobs, where("creatorSlugs", "array-contains", slug)))),
    );
    for (const result of jobReads) {
      if (result.status === "fulfilled") result.value.docs.forEach((item) => ids.add(item.id));
    }
  }

  return ids;
}
