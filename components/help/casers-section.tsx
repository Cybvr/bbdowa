import Link from "next/link";
import { SectionHeading } from "@/components/dashboard/ui";

const PROSE = "m-0 max-w-[70ch] text-[15px] leading-[1.5]";

export const CASERS_HEADINGS = ["Who we are", "How BBDO West Africa fits in"];

export function CasersSection() {
  return (
    <div className="grid grid-cols-1 gap-8">
      <section>
        <SectionHeading>Who we are</SectionHeading>
        <p className={PROSE}>Casers Group is the parent group of BBDO West Africa, chaired by Enyi Odigbo.</p>
        <p className={`${PROSE} mt-3 text-muted-foreground`}>More about the group is coming soon.</p>
      </section>

      <section>
        <SectionHeading>How BBDO West Africa fits in</SectionHeading>
        <p className={PROSE}>
          The group&apos;s leadership sits at the top of the agency structure. See{" "}
          <Link href="/dashboard/help?tab=team" className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">The team</Link>{" "}
          for the full organogram.
        </p>
      </section>
    </div>
  );
}
