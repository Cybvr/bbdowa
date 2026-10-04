"use client";

import { collection, deleteField, doc, getDoc, getDocs, setDoc, writeBatch, type DocumentData, type DocumentReference } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { resetJobsMigrated } from "@/lib/firebase/job-collections";
import { TASK_COLLECTION } from "@/lib/creator-tasks";
import { LEGACY_JOB_FIELDS } from "@/lib/jobs";
import {
  JOBS_COLLECTION,
  LEGACY_JOBS_COLLECTION,
  LEGACY_OPENINGS_COLLECTION,
  MIGRATION_COLLECTION,
  MIGRATION_ID,
  OPENINGS_COLLECTION,
  type MigrationState,
} from "@/lib/job-migration";
import { PAYMENTS_COLLECTION } from "@/lib/payments";
import { ACTIVITY_COLLECTION } from "@/lib/time-tracking";

export type JobMigrationCounts = {
  openings: number;
  jobs: number;
  jobsAlreadyMoved: number;
  tasks: number;
  timeEntries: number;
  payments: number;
};

/** Writes run in phase order: copies and renames, then removals, then new jobs. */
type Write = { ref: DocumentReference; data: DocumentData; kind: "set" | "update" | "delete"; phase: 1 | 2 | 3 };

const BATCH_SIZE = 400;
const has = (data: DocumentData, key: string) => Object.prototype.hasOwnProperty.call(data, key);

/** Old link fields → new ones, per collection. */
const LINK_FIELDS = [
  { collection: TASK_COLLECTION, key: "tasks", id: "campaignId", name: "campaignName" },
  { collection: ACTIVITY_COLLECTION, key: "timeEntries", id: "campaignSlug", name: "campaignName" },
  { collection: PAYMENTS_COLLECTION, key: "payments", id: "campaignId", name: "campaignName" },
] as const;

/** A copy of a campaign record with the old field names swapped for job ones. */
function toJobRecord(data: DocumentData): DocumentData {
  const { [LEGACY_JOB_FIELDS.title]: legacyTitle, [LEGACY_JOB_FIELDS.mediaPlans]: legacyMediaPlans, ...rest } = data;
  const record: DocumentData = { ...rest };
  if (record.title == null && legacyTitle != null) record.title = legacyTitle;
  if (record.jobMediaPlans === undefined && legacyMediaPlans !== undefined) record.jobMediaPlans = legacyMediaPlans;
  return record;
}

/** Works out every write the migration needs, without making any. */
async function planWrites(): Promise<{ writes: Write[]; counts: JobMigrationCounts }> {
  const writes: Write[] = [];
  const counts: JobMigrationCounts = { openings: 0, jobs: 0, jobsAlreadyMoved: 0, tasks: 0, timeEntries: 0, payments: 0 };

  // 1. Careers openings move out of `jobs` into `openings`. Client jobs have a clientId; openings don't.
  const legacyOpenings = await getDocs(collection(firebaseDb, LEGACY_OPENINGS_COLLECTION));
  legacyOpenings.docs.filter((item) => !item.data().clientId).forEach((item) => {
    writes.push({ kind: "set", ref: doc(firebaseDb, OPENINGS_COLLECTION, item.id), data: item.data(), phase: 1 });
    writes.push({ kind: "delete", ref: item.ref, data: {}, phase: 2 });
    counts.openings += 1;
  });

  // 2. Campaigns are copied into `jobs`. A job that's already there is left alone.
  const movedOpeningIds = new Set(legacyOpenings.docs.filter((item) => !item.data().clientId).map((item) => item.id));
  const existingJobIds = new Set(legacyOpenings.docs.map((item) => item.id).filter((id) => !movedOpeningIds.has(id)));
  const campaigns = await getDocs(collection(firebaseDb, LEGACY_JOBS_COLLECTION));
  campaigns.docs.forEach((item) => {
    if (existingJobIds.has(item.id)) { counts.jobsAlreadyMoved += 1; return; }
    // Written last, so an opening that shared this slug is already out of the way.
    writes.push({ kind: "set", ref: doc(firebaseDb, JOBS_COLLECTION, item.id), data: toJobRecord(item.data()), phase: 3 });
    counts.jobs += 1;
  });

  // 3. Tasks, time entries and payments get jobId / jobName in place of the campaign fields.
  for (const link of LINK_FIELDS) {
    const snapshot = await getDocs(collection(firebaseDb, link.collection));
    snapshot.docs.forEach((item) => {
      const data = item.data();
      if (!has(data, link.id) && !has(data, link.name)) return;
      writes.push({
        kind: "update",
        phase: 1,
        ref: item.ref,
        data: {
          jobId: data.jobId ?? data[link.id] ?? null,
          jobName: data.jobName ?? data[link.name] ?? null,
          [link.id]: deleteField(),
          [link.name]: deleteField(),
        },
      });
      counts[link.key] += 1;
    });
  }

  return { writes, counts };
}

/** What the migration would change, for the confirm step. */
export async function previewJobMigration(): Promise<JobMigrationCounts> {
  return (await planWrites()).counts;
}

/**
 * Runs the campaigns → jobs migration. Safe to run again: jobs already in
 * `jobs` are skipped and records already renamed are left alone. Openings
 * are copied before they're removed, and the old campaigns are never removed
 * here, so a failure part way loses nothing.
 */
export async function runJobMigration(ranBy: string): Promise<JobMigrationCounts> {
  const { writes, counts } = await planWrites();
  for (const phase of [1, 2, 3] as const) {
    const phaseWrites = writes.filter((write) => write.phase === phase);
    for (let start = 0; start < phaseWrites.length; start += BATCH_SIZE) {
      const batch = writeBatch(firebaseDb);
      phaseWrites.slice(start, start + BATCH_SIZE).forEach((write) => {
        if (write.kind === "set") batch.set(write.ref, write.data);
        else if (write.kind === "update") batch.update(write.ref, write.data);
        else batch.delete(write.ref);
      });
      await batch.commit();
    }
  }
  await setDoc(doc(firebaseDb, MIGRATION_COLLECTION, MIGRATION_ID), {
    done: true,
    ranAt: new Date().toISOString(),
    ranBy,
    counts,
  } satisfies MigrationState);
  resetJobsMigrated();
  return counts;
}

export async function readJobMigrationState(): Promise<MigrationState | null> {
  const snapshot = await getDoc(doc(firebaseDb, MIGRATION_COLLECTION, MIGRATION_ID));
  return snapshot.exists() ? (snapshot.data() as MigrationState) : null;
}

export async function countLegacyCampaigns(): Promise<number> {
  return (await getDocs(collection(firebaseDb, LEGACY_JOBS_COLLECTION))).size;
}

/** Deletes the old `campaigns` backup. Only allowed once the migration has run. */
export async function deleteLegacyCampaigns(): Promise<number> {
  const state = await readJobMigrationState();
  if (!state?.done) throw new Error("Run the migration before deleting the old campaigns.");
  const snapshot = await getDocs(collection(firebaseDb, LEGACY_JOBS_COLLECTION));
  for (let start = 0; start < snapshot.docs.length; start += BATCH_SIZE) {
    const batch = writeBatch(firebaseDb);
    snapshot.docs.slice(start, start + BATCH_SIZE).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
  return snapshot.size;
}
