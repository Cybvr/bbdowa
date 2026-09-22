"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useOwnUser } from "@/lib/firebase/client-content";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";

/** "My profile" in the nav points here so it can resolve your own slug, then send you to your creator page. */
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
    router.replace(own?.slug ? `/dashboard/creators/${own.slug}` : "/dashboard/creators");
  }, [authLoading, authUser, own, ownLoading, router]);

  return <PageLoadingSkeleton titleWidth="w-40" />;
}
