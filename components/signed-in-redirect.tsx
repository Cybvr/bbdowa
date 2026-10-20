"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

/** Returning users enter their workspace instead of seeing the public entry pages. */
export function SignedInRedirect({ children, redirectTo = "/dashboard" }: { children: ReactNode; redirectTo?: string }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [guestEntry, setGuestEntry] = useState(false);
  const destination = role === "client" ? "/portal" : redirectTo;

  useEffect(() => {
    if (loading || guestEntry) return;
    // Once a guest starts signing in, let the form finish profile creation and onboarding.
    if (!user) setGuestEntry(true);
    else router.replace(destination);
  }, [destination, guestEntry, loading, router, user]);

  if (loading || (user && !guestEntry)) return null;
  return <>{children}</>;
}
