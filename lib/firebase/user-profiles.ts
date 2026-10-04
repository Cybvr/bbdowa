import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";

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
    userData.role = "pending";
    userData.type = intent === "creator" ? "creator" : "team";
    userData.createdAt = serverTimestamp();
  }

  await setDoc(userRef, userData, { merge: true });

  return {
    isNewUser: !existingSnapshot.exists(),
    role: typeof existing.role === "string" ? existing.role : typeof userData.role === "string" ? userData.role : null,
    // New sign-ups and anyone still pending go through onboarding until they finish it once.
    needsOnboarding: !existing.onboardingCompletedAt && (!existingSnapshot.exists() || (existing.role ?? userData.role) === "pending"),
  };
}
