"use client";

import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { CreatorDirectory } from "@/components/creators-directory";
import { CreatorCreateAction } from "@/components/creator-create-action";
import { baseCity, isCreatorUser } from "@/lib/users";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";

export default function DiscoverPage() {
  const { users, loading, error } = useFirestoreUsers();
  if (loading) return <PageLoadingSkeleton titleWidth="w-40" />;
  if (error) return <main className="flex-1 px-5 pb-16 pt-4 sm:px-8 text-sm text-muted-foreground">{error}</main>;

  const creators = users.filter(isCreatorUser);
  const categories = [...new Set(creators.map((creator) => creator.category))].sort();
  const locations = [...new Set(creators.map((creator) => baseCity(creator.location)))].sort();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
      <div>
        <div className="mb-4 flex justify-end">
          <CreatorCreateAction existingSlugs={users.map((user) => user.slug)} categoryOptions={categories} />
        </div>
        <CreatorDirectory creators={creators} categories={categories} locations={locations} />
      </div>
    </main>
  );
}
