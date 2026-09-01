import type { Metadata } from "next";
import { TalentDirectory } from "@/components/talent-directory";
import { TALENT, TALENT_CATEGORIES, TALENT_LOCATIONS } from "@/lib/users";

export const metadata: Metadata = { title: "Talent" };

export default function TalentPage() {
  return (
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-[100px] pt-6">
      <TalentDirectory
        talents={TALENT}
        categories={TALENT_CATEGORIES}
        locations={TALENT_LOCATIONS}
      />
    </main>
  );
}
