// Server-only. Reads Firestore over REST using the signed-in person's own ID token,
// so security rules still decide what the caller may see. No admin credentials needed.

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

export type PlainDoc = Record<string, unknown> & { id: string };

function projectId() {
  return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID ?? "";
}

function databaseId() {
  return process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID ?? process.env.FIREBASE_FIRESTORE_DATABASE_ID ?? "bbdowa";
}

function base() {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId())}/databases/${encodeURIComponent(databaseId())}/documents`;
}

function decodeValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue?.values ?? []).map(decodeValue);
  if ("mapValue" in value) return decodeFields(value.mapValue?.fields ?? {});
  return null;
}

function decodeFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function toDoc(document: { name: string; fields?: Record<string, FirestoreValue> }): PlainDoc {
  return { ...decodeFields(document.fields ?? {}), id: document.name.split("/").pop() ?? "" };
}

/** Reads one document, or null if it doesn't exist or the rules don't let the caller read it. */
export async function getDocument(path: string, idToken: string): Promise<PlainDoc | null> {
  const response = await fetch(`${base()}/${path.split("/").map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return toDoc(await response.json());
}

/** Documents in a collection where `field` equals `value`. */
export async function queryEquals(collectionId: string, field: string, value: string, idToken: string, limit = 25): Promise<PlainDoc[]> {
  const response = await fetch(`${base()}:runQuery`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: { stringValue: value } } },
        limit,
      },
    }),
  });
  if (!response.ok) return [];
  const rows = (await response.json()) as Array<{ document?: { name: string; fields?: Record<string, FirestoreValue> } }>;
  return rows.flatMap((row) => (row.document ? [toDoc(row.document)] : []));
}
