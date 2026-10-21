import type { MessageGroup } from "@/lib/notifications";
import { collection, deleteDoc, doc, getDocs, onSnapshot, runTransaction, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";

export type EmailDraftRecipient =
  | { kind: "group"; key: MessageGroup; label: string }
  | { kind: "person"; uid: string; label: string; email: string }
  | { kind: "email"; address: string; label: string };

export type EmailDraft = {
  id: string;
  recipients: EmailDraftRecipient[];
  query: string;
  subject: string;
  message: string;
  templateKey: string;
  updatedAt: string;
};

export const emailDraftStorageKey = (uid: string) => `bbdowa.email-drafts:${uid}`;
const draftCollection = collection(firebaseDb, "emailDrafts");
const draftDocument = (id: string) => doc(draftCollection, id);

function isDraftRecipient(value: unknown): value is EmailDraftRecipient {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.label !== "string") return false;
  if (item.kind === "group") return typeof item.key === "string";
  if (item.kind === "person") return typeof item.uid === "string" && typeof item.email === "string";
  if (item.kind === "email") return typeof item.address === "string";
  return false;
}

export function readEmailDrafts(uid: string): EmailDraft[] {
  if (!uid || typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(emailDraftStorageKey(uid)) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is EmailDraft =>
      item !== null && typeof item === "object"
      && typeof item.id === "string"
      && Array.isArray(item.recipients)
      && item.recipients.every(isDraftRecipient)
      && typeof item.query === "string"
      && typeof item.subject === "string"
      && typeof item.message === "string"
      && typeof item.templateKey === "string"
      && typeof item.updatedAt === "string"
      && !Number.isNaN(Date.parse(item.updatedAt))
    ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export async function listEmailDrafts(): Promise<EmailDraft[]> {
  const snapshot = await getDocs(draftCollection);
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as EmailDraft)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function subscribeEmailDrafts(onChange: (drafts: EmailDraft[]) => void, onError: () => void): () => void {
  return onSnapshot(draftCollection, (snapshot) => {
    onChange(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as EmailDraft)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }, onError);
}

export async function saveEmailDraft(draft: EmailDraft): Promise<void> {
  await setDoc(draftDocument(draft.id), draft);
}

export async function removeEmailDraft(id: string): Promise<void> {
  await deleteDoc(draftDocument(id));
}

/** Copy drafts from the old browser-only store without overwriting cloud drafts. */
export async function migrateEmailDrafts(uid: string): Promise<EmailDraft[]> {
  const legacy = readEmailDrafts(uid);
  if (!legacy.length) return listEmailDrafts();
  for (const draft of legacy) {
    const reference = draftDocument(draft.id);
    await runTransaction(firebaseDb, async (transaction) => {
      const existing = await transaction.get(reference);
      if (!existing.exists()) transaction.set(reference, draft);
    });
  }
  const drafts = await listEmailDrafts();
  window.localStorage.removeItem(emailDraftStorageKey(uid));
  return drafts;
}
