import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { needsOnboarding } from "@/lib/onboarding";
import { CLIENT_INVITES_COLLECTION } from "@/lib/clients";
import { sendSystemMessage, welcomeMessage } from "@/lib/firebase/system-messages";
import { sendAppEmail } from "@/lib/app-email";

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
      userData.role = intent === "creator" ? "creator" : "pending";
      userData.roles = intent === "creator" ? ["creator"] : [];
      userData.type = intent === "creator" ? "creator" : "team";
    }
    userData.createdAt = serverTimestamp();
  } else if (existing.role === "pending" && existing.type === "creator") {
    // Promote creator accounts made under the old approval flow when they next sign in.
    userData.role = "creator";
    userData.roles = ["creator"];
  }

  await setDoc(userRef, userData, { merge: true });
  if (!existingSnapshot.exists()) await sendAppEmail({ type: "welcome" });
  if (!existingSnapshot.exists() && userData.role !== "client") {
    // Not awaited: the welcome note must never slow down or block sign-in.
    void sendSystemMessage(user.uid, user.displayName, welcomeMessage(user.displayName));
  }

  const resolvedRole = userData.role ?? existing.role;

  return {
    isNewUser: !existingSnapshot.exists(),
    role: typeof resolvedRole === "string" ? resolvedRole : null,
    // Public creator sign-ups enter the dashboard immediately. Pending legacy
    // members still onboard, and admins can explicitly require onboarding.
    needsOnboarding: resolvedRole === "client"
      ? false
      : needsOnboarding({ ...existing, role: resolvedRole }, resolvedRole === "pending" && !existingSnapshot.exists()),
  };
}
