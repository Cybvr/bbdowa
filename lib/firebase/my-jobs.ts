"use client";

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { readMyJobIds } from "@/lib/firebase/job-team";
import { readTasksAssignedTo } from "@/lib/firebase/task-queries";
import { ACTIVITY_COLLECTION } from "@/lib/time-tracking";
import { PAYMENTS_COLLECTION } from "@/lib/payments";
import { byLastModified, normalizeJob, type Job } from "@/lib/jobs";

/** Jobs connected to a person through team assignment, tasks, time or payments. */
export async function readAssignedJobs(uid: string, email?: string | null): Promise<Job[]> {
  const [jobsName, myJobIds, taskSnapshot, timeSnapshot, paymentSnapshot] = await Promise.all([
    jobsCollection(),
    readMyJobIds(uid, email),
    readTasksAssignedTo(uid),
    getDocs(query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", uid))),
    getDocs(query(collection(firebaseDb, PAYMENTS_COLLECTION), where("payeeUid", "==", uid))),
  ]);

  const jobIds = new Set<string>(myJobIds);
  taskSnapshot.forEach((item) => { if (item.jobId) jobIds.add(item.jobId); });
  timeSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) jobIds.add(jobId); });
  paymentSnapshot.docs.forEach((item) => { const jobId = item.data().jobId; if (typeof jobId === "string" && jobId) jobIds.add(jobId); });

  const snapshots = await Promise.all([...jobIds].map((jobId) => getDoc(doc(firebaseDb, jobsName, jobId))));
  return snapshots
    .filter((item) => item.exists())
    .map((item) => normalizeJob(item.data() as Record<string, unknown>, item.id))
    .sort(byLastModified);
}
