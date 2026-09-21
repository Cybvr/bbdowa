"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import type { BlogPost } from "@/lib/blog";
import type { Campaign } from "@/lib/campaigns";
import type { Client } from "@/lib/clients";
import { CONTRACT_TEMPLATE_COLLECTION, sortContractTemplates, type ContractTemplate } from "@/lib/contract-templates";
import type { Job } from "@/lib/jobs";
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

type FirestoreUsersState = {
  users: User[];
  loading: boolean;
  error: string | null;
};

export function useFirestoreUsers(): FirestoreUsersState {
  const { loading: authLoading, user, isAdmin, role } = useAuth();
  const isStaff = isAdmin || role === "manager";
  const [state, setState] = useState<FirestoreUsersState>({ users: [], loading: true, error: null });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState({ users: [], loading: false, error: "You must be signed in to view users." });
      return;
    }

    if (!isStaff) {
      setState({ users: [], loading: false, error: "An admin or manager account is required to view users." });
      return;
    }

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
  }, [authLoading, isStaff, user]);

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

type FirestoreContractTemplatesState = {
  templates: ContractTemplate[];
  loading: boolean;
  error: string | null;
};

export function useFirestoreContractTemplates(): FirestoreContractTemplatesState {
  const { loading: authLoading, user, isAdmin, role } = useAuth();
  const isStaff = isAdmin || role === "manager";
  const [state, setState] = useState<FirestoreContractTemplatesState>({ templates: [], loading: true, error: null });

  useEffect(() => {
    if (authLoading) return;

    if (!user || !isStaff) {
      setState({ templates: [], loading: false, error: null });
      return;
    }

    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    getDocs(collection(firebaseDb, CONTRACT_TEMPLATE_COLLECTION))
      .then((snapshot) => snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<ContractTemplate, "id">) })))
      .then((templates) => {
        if (active) setState({ templates: sortContractTemplates(templates), loading: false, error: null });
      })
      .catch((error) => {
        console.error("Unable to load agreement templates from Firestore", error);
        if (active) setState({ templates: [], loading: false, error: "Unable to load agreement templates." });
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
