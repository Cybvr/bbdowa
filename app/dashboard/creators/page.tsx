import type { Metadata } from "next";
import { CreatorDirectory } from "@/components/creators-directory";
import { CREATORS, CREATOR_CATEGORIES, CREATOR_LOCATIONS } from "@/lib/users";

export const metadata: Metadata = { title: "Creators" };

export default function CreatorPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8">
      <div>
        <CreatorDirectory creators={CREATORS} categories={CREATOR_CATEGORIES} locations={CREATOR_LOCATIONS} />
      </div>
    </main>
  );
}
