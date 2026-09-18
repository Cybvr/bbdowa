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
    needsOnboarding: intent === "creator" && (existing.role ?? userData.role) === "pending",
  };
}

export async function completeCreatorOnboarding(user: FirebaseUser, input: {
  name: string;
  craft: string;
  location: string;
  portfolio: string;
  instagram: string;
  linkedin: string;
  bio: string;
}) {
  const userRef = doc(firebaseDb, "users", user.uid);
  const existingSnapshot = await getDoc(userRef);
  const existing = existingSnapshot.data() ?? {};

  if (existing.role && existing.role !== "pending") {
    throw new Error("This account is not a pending creator account.");
  }

  const name = clean(input.name, 120) ?? clean(user.displayName, 120);
  const craft = clean(input.craft, 120);
  if (!name || !craft) throw new Error("Your name and primary craft are required.");

  await setDoc(userRef, {
    uid: user.uid,
    email: user.email ?? existing.email ?? null,
    name,
    picture: user.photoURL ?? existing.picture ?? null,
    type: "creator",
    role: "pending",
    craft,
    portfolio: clean(input.portfolio, 500),
    onboardingStatus: "submitted",
    creatorProfile: {
      name,
      craft,
      location: clean(input.location, 120),
      portfolio: clean(input.portfolio, 500),
      bio: clean(input.bio, 800),
      instagram: clean(input.instagram, 160),
      linkedin: clean(input.linkedin, 160),
    },
    onboardingCompletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
