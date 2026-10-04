"use client";

import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";

export type ContentCollection = "clients" | "jobs" | "blogs" | "resources";

/** Jobs live in `campaigns` until the migration runs. */
async function resolve(collectionName: ContentCollection): Promise<string> {
  return collectionName === "jobs" ? jobsCollection() : collectionName;
}

export async function renameContent(
  collectionName: ContentCollection,
  slug: string,
  field: string,
  value: string,
) {
  await updateDoc(doc(firebaseDb, await resolve(collectionName), slug), {
    [field]: value,
    updatedAt: serverTimestamp(),
  });
}

export async function copyContent(
  collectionName: ContentCollection,
  slug: string,
  titleField: string,
  title: string,
) {
  const source = await getDoc(doc(firebaseDb, await resolve(collectionName), slug));
  if (!source.exists()) throw new Error("The record no longer exists.");

  const copySlug = `${slug}-copy-${Date.now().toString(36)}`;
  await setDoc(doc(firebaseDb, await resolve(collectionName), copySlug), {
    ...source.data(),
    slug: copySlug,
    [titleField]: `${title} Copy`,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteContent(collectionName: ContentCollection, slug: string) {
  await deleteDoc(doc(firebaseDb, await resolve(collectionName), slug));
}
