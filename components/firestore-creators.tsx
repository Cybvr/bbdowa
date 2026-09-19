"use client";

import { CreatorCarousel } from "@/components/creator-carousel";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { isCreatorUser } from "@/lib/users";

export function FirestoreCreatorCarousel() {
  const { users, loading, error } = useFirestoreUsers();

  if (loading) return null;
  if (error) return <p className="mt-10 text-sm text-muted-foreground">{error}</p>;

  return <CreatorCarousel creators={users.filter(isCreatorUser)} />;
}
