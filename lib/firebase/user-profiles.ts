import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { needsOnboarding } from "@/lib/onboarding";
import { CLIENT_INVITES_COLLECTION } from "@/lib/clients";
import { sendSystemMessage, welcomeMessage } from "@/lib/firebase/system-messages";

export type AuthIntent = "member" | "creator";

function clean(value: string | null | undefined, maxLength: number) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function upsertUserProfile(user: FirebaseUser, intent: AuthIntent) {
  const userRef = doc(firebaseDb, "users", user.uid);
  const existingSnapshot = await getDoc(userRef);
  const existing = existingSnapshot.data() ?? {};

  const userData: Record<string, unknown> = {
    uid: user.uid,
    name: clean(user.displayName, 120),
    email: user.email,
    picture: user.photoURL,
    updatedAt: serverTimestamp(),
  };

  if (!existingSnapshot.exists()) {
    // Someone an admin invited as a client starts as a client of that company.
    const invite = user.email
      ? await getDoc(doc(firebaseDb, CLIENT_INVITES_COLLECTION, user.email.toLowerCase())).catch(() => null)
      : null;
    const inviteData = invite?.exists() ? invite.data() : null;
    if (inviteData && typeof inviteData.clientId === "string") {
      userData.role = "client";
      userData.roles = ["client"];
      userData.clientId = inviteData.clientId;
      userData.type = "client";
      userData.name = userData.name ?? (typeof inviteData.name === "string" ? inviteData.name : null);
      userData.title = typeof inviteData.title === "string" ? inviteData.title : "";
    } else {
      userData.role = "pending";
      userData.type = intent === "creator" ? "creator" : "team";
    }
    userData.createdAt = serverTimestamp();
  }

  await setDoc(userRef, userData, { merge: true });
  if (!existingSnapshot.exists() && userData.role !== "client") {
    // Not awaited: the welcome note must never slow down or block sign-in.
    void sendSystemMessage(user.uid, user.displayName, welcomeMessage(user.displayName));
  }

  return {
    isNewUser: !existingSnapshot.exists(),
    role: typeof existing.role === "string" ? existing.role : typeof userData.role === "string" ? userData.role : null,
    // New sign-ups and anyone still pending go through onboarding until they finish it once.
    // Clients skip the agency onboarding and go straight to their portal.
    needsOnboarding: (existing.role ?? userData.role) === "client" ? false : needsOnboarding({ ...existing, role: existing.role ?? userData.role }, !existingSnapshot.exists()),
  };
}
