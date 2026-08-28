import type { Metadata } from "next";
import { TalentDirectory } from "@/components/talent-directory";
import { TALENT, TALENT_CATEGORIES, TALENT_LOCATIONS } from "@/lib/talent";

export const metadata: Metadata = { title: "Talent" };

export default function TalentPage() {
  return (
    <main className="flex-1 px-[clamp(24px,6vw,96px)] pb-[100px] pt-[clamp(48px,7vw,96px)]">
      <TalentDirectory
        talents={TALENT}
        categories={TALENT_CATEGORIES}
        locations={TALENT_LOCATIONS}
      />
    </main>
  );
}
