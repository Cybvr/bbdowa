"use client";

import { useEffect, useSyncExternalStore } from "react";
import { arrayRemove, arrayUnion, doc, onSnapshot, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";

// Saved jobs live on the person's own user record as `savedJobs: string[]`.
// One shared listener per signed-in person, however many cards are on screen.
let currentUid: string | null = null;
let saved: string[] = [];
let unsubscribe: (() => void) | null = null;
const listeners = new Set<() => void>();
let users = 0;

function emit() {
  listeners.forEach((listener) => listener());
}

function watch(uid: string | null) {
  if (uid === currentUid) return;
  unsubscribe?.();
  unsubscribe = null;
  currentUid = uid;
  saved = [];
  emit();
  if (!uid) return;
  unsubscribe = onSnapshot(
    doc(firebaseDb, "users", uid),
    (snapshot) => {
      const value = snapshot.data()?.savedJobs;
      saved = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
      emit();
    },
    () => {
      saved = [];
      emit();
    },
  );
}

const EMPTY: string[] = [];

/** Slugs of the jobs this person has saved, kept live. */
export function useSavedJobs(uid: string | null | undefined): string[] {
  useEffect(() => {
    users += 1;
    watch(uid ?? null);
    return () => {
      users -= 1;
      if (users === 0) watch(null);
    };
  }, [uid]);
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => (currentUid && currentUid === uid ? saved : EMPTY),
    () => EMPTY,
  );
}

export async function setJobSaved(uid: string, slug: string, save: boolean) {
  await setDoc(doc(firebaseDb, "users", uid), { savedJobs: save ? arrayUnion(slug) : arrayRemove(slug) }, { merge: true });
}
