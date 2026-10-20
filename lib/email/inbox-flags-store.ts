import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";

export type InboxFlags = { starred: boolean; important: boolean };
export type InboxFlagsById = Record<string, InboxFlags>;

const flagsCollection = collection(firebaseDb, "emailInboxFlags");

export function subscribeInboxFlags(onChange: (flags: InboxFlagsById) => void, onError: () => void): () => void {
  return onSnapshot(flagsCollection, (snapshot) => {
    const flags: InboxFlagsById = {};
    snapshot.docs.forEach((item) => {
      const data = item.data();
      flags[item.id] = { starred: data.starred === true, important: data.important === true };
    });
    onChange(flags);
  }, onError);
}

export async function saveInboxFlags(id: string, flags: InboxFlags): Promise<void> {
  await setDoc(doc(flagsCollection, id), { id, ...flags });
}
