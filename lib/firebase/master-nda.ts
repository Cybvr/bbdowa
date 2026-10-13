import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { DOCUMENT_COLLECTION, type AgencyDocument } from "@/lib/documents";
import { MASTER_NDA_SETTINGS } from "@/lib/job-postings";
import { sendAppEmail } from "@/lib/app-email";
import { notify } from "@/lib/email/notify";

// The master NDA is an ordinary document picked in Admin → Jobs → Applicants.
// Each freelancer gets their own copy (sourceDocumentId = the master) and signs
// it once; after that, every shortlist skips the NDA step.

export type NdaState = { status: "none" | "pending" | "signed"; documentId: string | null };

export async function getMasterNdaId(): Promise<string | null> {
  const snapshot = await getDoc(doc(firebaseDb, MASTER_NDA_SETTINGS.collection, MASTER_NDA_SETTINGS.id)).catch(() => null);
  const id = snapshot?.data()?.documentId;
  return typeof id === "string" && id ? id : null;
}

export async function setMasterNdaId(documentId: string | null) {
  await setDoc(doc(firebaseDb, MASTER_NDA_SETTINGS.collection, MASTER_NDA_SETTINGS.id), { documentId, updatedAt: new Date().toISOString() });
}

/** Whether this person has been sent the master NDA, and whether they signed it. */
export async function loadNdaState(uid: string, masterId?: string | null): Promise<NdaState> {
  const templateId = masterId === undefined ? await getMasterNdaId() : masterId;
  if (!templateId) return { status: "none", documentId: null };
  const snapshot = await getDocs(query(collection(firebaseDb, DOCUMENT_COLLECTION), where("assignedTo", "==", uid)));
  const copies = snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<AgencyDocument, "id">) }))
    .filter((item) => item.sourceDocumentId === templateId);
  const signed = copies.find((item) => item.status === "signed");
  if (signed) return { status: "signed", documentId: signed.id };
  const pending = copies.find((item) => item.status === "pending_signature");
  return pending ? { status: "pending", documentId: pending.id } : { status: "none", documentId: null };
}

/** Sends the person their copy of the master NDA, unless they already have one. */
export async function sendMasterNda(
  masterId: string,
  person: { uid: string; name: string | null },
  sender: { uid: string; name: string | null },
): Promise<NdaState> {
  const current = await loadNdaState(person.uid, masterId);
  if (current.status !== "none") return current;
  const master = await getDoc(doc(firebaseDb, DOCUMENT_COLLECTION, masterId));
  if (!master.exists()) throw new Error("The master NDA document no longer exists.");
  const source = master.data() as Omit<AgencyDocument, "id">;
  const now = new Date().toISOString();
  const created = await addDoc(collection(firebaseDb, DOCUMENT_COLLECTION), {
    title: source.title, body: source.body, status: "pending_signature",
    createdBy: sender.uid, createdByName: sender.name, createdAt: now, updatedAt: now,
    assignedTo: person.uid, assignedToName: person.name ?? "Freelancer",
    signedAt: null, signedName: null, sourceDocumentId: masterId,
  });
  void sendAppEmail({ type: "document", documentId: created.id });
  void notify({ event: "document.sent", id: created.id });
  return { status: "pending", documentId: created.id };
}
