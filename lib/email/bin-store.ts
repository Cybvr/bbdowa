import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import type { EmailDraft } from "./draft-store";

export type EmailBinSource = "inbox" | "sent" | "draft";

export type EmailBinItem = {
  id: string;
  source: EmailBinSource;
  sourceId: string;
  subject: string;
  correspondent: string;
  originalAt: string;
  deletedAt: string;
  draft?: EmailDraft;
};

export type EmailBinCandidate = Omit<EmailBinItem, "id" | "deletedAt">;

const binCollection = collection(firebaseDb, "emailBin");
const binId = (source: EmailBinSource, sourceId: string) => `${source}_${sourceId}`;

export function subscribeEmailBin(onChange: (items: EmailBinItem[]) => void, onError: () => void): () => void {
  return onSnapshot(binCollection, (snapshot) => {
    onChange(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as EmailBinItem)
      .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt)));
  }, onError);
}

export async function moveEmailToBin(candidate: EmailBinCandidate): Promise<EmailBinItem> {
  const item: EmailBinItem = { ...candidate, id: binId(candidate.source, candidate.sourceId), deletedAt: new Date().toISOString() };
  const reference = doc(binCollection, item.id);
  if (item.source === "draft" && item.draft) {
    const batch = writeBatch(firebaseDb);
    batch.set(reference, item);
    batch.delete(doc(firebaseDb, "emailDrafts", item.sourceId));
    await batch.commit();
    return item;
  }
  await setDoc(reference, item);
  return item;
}

export async function restoreEmailFromBin(item: EmailBinItem): Promise<void> {
  const reference = doc(binCollection, item.id);
  if (item.source === "draft" && item.draft) {
    const batch = writeBatch(firebaseDb);
    batch.set(doc(firebaseDb, "emailDrafts", item.sourceId), item.draft);
    batch.delete(reference);
    await batch.commit();
    return;
  }
  await deleteDoc(reference);
}
