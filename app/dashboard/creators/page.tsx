import type { Metadata } from "next";
import { CreatorDirectory } from "@/components/creators-directory";
import { baseCity, isCreatorUser } from "@/lib/users";
import { getUsers } from "@/lib/firebase/content";

export const metadata: Metadata = { title: "Creators" };

export default async function CreatorPage() {
  const users = await getUsers();
  const creators = users.filter(isCreatorUser);
  const categories = [...new Set(creators.map((creator) => creator.category))].sort();
  const locations = [...new Set(creators.map((creator) => baseCity(creator.location)))].sort();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-8">
      <div>
        <CreatorDirectory creators={creators} categories={categories} locations={locations} />
      </div>
    </main>
  );
}
