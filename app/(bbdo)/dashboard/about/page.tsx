import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

const FACTS = [
  { value: "15", label: "Pitch stages" },
  { value: "6", label: "Industry labs" },
  { value: "40+", label: "Awards" },
];

export default function AboutPage() {
  return (
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-20 pt-[clamp(30px,4vw,56px)]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-foreground pb-5">
        <h1 className="m-0 text-[clamp(32px,4vw,58px)] uppercase leading-[0.95] tracking-[-0.045em]">
          About
        </h1>
        <span className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
          BBDO West Africa
        </span>
      </div>

      <p className="mt-[clamp(30px,4vw,50px)] max-w-[30ch] text-[clamp(24px,3.2vw,42px)] uppercase leading-[1] tracking-[-0.035em]">
        The most preferred <em className="not-italic text-primary">shapers of choice</em> across
        the African continent.
      </p>

      <div className="mt-[clamp(34px,5vw,60px)] grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-10 gap-y-0 border-t border-foreground">
        <section className="pb-[30px] pt-[26px]">
          <h2 className="mb-3 mt-0 text-[13px] font-extrabold uppercase tracking-[0.16em] text-primary">
            Who we are
          </h2>
          <p className="mb-3 mt-0 max-w-[42ch] text-[17px] leading-[1.4]">
            BBDO West Africa is the Lagos studio of the BBDO network and the hub for the West
            African sub-region. We make culturally relevant, insightful and effective campaigns
            that drive brand value and grow our clients&apos; businesses.
          </p>
          <p className="mb-3 mt-0 max-w-[42ch] text-[17px] leading-[1.4]">
            We hold to the network tradition of The Work, The Work, The Work: creativity that
            proves itself in market. Do Big Things is not a tagline for us. It is the size of the
            problem we take on.
          </p>
        </section>

        <section className="pb-[30px] pt-[26px]">
          <h2 className="mb-3 mt-0 text-[13px] font-extrabold uppercase tracking-[0.16em] text-primary">
            What we do
          </h2>
          <ul className="m-0 list-none p-0">
            {[
              "Brand strategy and positioning",
              "Campaign ideas and creative",
              "Social and content",
              "Production, broadcast to print",
              "Media and reputation planning",
            ].map((service) => (
              <li
                key={service}
                className="border-b border-border py-[9px] text-[17px] leading-[1.3]"
              >
                {service}
              </li>
            ))}
          </ul>
        </section>

        <section className="pb-[30px] pt-[26px]">
          <h2 className="mb-3 mt-0 text-[13px] font-extrabold uppercase tracking-[0.16em] text-primary">
            How we work
          </h2>
          <p className="mb-3 mt-0 max-w-[42ch] text-[17px] leading-[1.4]">
            Small teams, short lines, no ceremony. Strategy sits in the room with creative from day
            one and the work gets pressure tested early.
          </p>
          <p className="mb-3 mt-0 max-w-[42ch] text-[17px] leading-[1.4]">
            Every pitch runs on the same checklist so nothing gets lost between the brief and the
            room.
          </p>
        </section>

        <section className="pb-[30px] pt-[26px]">
          <h2 className="mb-3 mt-0 text-[13px] font-extrabold uppercase tracking-[0.16em] text-primary">
            The numbers
          </h2>
          <div className="mt-2.5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
            {FACTS.map((fact) => (
              <div key={fact.label} className="border-2 border-foreground bg-white p-[18px]">
                <div className="text-[clamp(30px,3.6vw,46px)] leading-none tracking-[-0.05em]">
                  {fact.value}
                </div>
                <div className="mt-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                  {fact.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
