"use client";

import { collection, getDocs } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import type { BlogPost } from "@/lib/blog";
import type { Campaign } from "@/lib/campaigns";
import type { Client } from "@/lib/clients";
import type { Job } from "@/lib/jobs";
import type { Product } from "@/lib/products";
import type { User } from "@/lib/users";

async function readCollection<T>(name: string): Promise<T[]> {
  try {
    const snapshot = await getDocs(collection(firebaseDb, name));
    return snapshot.docs.map((document) => document.data() as T);
  } catch {
    return [];
  }
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
