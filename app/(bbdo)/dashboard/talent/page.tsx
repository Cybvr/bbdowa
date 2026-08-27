import type { Metadata } from "next";
import { TalentDirectory } from "@/components/talent-directory";
import { TALENT, TALENT_DISCIPLINES, TALENT_LOCATIONS } from "@/lib/talent";

export const metadata: Metadata = { title: "Talent" };

export default function TalentPage() {
  return (
    <main className="flex-1 px-[clamp(24px,6vw,96px)] pb-[100px] pt-[clamp(48px,7vw,96px)]">
      <h1 className="m-0 mb-[clamp(40px,6vw,72px)] text-[clamp(64px,13vw,180px)] uppercase leading-[0.82] tracking-[-0.07em]">
        Talent
      </h1>

      <TalentDirectory
        talents={TALENT}
        disciplines={TALENT_DISCIPLINES}
        locations={TALENT_LOCATIONS}
      />
    </main>
  );
}
