import type { Metadata } from "next";
import { CreatorDirectory } from "@/components/creators-directory";
import { CREATORS, CREATOR_CATEGORIES, CREATOR_LOCATIONS } from "@/lib/users";
import { PageHeader } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Creators" };

export default function CreatorPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Creators" />
      <div className="mt-6">
        <CreatorDirectory creators={CREATORS} categories={CREATOR_CATEGORIES} locations={CREATOR_LOCATIONS} />
      </div>
    </main>
  );
}
