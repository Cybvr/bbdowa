"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "@/lib/firebase/client";
import { sessionUserFromFirebaseUser, type SessionUser } from "@/lib/auth/session";
import { needsOnboarding } from "@/lib/onboarding";

type AuthContextValue = {
  user: SessionUser | null;
  actualUser: SessionUser | null;
  loading: boolean;
  /** The signed-in user's role from their Firestore profile, or null. */
  role: string | null;
  /** True when an admin has switched onboarding on for the signed-in person and they haven't finished it. */
  onboardingDue: boolean;
  /** Call once onboarding is finished so the dashboard stops redirecting. */
  markOnboarded: () => void;
  isAdmin: boolean;
  isViewingAs: boolean;
  viewAsUser: SessionUser | null;
  startViewingAs: (target: { uid: string; name: string | null; email: string | null; picture?: string | null; role: string | null }) => void;
  stopViewingAs: () => void;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);
const VIEW_AS_STORAGE_KEY = "bbdowa.view-as";

type ViewAsState = {
  ownerUid: string;
  user: SessionUser;
  role: string | null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [actualUser, setActualUser] = React.useState<SessionUser | null>(null);
  const [actualRole, setActualRole] = React.useState<string | null>(null);
  const [onboardingDue, setOnboardingDue] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [viewAs, setViewAs] = React.useState<ViewAsState | null>(null);
  const [viewAsLoaded, setViewAsLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(VIEW_AS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ViewAsState;
        if (parsed?.ownerUid && parsed?.user?.uid && typeof parsed.role === "string") {
          setViewAs(parsed);
        }
      }
    } catch {
      window.sessionStorage.removeItem(VIEW_AS_STORAGE_KEY);
    } finally {
      setViewAsLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setActualUser(firebaseUser ? sessionUserFromFirebaseUser(firebaseUser) : null);

      if (firebaseUser) {
        try {
          const snapshot = await getDoc(doc(firebaseDb, "users", firebaseUser.uid));
          const data = snapshot.data() ?? {};
          setActualRole(typeof data.role === "string" ? data.role : null);
          // Only the admin switch forces a redirect; the default rule runs at sign-in.
          setOnboardingDue(data.onboardingRequired === true && needsOnboarding(data));
        } catch {
          setActualRole(null);
          setOnboardingDue(false);
        }
      } else {
        setActualRole(null);
        setOnboardingDue(false);
      }

      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    if (loading || !viewAs) return;
    if (!actualUser || actualRole !== "admin" || viewAs.ownerUid !== actualUser.uid) {
      setViewAs(null);
      window.sessionStorage.removeItem(VIEW_AS_STORAGE_KEY);
    }
  }, [actualRole, actualUser, loading, viewAs]);

  const startViewingAs = React.useCallback(
    (target: { uid: string; name: string | null; email: string | null; picture?: string | null; role: string | null }) => {
      if (!actualUser || actualRole !== "admin" || !target.uid || target.uid === actualUser.uid) return;
      const next: ViewAsState = {
        ownerUid: actualUser.uid,
        user: {
          uid: target.uid,
          name: target.name,
          email: target.email,
          picture: target.picture ?? null,
        },
        role: target.role,
      };
      setViewAs(next);
      window.sessionStorage.setItem(VIEW_AS_STORAGE_KEY, JSON.stringify(next));
      router.push("/dashboard");
    },
    [actualRole, actualUser, router],
  );

  const stopViewingAs = React.useCallback(() => {
    setViewAs(null);
    window.sessionStorage.removeItem(VIEW_AS_STORAGE_KEY);
  }, []);

  const logout = React.useCallback(async () => {
    await Promise.allSettled([
      signOut(firebaseAuth),
    ]);
    stopViewingAs();
    setActualUser(null);
    setActualRole(null);
    router.replace("/auth/login");
    router.refresh();
  }, [router, stopViewingAs]);

  const markOnboarded = React.useCallback(() => setOnboardingDue(false), []);
  const activeViewAs = viewAsLoaded && actualRole === "admin" ? viewAs : null;
  const user = activeViewAs?.user ?? actualUser;
  const role = activeViewAs?.role ?? actualRole;

  return (
    <AuthContext.Provider
      value={{
        user,
        actualUser,
        loading,
        role,
        // Viewing as someone never redirects the admin into that person's onboarding.
        onboardingDue: onboardingDue && !activeViewAs,
        markOnboarded,
        isAdmin: role === "admin",
        isViewingAs: Boolean(activeViewAs),
        viewAsUser: activeViewAs?.user ?? null,
        startViewingAs,
        stopViewingAs,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = React.useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function useOptionalAuth() {
  return React.useContext(AuthContext);
}
