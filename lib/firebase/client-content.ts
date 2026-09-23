"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import type { BlogPost } from "@/lib/blog";
import type { Campaign } from "@/lib/campaigns";
import type { Client } from "@/lib/clients";
import { DOCUMENT_COLLECTION, sortDocuments, type AgencyDocument } from "@/lib/documents";
import type { Job } from "@/lib/jobs";
import { ACTIVITY_COLLECTION, type ActivityEntry } from "@/lib/time-tracking";
import { normalizeUser, type User } from "@/lib/users";

async function readCollection<T>(name: string): Promise<T[]> {
  const snapshot = await getDocs(collection(firebaseDb, name));
  return snapshot.docs.map((document) => document.data() as T);
}

export function readUsersFromFirestore() {
  return readCollection<User>("users").then((users) => users.map(normalizeUser));
}

export function readCampaignsFromFirestore() {
  return readCollection<Campaign>("campaigns");
}

export function readClientsFromFirestore() {
  return readCollection<Client>("clients");
}

export async function readDocumentsForAssignee(uid: string | null | undefined, slug?: string | null) {
  const keys = [...new Set([uid, slug].filter((value): value is string => Boolean(value)))];
  const snapshots = await Promise.all(keys.map((key) => getDocs(query(collection(firebaseDb, DOCUMENT_COLLECTION), where("assignedTo", "==", key)))));
  return [...new Map(snapshots.flatMap((snapshot) => snapshot.docs.map((document) => [document.id, { id: document.id, ...(document.data() as Omit<AgencyDocument, "id">) }] as const))).values()];
}

export function readTimeEntriesForUser(uid: string) {
  if (!uid) return Promise.resolve<ActivityEntry[]>([]);
  return getDocs(query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", uid))).then((snapshot) =>
    snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<ActivityEntry, "id">) })),
  );
}

type FirestoreUsersState = {
  users: User[];
  loading: boolean;
  error: string | null;
};

export function useFirestoreUsers(): FirestoreUsersState {
  const { loading: authLoading } = useAuth();
  const [state, setState] = useState<FirestoreUsersState>({ users: [], loading: true, error: null });

  useEffect(() => {
    if (authLoading) return;

    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    readUsersFromFirestore()
      .then((users) => {
        if (active) setState({ users, loading: false, error: null });
      })
      .catch((error) => {
        console.error("Unable to load users from Firestore", error);
        if (active) setState({ users: [], loading: false, error: "Unable to load users from Firestore." });
      });

    return () => {
      active = false;
    };
  }, [authLoading]);

  return state;
}

type OwnUserState = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

/**
 * The signed-in person's own directory record, read directly by uid. Unlike
 * `useFirestoreUsers`, this works for anyone signed in (not just staff),
 * since the Firestore rules let a person always read their own `users` doc.
 */
export function useOwnUser(): OwnUserState {
  const { loading: authLoading, user } = useAuth();
  const [state, setState] = useState<OwnUserState>({ user: null, loading: true, error: null });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    getDoc(doc(firebaseDb, "users", user.uid))
      .then((snapshot) => {
        if (!active) return;
        setState({ user: snapshot.exists() ? normalizeUser(snapshot.data() as User) : null, loading: false, error: null });
      })
      .catch((error) => {
        console.error("Unable to load your profile from Firestore", error);
        if (active) setState({ user: null, loading: false, error: "Unable to load your profile." });
      });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  return state;
}

type FirestoreDocumentsState = {
  documents: AgencyDocument[];
  loading: boolean;
  error: string | null;
};

export function useFirestoreDocuments(): FirestoreDocumentsState {
  const { loading: authLoading, user, role } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const [state, setState] = useState<FirestoreDocumentsState>({ documents: [], loading: true, error: null });

  useEffect(() => {
    if (authLoading) return;

    if (!user || !isStaff) {
      setState({ documents: [], loading: false, error: null });
      return;
    }

    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    getDocs(collection(firebaseDb, DOCUMENT_COLLECTION))
      .then((snapshot) =>
        snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<AgencyDocument, "id">) })),
      )
      .then((documents) => {
        if (active) setState({ documents: sortDocuments(documents), loading: false, error: null });
      })
      .catch((error) => {
        console.error("Unable to load documents from Firestore", error);
        if (active) setState({ documents: [], loading: false, error: "Unable to load documents." });
      });

    return () => {
      active = false;
    };
  }, [authLoading, isStaff, user]);

  return state;
}

export async function readContentFromFirestore() {
  const [clients, campaigns, users, blogs, jobs] = await Promise.all([
    readCollection<Client>("clients"),
    readCollection<Campaign>("campaigns"),
    readUsersFromFirestore(),
    readCollection<BlogPost>("blogs"),
    readCollection<Job>("jobs"),
  ]);

  return { clients, campaigns, users, blogs, jobs };
}
