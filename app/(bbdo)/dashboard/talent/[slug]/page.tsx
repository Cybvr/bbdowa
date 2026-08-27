import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { TALENT, getTalent } from "@/lib/talent";
import { longDate } from "@/lib/format";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TALENT.map((talent) => ({ slug: talent.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const talent = getTalent(slug);
  if (!talent) return { title: "Not found" };
  return { title: `${talent.name} — Talent`, description: talent.craftNote };
}

const META_LABEL = "text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground";
const META_VALUE = "mt-[6px] block text-[clamp(17px,1.6vw,22px)] leading-[1.2]";
const META_CELL =
  "border-b border-border py-6 pr-6 [&:nth-child(3n+2)]:border-l [&:nth-child(3n+2)]:border-l-border [&:nth-child(3n+2)]:pl-6 [&:nth-child(3n)]:border-l [&:nth-child(3n)]:border-l-border [&:nth-child(3n)]:pl-6 max-[720px]:!border-l-0 max-[720px]:!pl-0";

const HISTORY_ROW = "border-t border-border py-3.5";

export default async function TalentDetailPage({ params }: Params) {
  const { slug } = await params;
  const talent = getTalent(slug);
  if (!talent) notFound();

  return (
    <main className="flex-1 px-[clamp(24px,6vw,96px)] pb-20 pt-[clamp(30px,4vw,56px)]">
      <BackLink href="/dashboard/talent">Back to talent</BackLink>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-foreground pb-5">
        <div className="flex items-center gap-[clamp(16px,2vw,28px)]">
          <span
            aria-hidden="true"
            className="grid h-[clamp(64px,8vw,104px)] w-[clamp(64px,8vw,104px)] flex-none place-items-center bg-border/60 text-[clamp(22px,2.6vw,36px)] font-black tracking-[-0.06em] text-foreground/25"
          >
            {talent.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <span className="block text-[13px] font-extrabold uppercase tracking-[0.14em] text-primary">
              {talent.discipline}
            </span>
            <h1 className="mb-0 mt-3 text-[clamp(38px,6vw,86px)] uppercase leading-[0.9] tracking-[-0.06em]">
              {talent.name}
            </h1>
          </div>
        </div>
        <span className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
          {talent.availability}
        </span>
      </div>

      <p className="my-[clamp(28px,4vw,48px)] max-w-[850px] text-[clamp(19px,2vw,28px)] leading-[1.3]">
        {talent.craftNote}
      </p>

      <div className="grid grid-cols-3 border-t border-foreground max-[720px]:grid-cols-1">
        <div className={META_CELL}>
          <span className={META_LABEL}>Day rate</span>
          <strong className={META_VALUE}>{talent.dayRate}</strong>
        </div>
        <div className={META_CELL}>
          <span className={META_LABEL}>Terms</span>
          <strong className={META_VALUE}>{talent.terms}</strong>
        </div>
        <div className={META_CELL}>
          <span className={META_LABEL}>Clearance</span>
          <strong className={META_VALUE}>
            {talent.clearance === "cleared" ? "Cleared to engage" : "Sign-off pending"}
          </strong>
        </div>
        <div className={META_CELL}>
          <span className={META_LABEL}>Location</span>
          <strong className={META_VALUE}>{talent.location}</strong>
        </div>
        <div className={META_CELL}>
          <span className={META_LABEL}>Engages as</span>
          <strong className={META_VALUE}>{talent.entity}</strong>
        </div>
        <div className={META_CELL}>
          <span className={META_LABEL}>Years active</span>
          <strong className={META_VALUE}>{talent.yearsActive ?? "Not provided"}</strong>
        </div>
        <div className={META_CELL}>
          <span className={META_LABEL}>Vouched by</span>
          <strong className={META_VALUE}>{talent.vouchedBy}</strong>
        </div>
        <div className={META_CELL}>
          <span className={META_LABEL}>Last engaged</span>
          <strong className={META_VALUE}>{longDate(talent.lastEngaged)}</strong>
        </div>
        <div className={META_CELL}>
          <span className={META_LABEL}>Engagements</span>
          <strong className={META_VALUE}>
            {talent.workedOn.length ? talent.workedOn.join(", ") : "—"}
          </strong>
        </div>
      </div>

      <div className="mt-[clamp(28px,4vw,48px)] grid grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)] gap-[clamp(28px,4vw,64px)] max-[900px]:grid-cols-1">
        <section>
          <h2 className="mb-[18px] mt-0 text-[12px] uppercase tracking-[0.14em] text-primary">
            Work history
          </h2>
          {talent.workHistory?.length ? (
            <ul className="m-0 list-none p-0">
              {talent.workHistory.map((entry) => (
                <li key={`${entry.company}-${entry.role}-${entry.period}`} className={HISTORY_ROW}>
                  <div className="flex items-start justify-between gap-5 max-[560px]:flex-col max-[560px]:gap-1">
                    <div>
                      <strong className="block text-[18px] leading-[1.15]">{entry.role}</strong>
                      <span className="mt-1 block text-[15px] text-muted-foreground">{entry.company}</span>
                    </div>
                    <span className="text-right text-[13px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground max-[560px]:text-left">
                      {entry.period}
                      {entry.location ? <span className="block font-medium tracking-normal">{entry.location}</span> : null}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 border-t border-border py-3.5 text-[15px] text-muted-foreground">
              Public work history not yet confirmed.
            </p>
          )}
        </section>
        <div className="grid grid-cols-1 gap-[clamp(28px,4vw,48px)]">
        <section>
          <h2 className="mb-[18px] mt-0 text-[12px] uppercase tracking-[0.14em] text-primary">
            Specialties
          </h2>
          <ul className="m-0 list-none p-0">
            {talent.specialties.map((specialty) => (
              <li
                key={specialty}
                className="relative border-t border-border py-2.5 pl-[22px] text-[16px] leading-[1.35] before:absolute before:left-0 before:top-[17px] before:h-[7px] before:w-[7px] before:bg-primary before:content-['']"
              >
                {specialty}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-[18px] mt-0 text-[12px] uppercase tracking-[0.14em] text-primary">
            Contact
          </h2>
          <ul className="m-0 list-none p-0 text-[16px] leading-[1.35]">
            {talent.portfolio ? (
              <li className="border-t border-border py-2.5">
                <a
                  href={talent.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="font-extrabold uppercase text-foreground underline underline-offset-[6px] hover:text-primary focus-visible:text-primary"
                >
                  Portfolio
                </a>
              </li>
            ) : null}
            {talent.linkedin ? (
              <li className="border-t border-border py-2.5">
                <a
                  href={talent.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="font-extrabold uppercase text-foreground underline underline-offset-[6px] hover:text-primary focus-visible:text-primary"
                >
                  LinkedIn
                </a>
              </li>
            ) : null}
            {talent.email ? (
              <li className="border-t border-border py-2.5">
                <a href={`mailto:${talent.email}`} className="text-foreground hover:text-primary">
                  {talent.email}
                </a>
              </li>
            ) : null}
            {talent.phone ? <li className="border-t border-border py-2.5">{talent.phone}</li> : null}
            {!talent.portfolio && !talent.linkedin && !talent.email && !talent.phone ? (
              <li className="border-t border-border py-2.5 text-muted-foreground">Public contact links not yet confirmed.</li>
            ) : null}
          </ul>
        </section>
        </div>
      </div>
    </main>
  );
}
