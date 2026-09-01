import type { Metadata } from "next";
import { CreatorDirectory } from "@/components/creators-directory";
import { CREATORS, CREATOR_CATEGORIES, CREATOR_LOCATIONS } from "@/lib/users";

export const metadata: Metadata = { title: "Creators" };

export default function CreatorPage() {
  return (
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-[100px] pt-6">
      <CreatorDirectory
        creators={CREATORS}
        categories={CREATOR_CATEGORIES}
        locations={CREATOR_LOCATIONS}
      />
    </main>
  );
}
