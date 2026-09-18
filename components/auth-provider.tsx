"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { sessionUserFromFirebaseUser, type SessionUser } from "@/lib/auth/session";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser ? sessionUserFromFirebaseUser(firebaseUser) : null);
      setLoading(false);
    });
  }, []);

  const logout = React.useCallback(async () => {
    await Promise.allSettled([
      signOut(firebaseAuth),
    ]);
    setUser(null);
    router.replace("/auth/login");
    router.refresh();
  }, [router]);

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = React.useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function useOptionalAuth() {
  return React.useContext(AuthContext);
}
