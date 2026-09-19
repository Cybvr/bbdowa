"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "@/lib/firebase/client";
import { sessionUserFromFirebaseUser, type SessionUser } from "@/lib/auth/session";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  /** The signed-in user's role from their Firestore profile, or null. */
  role: string | null;
  isAdmin: boolean;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [role, setRole] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser ? sessionUserFromFirebaseUser(firebaseUser) : null);

      if (firebaseUser) {
        try {
          const snapshot = await getDoc(doc(firebaseDb, "users", firebaseUser.uid));
          const value = snapshot.data()?.role;
          setRole(typeof value === "string" ? value : null);
        } catch {
          setRole(null);
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    });
  }, []);

  const logout = React.useCallback(async () => {
    await Promise.allSettled([
      signOut(firebaseAuth),
    ]);
    setUser(null);
    setRole(null);
    router.replace("/auth/login");
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, role, isAdmin: role === "admin", logout }}>
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
