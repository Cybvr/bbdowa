"use client";

import { doc, getDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { MIGRATION_COLLECTION, MIGRATION_ID, collectionsFor } from "@/lib/job-migration";

let migrated: Promise<boolean> | null = null;

/** Whether the campaigns → jobs migration has run. Read once per page load. */
export function isJobsMigrated(): Promise<boolean> {
  migrated ??= getDoc(doc(firebaseDb, MIGRATION_COLLECTION, MIGRATION_ID))
    .then((snapshot) => snapshot.exists() && snapshot.data().done === true)
    .catch((cause) => {
      console.error("Unable to read the jobs migration state", cause);
      migrated = null;
      return false;
    });
  return migrated;
}

/** Forget the cached state, e.g. right after the migration runs. */
export function resetJobsMigrated() {
  migrated = null;
}

/** The collection client jobs live in: `jobs`, or `campaigns` before the migration. */
export async function jobsCollection(): Promise<string> {
  return collectionsFor(await isJobsMigrated()).jobs;
}

/** The collection careers openings live in: `openings`, or `jobs` before the migration. */
export async function openingsCollection(): Promise<string> {
  return collectionsFor(await isJobsMigrated()).openings;
}
