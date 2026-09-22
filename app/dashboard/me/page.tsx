"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useOwnUser } from "@/lib/firebase/client-content";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { isCreatorUser } from "@/lib/users";

/**
 * "My profile" in the nav points here so it can resolve to wherever your
 * own profile actually lives — the creator page for a creator, or the
 * self-service settings form for staff who don't have one.
 */
export default function MyProfileRedirectPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const { user: own, loading: ownLoading } = useOwnUser();

  React.useEffect(() => {
    if (authLoading || ownLoading) return;
    if (!authUser) {
      router.replace("/auth/login");
      return;
    }
    router.replace(own?.slug && isCreatorUser(own) ? `/dashboard/creators/${own.slug}` : "/dashboard/settings");
  }, [authLoading, authUser, own, ownLoading, router]);

  return <PageLoadingSkeleton titleWidth="w-40" />;
}
