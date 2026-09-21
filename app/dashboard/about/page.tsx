import type { Metadata } from "next";
import { PageHeader, SectionHeading, StatItem, StatRow } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "About" };

const FACTS = [
  { value: "15", label: "Pitch stages" },
  { value: "6", label: "Industry labs" },
  { value: "40+", label: "Awards" },
];

export default function AboutPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
      <PageHeader title="About" meta="BBDO West Africa" />

      <p className="mt-8 max-w-[42ch] text-[22px] font-semibold leading-tight tracking-tight sm:text-[28px]">
        The most preferred <span className="text-primary">shapers of choice</span> across the African
        continent.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <section>
          <SectionHeading>Akwaaba</SectionHeading>
          <p className="mb-0 mt-0 max-w-[42ch] text-[15px] leading-[1.5]">
            Welcome to Bantaba, our shared home for agency information and working knowledge. A
            bantaba is the traditional gathering place, often a large meeting tree, where community
            members congregate for dialogue, storytelling and collective decision-making. This is
            ours.
          </p>
        </section>

        <section>
          <SectionHeading>Mission</SectionHeading>
          <p className="mb-0 mt-0 max-w-[42ch] text-[15px] leading-[1.5]">
            Compelling commercial content that drives brand value and grows our clients&apos;
            businesses.
          </p>
        </section>

        <section>
          <SectionHeading>Vision</SectionHeading>
          <p className="mb-0 mt-0 max-w-[42ch] text-[15px] leading-[1.5]">
            To become the most preferred shapers of choice across the African continent. From Lagos,
            we develop culturally relevant, insightful and effective campaigns across the West
            African sub-region, in the BBDO tradition of The Work, The Work, The Work.
          </p>
        </section>

        <section>
          <SectionHeading>Who we are</SectionHeading>
          <p className="mb-3 mt-0 max-w-[42ch] text-[15px] leading-[1.5]">
            BBDO West Africa is the Lagos studio of the BBDO network and the hub for the West
            African sub-region. We make culturally relevant, insightful and effective campaigns
            that drive brand value and grow our clients&apos; businesses.
          </p>
          <p className="mb-0 mt-0 max-w-[42ch] text-[15px] leading-[1.5]">
            We hold to the network tradition of The Work, The Work, The Work: creativity that
            proves itself in market. Do Big Things is not a tagline for us. It is the size of the
            problem we take on.
          </p>
        </section>

        <section>
          <SectionHeading>What we do</SectionHeading>
          <ul className="m-0 list-none p-0">
            {[
              "Brand strategy and positioning",
              "Campaign ideas and creative",
              "Social and content",
              "Production, broadcast to print",
              "Media and reputation planning",
            ].map((service) => (
              <li key={service} className="border-b border-border py-2.5 text-[15px] leading-[1.3]">
                {service}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionHeading>How we work</SectionHeading>
          <p className="mb-3 mt-0 max-w-[42ch] text-[15px] leading-[1.5]">
            Small teams, short lines, no ceremony. Strategy sits in the room with creative from day
            one and the work gets pressure tested early.
          </p>
          <p className="mb-0 mt-0 max-w-[42ch] text-[15px] leading-[1.5]">
            Every pitch runs on the same checklist so nothing gets lost between the brief and the
            room.
          </p>
        </section>
      </div>

      <section className="mt-8">
        <SectionHeading>The numbers</SectionHeading>
        <StatRow>
          {FACTS.map((fact) => (
            <StatItem key={fact.label} label={fact.label} value={fact.value} />
          ))}
        </StatRow>
      </section>
    </main>
  );
}
