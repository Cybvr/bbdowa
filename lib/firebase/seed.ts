// One-off migration: push the static lib data into Firestore collections.
// Runs in the browser as the signed-in admin; Firestore rules enforce that
// only an admin can write. Safe to re-run — every write is a merge keyed by
// slug, so it updates existing docs instead of duplicating them.

import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { CLIENTS } from "@/lib/clients";
import { CAMPAIGNS } from "@/lib/campaigns";
import { USERS } from "@/lib/users";
import { PRODUCTS } from "@/lib/products";
import { BLOG_POSTS } from "@/lib/blog";
import { JOBS } from "@/lib/jobs";

type SeedDoc = { id: string; data: Record<string, unknown> };
type SeedGroup = { name: string; collection: string; docs: SeedDoc[] };
export type SeedResult = { name: string; collection: string; count: number };

// Firestore rejects undefined values; the round-trip drops them (the data is
// plain JSON — strings, numbers, booleans, null, arrays and nested objects).
function clean(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value));
}

function toDocs<T extends { slug: string }>(
  items: T[],
  extra?: (item: T) => Record<string, unknown>,
): SeedDoc[] {
  return items.map((item) => ({ id: item.slug, data: clean({ ...item, ...(extra?.(item) ?? {}) }) }));
}

export const SEED_GROUPS: SeedGroup[] = [
  { name: "Clients", collection: "clients", docs: toDocs(CLIENTS) },
  { name: "Campaigns", collection: "campaigns", docs: toDocs(CAMPAIGNS) },
  // Directory users are keyed by slug; uid mirrors it so the users rules
  // (which require request.resource.data.uid == docId) accept the write.
  { name: "Users", collection: "users", docs: toDocs(USERS, (user) => ({ uid: user.slug })) },
  { name: "Products", collection: "products", docs: toDocs(PRODUCTS) },
  { name: "Blog posts", collection: "blogs", docs: toDocs(BLOG_POSTS) },
  { name: "Jobs", collection: "jobs", docs: toDocs(JOBS) },
];

const BATCH_LIMIT = 400; // Firestore allows up to 500 writes per batch.

export async function seedFirestore(onProgress?: (result: SeedResult) => void): Promise<SeedResult[]> {
  const results: SeedResult[] = [];

  for (const group of SEED_GROUPS) {
    for (let start = 0; start < group.docs.length; start += BATCH_LIMIT) {
      const batch = writeBatch(firebaseDb);
      for (const entry of group.docs.slice(start, start + BATCH_LIMIT)) {
        batch.set(
          doc(collection(firebaseDb, group.collection), entry.id),
          { ...entry.data, updatedAt: serverTimestamp() },
          { merge: true },
        );
      }
      await batch.commit();
    }

    const result: SeedResult = { name: group.name, collection: group.collection, count: group.docs.length };
    results.push(result);
    onProgress?.(result);
  }

  return results;
}
