"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import type { BlogPost } from "@/lib/blog";
import type { Campaign } from "@/lib/campaigns";
import type { Client } from "@/lib/clients";
import type { Job } from "@/lib/jobs";
import type { Product } from "@/lib/products";
import type { User } from "@/lib/users";

async function readCollection<T>(name: string): Promise<T[]> {
  const snapshot = await getDocs(collection(firebaseDb, name));
  return snapshot.docs.map((document) => document.data() as T);
}

export function readUsersFromFirestore() {
  return readCollection<User>("users");
}

export function readCampaignsFromFirestore() {
  return readCollection<Campaign>("campaigns");
}

export function readProductsFromFirestore() {
  return readCollection<Product>("products");
}

type FirestoreUsersState = {
  users: User[];
  loading: boolean;
  error: string | null;
};

export function useFirestoreUsers(): FirestoreUsersState {
  const { loading: authLoading, user, isAdmin } = useAuth();
  const [state, setState] = useState<FirestoreUsersState>({ users: [], loading: true, error: null });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState({ users: [], loading: false, error: "You must be signed in to view users." });
      return;
    }

    if (!isAdmin) {
      setState({ users: [], loading: false, error: "An admin account is required to view users." });
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
  }, [authLoading, isAdmin, user]);

  return state;
}

export async function readContentFromFirestore() {
  const [clients, campaigns, users, products, blogs, jobs] = await Promise.all([
    readCollection<Client>("clients"),
    readCollection<Campaign>("campaigns"),
    readCollection<User>("users"),
    readCollection<Product>("products"),
    readCollection<BlogPost>("blogs"),
    readCollection<Job>("jobs"),
  ]);

  return { clients, campaigns, users, products, blogs, jobs };
}
