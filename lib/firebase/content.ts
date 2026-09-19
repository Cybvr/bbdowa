import "server-only";

import type { BlogPost } from "@/lib/blog";
import type { Campaign } from "@/lib/campaigns";
import type { Client } from "@/lib/clients";
import type { Job } from "@/lib/jobs";
import type { Product } from "@/lib/products";

type FirestoreValue = {
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  stringValue?: string;
  bytesValue?: string;
  referenceValue?: string;
  geoPointValue?: { latitude: number; longitude: number };
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type FirestoreListResponse = {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
};

function decodeValue(value: FirestoreValue): unknown {
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("stringValue" in value) return value.stringValue;
  if ("bytesValue" in value) return value.bytesValue;
  if ("referenceValue" in value) return value.referenceValue;
  if ("geoPointValue" in value) return value.geoPointValue;
  if ("arrayValue" in value) return (value.arrayValue?.values ?? []).map(decodeValue);
  if ("mapValue" in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue?.fields ?? {}).map(([key, entry]) => [key, decodeValue(entry)]),
    );
  }
  return null;
}

function decodeDocument<T>(document: FirestoreDocument): T {
  return Object.fromEntries(
    Object.entries(document.fields ?? {})
      .filter(([key]) => key !== "updatedAt")
      .map(([key, value]) => [key, decodeValue(value)]),
  ) as T;
}

function firestoreUrl(path: string, pageToken?: string): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const databaseId = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID ?? "bbdowa";
  if (!projectId) throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not configured");

  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents/${path}`,
  );
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (apiKey) url.searchParams.set("key", apiKey);
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  return url.toString();
}

async function firestoreFetch<T>(path: string, pageToken?: string): Promise<T> {
  const response = await fetch(firestoreUrl(path, pageToken), {
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    throw new Error(`Firestore request failed (${response.status}) for ${path}`);
  }
  return response.json() as Promise<T>;
}

async function getCollection<T>(collection: string): Promise<T[]> {
  const documents: FirestoreDocument[] = [];
  let pageToken: string | undefined;

  do {
    const page = await firestoreFetch<FirestoreListResponse>(collection, pageToken);
    documents.push(...(page.documents ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);

  return documents.map((document) => decodeDocument<T>(document));
}

async function getDocument<T>(collection: string, slug: string): Promise<T | undefined> {
  const path = `${collection}/${encodeURIComponent(slug)}`;
  const response = await fetch(firestoreUrl(path), { next: { revalidate: 60 } });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`Firestore request failed (${response.status}) for ${path}`);
  return decodeDocument<T>((await response.json()) as FirestoreDocument);
}

export async function getClients(): Promise<Client[]> {
  return (await getCollection<Client>("clients")).sort((a, b) => a.name.localeCompare(b.name));
}

export const getClientBySlug = (slug: string) => getDocument<Client>("clients", slug);

export async function getCampaigns(): Promise<Campaign[]> {
  return getCollection<Campaign>("campaigns");
}

export const getCampaignBySlug = (slug: string) => getDocument<Campaign>("campaigns", slug);

export async function getProducts(): Promise<Product[]> {
  return getCollection<Product>("products");
}

export const getProductBySlug = (slug: string) => getDocument<Product>("products", slug);

export async function getBlogPosts(): Promise<BlogPost[]> {
  return getCollection<BlogPost>("blogs");
}

export const getBlogPostBySlug = (slug: string) => getDocument<BlogPost>("blogs", slug);

export async function getJobs(): Promise<Job[]> {
  return getCollection<Job>("jobs");
}

export const getJobBySlug = (slug: string) => getDocument<Job>("jobs", slug);
