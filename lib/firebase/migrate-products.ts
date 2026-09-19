"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";

/**
 * One-time migration: BBDO West Africa becomes a client, and every record in
 * the legacy `products` collection is rewritten as a campaign belonging to it.
 * Product-only fields (owner, objective, goals, KPIs, roadmap) are dropped.
 * The original product document is deleted once its campaign is written.
 *
 * Safe to run more than once — it re-points the same records and skips a
 * products collection that is already empty.
 */

export const BBDO_CLIENT_SLUG = "bbdo-west-africa";
export const BBDO_CLIENT_NAME = "BBDO West Africa";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type LegacyProduct = {
  slug?: string;
  name?: string;
  avatar?: string;
  status?: string;
  valueLine?: string;
  description?: string;
  created?: string | null;
};

export type MigrationResult = {
  moved: number;
  clientCreated: boolean;
};

function mapProductToCampaign(product: LegacyProduct, slug: string) {
  const created = product.created ?? null;
  const year = created ? Number(created.slice(0, 4)) || null : null;
  const summary =
    product.description?.trim() ||
    product.valueLine?.trim() ||
    "Campaign details will be added when the case-study content is supplied.";

  return {
    slug,
    name: product.name ?? slug,
    campaign: product.name ?? slug,
    clientId: BBDO_CLIENT_SLUG,
    clientName: BBDO_CLIENT_NAME,
    category: "Agency",
    year,
    ...(created && ISO_DATE.test(created) ? { liveAt: { date: created } } : {}),
    status: product.status === "active" ? "live" : "pitch",
    leadUserId: null,
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: product.avatar ?? "",
    imageAlt: product.name ?? "",
    media: [],
    summary,
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function migrateProductsToCampaigns(): Promise<MigrationResult> {
  // 1. Ensure the BBDO West Africa client exists.
  await setDoc(
    doc(firebaseDb, "clients", BBDO_CLIENT_SLUG),
    {
      type: "client",
      slug: BBDO_CLIENT_SLUG,
      name: BBDO_CLIENT_NAME,
      date: null,
      industry: "Advertising",
      profileImage: "/bbdo-west-africa.png",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  // 2. Existing campaign slugs, so a product slug can't overwrite a campaign.
  const campaignsSnapshot = await getDocs(collection(firebaseDb, "campaigns"));
  const existingSlugs = new Set(campaignsSnapshot.docs.map((entry) => entry.id));

  // 3. Move each product into a campaign, then delete the product.
  const productsSnapshot = await getDocs(collection(firebaseDb, "products"));
  let moved = 0;
  for (const entry of productsSnapshot.docs) {
    const product = entry.data() as LegacyProduct;
    const baseSlug = product.slug ?? entry.id;
    const slug = existingSlugs.has(baseSlug) ? `bbdo-${baseSlug}` : baseSlug;
    existingSlugs.add(slug);

    await setDoc(doc(firebaseDb, "campaigns", slug), mapProductToCampaign(product, slug));
    await deleteDoc(doc(firebaseDb, "products", entry.id));
    moved += 1;
  }

  return { moved, clientCreated: true };
}
