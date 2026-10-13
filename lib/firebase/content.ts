import "server-only";

import type { BlogPost } from "@/lib/blog";
import { jobUrlSlug, normalizeJob, type Job } from "@/lib/jobs";
import { MIGRATION_COLLECTION, MIGRATION_ID, collectionsFor, type MigrationState } from "@/lib/job-migration";
import type { Client } from "@/lib/clients";
import type { Opening } from "@/lib/openings";
import type { Resource } from "@/lib/resources";
import { TASK_COLLECTION, type Task } from "@/lib/creator-tasks";

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
    Object.entries(document.fields ?? {}).map(([key, value]) => [key, decodeValue(value)]),
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
    cache: "no-store",
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
  const response = await fetch(firestoreUrl(path), { cache: "no-store" });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`Firestore request failed (${response.status}) for ${path}`);
  return decodeDocument<T>((await response.json()) as FirestoreDocument);
}

export async function getClients(): Promise<Client[]> {
  return (await getCollection<Client>("clients")).sort((a, b) => a.name.localeCompare(b.name));
}

export const getClientBySlug = (slug: string) => getDocument<Client>("clients", slug);

/** Collection names, depending on whether the campaigns → jobs migration has run. */
async function collections() {
  const state = await getDocument<MigrationState>(MIGRATION_COLLECTION, MIGRATION_ID).catch(() => undefined);
  return collectionsFor(state?.done === true);
}

export async function getJobs(): Promise<Job[]> {
  const records = await getCollection<Record<string, unknown>>((await collections()).jobs);
  return records.map((record) => normalizeJob(record));
}

export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  const collectionName = (await collections()).jobs;
  const record = await getDocument<Record<string, unknown>>(collectionName, slug);
  if (record) return normalizeJob(record, slug);

  // New links use the job title while older links still use the stored slug.
  // Keep both resolving so existing bookmarks and task/payment references do
  // not break when a title-based URL is opened.
  const matchingRecord = (await getCollection<Record<string, unknown>>(collectionName))
    .map((candidate) => normalizeJob(candidate))
    .find((candidate) => jobUrlSlug(candidate) === slug);
  return matchingRecord;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  return getCollection<BlogPost>("blogs");
}

export const getBlogPostBySlug = (slug: string) => getDocument<BlogPost>("blogs", slug);

export async function getOpenings(): Promise<Opening[]> {
  return getCollection<Opening>((await collections()).openings);
}

export async function getResources(): Promise<Resource[]> {
  return (await getCollection<Resource>("resources")).sort((a, b) => a.label.localeCompare(b.label));
}

export async function getOpeningBySlug(slug: string): Promise<Opening | undefined> {
  return getDocument<Opening>((await collections()).openings, slug);
}

export const getTaskById = (id: string) =>
  getDocument<Pick<Task, "title" | "description"> & Partial<Pick<Task, "content">>>(TASK_COLLECTION, id);

/** A public job posting's headline, for the share page's title. */
export async function getJobPostingHeadline(id: string): Promise<string | undefined> {
  const posting = await getDocument<{ headline?: string }>("jobPostings", id).catch(() => undefined);
  return posting?.headline?.trim() || undefined;
}
