"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";

export type CreatorList = { id: string; name: string; slugs: string[] };

export type CreatorCollections = { saved: string[]; lists: CreatorList[] };

const COLLECTION = "creatorCollections";

function cleanSlugs(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((slug): slug is string => typeof slug === "string") : [];
}

function cleanLists(value: unknown): CreatorList[] {
  return Array.isArray(value)
    ? value
        .filter((list): list is CreatorList => !!list && typeof list.id === "string" && typeof list.name === "string")
        .map((list) => ({ id: list.id, name: list.name, slugs: cleanSlugs(list.slugs) }))
    : [];
}

export async function readCreatorCollections(uid: string): Promise<CreatorCollections | null> {
  const snapshot = await getDoc(doc(firebaseDb, COLLECTION, uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return { saved: cleanSlugs(data.saved), lists: cleanLists(data.lists) };
}

export async function writeCreatorCollections(uid: string, value: CreatorCollections): Promise<void> {
  await setDoc(doc(firebaseDb, COLLECTION, uid), {
    uid,
    saved: value.saved,
    lists: value.lists,
    updatedAt: serverTimestamp(),
  });
}
