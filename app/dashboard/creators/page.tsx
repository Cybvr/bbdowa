"use client";

import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { CreatorDirectory } from "@/components/creators-directory";
import { baseCity, isCreatorUser } from "@/lib/users";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";

export default function CreatorPage() {
  const { users, loading, error } = useFirestoreUsers();
  if (loading) return <PageLoadingSkeleton titleWidth="w-40" />;
  if (error) return <main className="flex-1 px-5 pb-16 pt-4 sm:px-8 text-sm text-muted-foreground">{error}</main>;

  const creators = users.filter(isCreatorUser);
  const categories = [...new Set(creators.map((creator) => creator.category))].sort();
  const locations = [...new Set(creators.map((creator) => baseCity(creator.location)))].sort();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-4">
      <div>
        <CreatorDirectory creators={creators} categories={categories} locations={locations} />
      </div>
    </main>
  );
}
