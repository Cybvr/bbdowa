"use client";

import { collection, deleteField, doc, getDocs, writeBatch, type DocumentData, type DocumentReference } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { teamUidsFor } from "@/lib/firebase/job-team";
import { TASK_COLLECTION, type Task } from "@/lib/creator-tasks";
import type { Client } from "@/lib/clients";
import { normalizeJob, type JobMedia } from "@/lib/jobs";
import type { CreativePreview } from "@/lib/client-workspaces";
import { newJobRecord, slugify } from "@/lib/job-records";
import { JOB_TERMS_COLLECTION, type JobTerms } from "@/lib/job-terms";
import type { User } from "@/lib/users";

export type TeamMigrationCounts = {
  jobTeams: number;
  peopleAdded: number;
  jobsCreated: number;
  tasksMoved: number;
  jobsWithMedia: number;
  mediaMoved: number;
  jobAccess: number;
};

type Write = { ref: DocumentReference; data: DocumentData; kind: "set" | "merge" | "update" };

const BATCH_SIZE = 400;

const sameMembers = (a: string[], b: string[]) => a.length === b.length && a.every((value) => b.includes(value));

/**
 * Client teams, client-only tasks and client media → jobs, and job teams → access.
 * Each client's team is added to the team of every job it has, and each task
 * that names a client but no job gets a new job of its own (named after the
 * task, with the client's team plus the task's assignee). Every job's team,
 * including its assignee, is then given access through the job's terms record
 * so the job shows on each member's dashboard. Safe to run again: teams are
 * merged, tasks that already have a job are left alone, and media is only
 * moved once.
 */
async function planTeamMigration() {
  const jobsName = await jobsCollection();
  const [clientSnapshot, jobSnapshot, taskSnapshot, userSnapshot, termsSnapshot] = await Promise.all([
    getDocs(collection(firebaseDb, "clients")),
    getDocs(collection(firebaseDb, jobsName)),
    getDocs(collection(firebaseDb, TASK_COLLECTION)),
    getDocs(collection(firebaseDb, "users")),
    getDocs(collection(firebaseDb, JOB_TERMS_COLLECTION)),
  ]);
  const clients = new Map(clientSnapshot.docs.map((item) => {
    const client = item.data() as Client;
    return [client.slug ?? item.id, { ...client, slug: client.slug ?? item.id }] as const;
  }));
  const users = userSnapshot.docs.map((item) => item.data() as User);
  const terms = new Map(termsSnapshot.docs.map((item) => [item.id, item.data() as Partial<JobTerms>] as const));
  const counts: TeamMigrationCounts = { jobTeams: 0, peopleAdded: 0, jobsCreated: 0, tasksMoved: 0, jobsWithMedia: 0, mediaMoved: 0, jobAccess: 0 };
  // Each unit is committed in a single batch, so a new job, its task and its
  // access record are never half written (a rerun would duplicate the job).
  const units: Write[][] = [];

  for (const item of jobSnapshot.docs) {
    const job = normalizeJob(item.data(), item.id);
    const jobTerms = terms.get(item.id);
    const update: DocumentData = {};
    const unit: Write[] = [];

    const assigneeSlug = jobTerms?.assignedTo ? users.find((user) => user.uid === jobTerms.assignedTo)?.slug : undefined;
    const current = job.creatorSlugs ?? [];
    const wanted = [...(clients.get(job.clientId)?.creatorSlugs ?? []), ...(assigneeSlug ? [assigneeSlug] : [])].filter(Boolean);
    const added = [...new Set(wanted)].filter((slug) => !current.includes(slug));
    const team = [...current, ...added];
    if (added.length) {
      update.creatorSlugs = team;
      counts.jobTeams += 1;
      counts.peopleAdded += added.length;
    }

    // The old client Media tab saved onto this job's `moodboardImages`; fold
    // those into the job's own media and drop the old field.
    const moodboard = (item.data().moodboardImages ?? []) as CreativePreview[];
    if (moodboard.length) {
      const media = job.media ?? [];
      const moved = moodboard
        .filter((image) => image?.src && !media.some((existing) => existing.src === image.src))
        .map((image): JobMedia => ({ kind: "image", src: image.src, alt: image.alt ?? "" }));
      update.media = [...media, ...moved];
      update.moodboardImages = deleteField();
      counts.jobsWithMedia += 1;
      counts.mediaMoved += moved.length;
    }

    if (Object.keys(update).length) unit.push({ ref: item.ref, kind: "update", data: update });

    const teamUids = [...new Set([...teamUidsFor(team, users), ...(jobTerms?.assignedTo ? [jobTerms.assignedTo] : [])])];
    if (teamUids.length && !sameMembers(teamUids, jobTerms?.teamUids ?? [])) {
      unit.push({ ref: doc(firebaseDb, JOB_TERMS_COLLECTION, item.id), kind: "merge", data: { teamUids } });
      counts.jobAccess += 1;
    }

    if (unit.length) units.push(unit);
  }

  for (const item of taskSnapshot.docs) {
    const task = item.data() as Omit<Task, "id">;
    if (!task.clientId || task.jobId) continue;
    const client = clients.get(task.clientId);
    const clientRef = { slug: task.clientId, name: client?.name ?? task.clientName ?? task.clientId };
    const assigneeSlug = users.find((user) => user.uid === task.assignedTo)?.slug;
    const team = [...new Set([...(client?.creatorSlugs ?? []), ...(assigneeSlug ? [assigneeSlug] : [])].filter(Boolean))];
    const teamUids = [...new Set([...teamUidsFor(team, users), ...(task.assignedTo ? [task.assignedTo] : [])])];
    const title = task.title?.trim() || "Untitled job";
    const slug = `${slugify(title)}-${item.id.slice(0, 4).toLowerCase()}`;
    const unit: Write[] = [
      { ref: doc(firebaseDb, jobsName, slug), kind: "set", data: newJobRecord({ slug, title, client: clientRef, creatorSlugs: team }) },
      { ref: item.ref, kind: "update", data: { jobId: slug, jobName: title, clientName: clientRef.name } },
    ];
    if (teamUids.length) {
      unit.push({ ref: doc(firebaseDb, JOB_TERMS_COLLECTION, slug), kind: "merge", data: { teamUids } });
      counts.jobAccess += 1;
    }
    units.push(unit);
    counts.jobsCreated += 1;
    counts.tasksMoved += 1;
  }

  return { counts, units };
}

export async function previewTeamMigration(): Promise<TeamMigrationCounts> {
  return (await planTeamMigration()).counts;
}

export async function runTeamMigration(): Promise<TeamMigrationCounts> {
  const { counts, units } = await planTeamMigration();
  let batch = writeBatch(firebaseDb);
  let size = 0;
  for (const unit of units) {
    if (size + unit.length > BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(firebaseDb);
      size = 0;
    }
    for (const write of unit) {
      if (write.kind === "set") batch.set(write.ref, write.data);
      else if (write.kind === "merge") batch.set(write.ref, write.data, { merge: true });
      else batch.update(write.ref, write.data);
    }
    size += unit.length;
  }
  if (size) await batch.commit();
  return counts;
}
