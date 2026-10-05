"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import { normalizeJob, type Job } from "@/lib/jobs";
import type { Client } from "@/lib/clients";
import { DOCUMENT_COLLECTION, sortDocuments, type AgencyDocument } from "@/lib/documents";
import { TASK_COLLECTION, sortTasks, type Task } from "@/lib/creator-tasks";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { ACTIVITY_COLLECTION, type ActivityEntry } from "@/lib/time-tracking";
import { normalizeUser, type User } from "@/lib/users";

async function readCollection<T>(name: string): Promise<T[]> {
  const snapshot = await getDocs(collection(firebaseDb, name));
  return snapshot.docs.map((document) => document.data() as T);
}

export function readUsersFromFirestore() {
  return readCollection<User>("users").then((users) => users.map(normalizeUser));
}

export async function readUserForNjeri(uid: string) {
  const direct = await getDoc(doc(firebaseDb, "users", uid));
  if (direct.exists()) return normalizeUser(direct.data() as User);
  const match = (await getDocs(query(collection(firebaseDb, "users"), where("uid", "==", uid), limit(1)))).docs[0];
  return match ? normalizeUser(match.data() as User) : null;
}

export async function readJobsFromFirestore() {
  const snapshot = await getDocs(collection(firebaseDb, await jobsCollection()));
  return snapshot.docs.map((document) => normalizeJob(document.data(), document.id));
}

export function readClientsFromFirestore() {
  return readCollection<Client>("clients");
}

/** Clients sorted by name, for pickers. Keeps the job's current client listed even if it was removed. */
export function useClientOptions(current?: { clientId: string; clientName: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  useEffect(() => {
    let active = true;
    readClientsFromFirestore()
      .then((items) => { if (active) setClients(items); })
      .catch((cause) => console.error("Unable to load clients", cause));
    return () => { active = false; };
  }, []);
  return useMemo(() => {
    const options = clients.map((client) => ({ value: client.slug, label: client.name })).sort((a, b) => a.label.localeCompare(b.label));
    if (current?.clientId && !options.some((option) => option.value === current.clientId)) options.unshift({ value: current.clientId, label: current.clientName || current.clientId });
    return options;
  }, [clients, current?.clientId, current?.clientName]);
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

export function readTasksForNjeri(uid: string, isStaff: boolean) {
  const tasksQuery = isStaff
    ? collection(firebaseDb, TASK_COLLECTION)
    : query(collection(firebaseDb, TASK_COLLECTION), where("assignedTo", "==", uid));
  return getDocs(tasksQuery).then((snapshot) =>
    snapshot.docs.map((task) => ({ id: task.id, ...(task.data() as Omit<Task, "id">) })),
  );
}

export function readDocumentsForNjeri(uid: string, slug: string | null | undefined, isStaff: boolean) {
  if (!isStaff) return readDocumentsForAssignee(uid, slug);
  return getDocs(collection(firebaseDb, DOCUMENT_COLLECTION)).then((snapshot) =>
    snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<AgencyDocument, "id">) })),
  );
}

export function readTimeEntriesForNjeri(uid: string, isStaff: boolean) {
  if (!isStaff) return readTimeEntriesForUser(uid);
  return getDocs(query(collection(firebaseDb, ACTIVITY_COLLECTION), orderBy("startedAt", "desc"), limit(500))).then((snapshot) =>
    snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<ActivityEntry, "id">) })),
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

type FirestoreTasksState = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
};

export function useFirestoreTasks(refreshToken = 0): FirestoreTasksState {
  const { loading: authLoading, user, role } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const [state, setState] = useState<FirestoreTasksState>({ tasks: [], loading: true, error: null });

  useEffect(() => {
    if (authLoading) return;

    if (!user || !isStaff) {
      setState({ tasks: [], loading: false, error: null });
      return;
    }

    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    getDocs(collection(firebaseDb, TASK_COLLECTION))
      .then((snapshot) =>
        snapshot.docs.map((task) => ({ id: task.id, ...(task.data() as Omit<Task, "id">) })),
      )
      .then((tasks) => {
        if (active) setState({ tasks: sortTasks(tasks), loading: false, error: null });
      })
      .catch((error) => {
        console.error("Unable to load tasks from Firestore", error);
        if (active) setState({ tasks: [], loading: false, error: "Unable to load tasks." });
      });

    return () => {
      active = false;
    };
  }, [authLoading, isStaff, refreshToken, user]);

  return state;
}
