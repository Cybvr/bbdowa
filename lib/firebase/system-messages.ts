import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { CONVERSATIONS_COLLECTION, conversationId } from "@/lib/messages";

/** The sender id for automatic messages from Bantaba itself. */
export const SYSTEM_SENDER = "bantaba";

/**
 * Posts an automatic message from Bantaba into the person's messages. Never
 * throws: a welcome note failing must not block sign-up or onboarding.
 */
export async function sendSystemMessage(uid: string, name: string | null | undefined, text: string) {
  try {
    const id = conversationId(uid, SYSTEM_SENDER);
    const now = new Date().toISOString();
    await setDoc(
      doc(firebaseDb, CONVERSATIONS_COLLECTION, id),
      {
        participants: [uid, SYSTEM_SENDER].sort(),
        names: { [uid]: name || "You", [SYSTEM_SENDER]: "Bantaba" },
        pictures: { [SYSTEM_SENDER]: "/bbdo-west-africa.png" },
        lastMessage: text.slice(0, 200),
        lastSenderId: SYSTEM_SENDER,
        updatedAt: now,
      },
      { merge: true },
    );
    await addDoc(collection(firebaseDb, CONVERSATIONS_COLLECTION, id, "messages"), {
      senderId: SYSTEM_SENDER,
      system: true,
      text,
      createdAt: now,
    });
  } catch (cause) {
    console.error("Unable to send system message", cause);
  }
}

const firstName = (name: string | null | undefined) => name?.trim().split(/\s+/)[0] || "there";

export function welcomeMessage(name: string | null | undefined) {
  return `Welcome to Bantaba, ${firstName(name)}! This is where you'll find your jobs, tasks, time tracking and payments. Start by finishing your onboarding: it takes about 5 minutes. Go to Settings → Onboarding, or open /onboarding.`;
}

export function onboardingDoneMessage(name: string | null | undefined) {
  return `Thanks for finishing onboarding, ${firstName(name)}. You're all set. Check Jobs for open work, and My jobs once you're added to a team. Reply here if you need anything.`;
}
