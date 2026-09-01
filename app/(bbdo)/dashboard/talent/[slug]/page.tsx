import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { IconType } from "react-icons";
import { FaBehance, FaGlobe, FaLinkedinIn } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import { BackLink } from "@/components/back-link";
import { TALENT, getTalent, type Talent } from "@/lib/users";
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
const AUDIENCE_VALUE = "mt-[6px] block text-[clamp(17px,1.6vw,22px)] leading-[1.2]";

type TalentPlatform = {
  label: string;
  href: string;
  Icon: IconType;
};

function platformsFor(talent: Talent): TalentPlatform[] {
  const platforms: TalentPlatform[] = [];
  if (talent.portfolio) {
    const isBehance = talent.portfolio.toLowerCase().includes("behance.net");
    if (!isBehance) {
      platforms.push({ label: "Website", href: talent.portfolio, Icon: FaGlobe });
    }
    if (isBehance && !talent.behance) {
      platforms.push({ label: "Behance", href: talent.portfolio, Icon: FaBehance });
    }
  }
  if (talent.behance) {
    platforms.push({ label: "Behance", href: talent.behance, Icon: FaBehance });
  }
  if (talent.linkedin) {
    platforms.push({ label: "LinkedIn", href: talent.linkedin, Icon: FaLinkedinIn });
  }
  return platforms;
}

function ProfileMark({ talent, className }: { talent: Talent; className: string }) {
  return (
    <span aria-hidden="true" className={`grid flex-none place-items-center overflow-hidden bg-border/60 ${className}`}>
      {talent.profileImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={talent.profileImage} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-black tracking-[-0.06em] text-foreground/25">
          {talent.name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </span>
      )}
    </span>
  );
}

export default async function TalentDetailPage({ params }: Params) {
  const { slug } = await params;
  const talent = getTalent(slug);
  if (!talent) notFound();
  const platforms = platformsFor(talent);

  return (
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-20 pt-[clamp(30px,4vw,56px)]">
      <BackLink href="/dashboard/talent">Back to talent</BackLink>

      <div className="mt-8 grid items-start grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)] gap-[clamp(28px,5vw,72px)] max-[900px]:grid-cols-1">
        <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground pb-5">
        <div className="flex items-center gap-[clamp(16px,2vw,28px)]">
          <ProfileMark talent={talent} className="h-[clamp(64px,8vw,104px)] w-[clamp(64px,8vw,104px)] rounded-full text-[clamp(22px,2.6vw,36px)]" />
          <div>
            <span className="block text-[13px] font-extrabold uppercase tracking-[0.14em] text-primary">
              {talent.category}
            </span>
            <h1 className="mb-0 mt-3 text-[clamp(32px,4vw,58px)] uppercase leading-[0.95] tracking-[-0.045em]">
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
          <span className={META_LABEL}>Day rate estimate</span>
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

      <section className="mt-[clamp(28px,4vw,48px)] border-t border-foreground pt-5">
        <h2 className="mb-1 mt-0 text-[12px] uppercase tracking-[0.14em] text-primary">
          Audience profile
        </h2>
        <p className="mb-0 mt-2 max-w-[70ch] text-[13px] text-muted-foreground">
          Public profile details are shown only when verified or supplied.
        </p>
        <div className="mt-5 grid grid-cols-4 gap-x-6 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
          <div className="border-b border-border py-5">
            <span className={META_LABEL}>Follower count</span>
            <strong className={AUDIENCE_VALUE}>{talent.followerCount ?? "Not provided"}</strong>
            {talent.followerPlatform ? (
              <span className="mt-1 block text-[12px] text-muted-foreground">{talent.followerPlatform}</span>
            ) : null}
          </div>
          <div className="border-b border-border py-5">
            <span className={META_LABEL}>Gender</span>
            <strong className={AUDIENCE_VALUE}>{talent.gender ?? "Not provided"}</strong>
          </div>
          <div className="border-b border-border py-5">
            <span className={META_LABEL}>Age</span>
            <strong className={AUDIENCE_VALUE}>{talent.age ?? "Not provided"}</strong>
          </div>
          <div className="border-b border-border py-5">
            <span className={META_LABEL}>Niche</span>
            <strong className={AUDIENCE_VALUE}>{talent.niche ?? "Not provided"}</strong>
          </div>
        </div>
      </section>

      <div className="mt-[clamp(28px,4vw,48px)] grid grid-cols-1 gap-[clamp(28px,4vw,48px)]">
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
            Tags
          </h2>
          <ul className="m-0 list-none p-0">
            {talent.tags.map((tag) => (
              <li
                key={tag}
                className="relative border-t border-border py-2.5 pl-[22px] text-[16px] leading-[1.35] before:absolute before:left-0 before:top-[17px] before:h-[7px] before:w-[7px] before:bg-primary before:content-['']"
              >
                {tag}
              </li>
            ))}
          </ul>
        </section>
        <section className="border border-border p-5">
          <h2 className="mb-[18px] mt-0 text-[12px] uppercase tracking-[0.14em] text-primary">
            Platforms
          </h2>
          {platforms.length ? (
            <div className="grid grid-cols-1 gap-2">
              {platforms.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${talent.name} on ${label}`}
                  className="group flex items-center justify-between gap-3 border border-border p-3 text-foreground no-underline transition-colors hover:border-foreground hover:bg-foreground hover:text-white focus-visible:outline-none"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center bg-foreground text-white group-hover:bg-primary">
                      <Icon aria-hidden="true" className="h-[17px] w-[17px]" />
                    </span>
                    <span>
                      <strong className="block text-[15px] leading-none">{label}</strong>
                      <span className="mt-1 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground group-hover:text-white/70">
                        Open profile
                      </span>
                    </span>
                  </span>
                  <FiArrowUpRight aria-hidden="true" className="h-4 w-4 flex-none" />
                </a>
              ))}
            </div>
          ) : (
            <p className="m-0 border-t border-border pt-3.5 text-[15px] text-muted-foreground">
              Public platform links not yet confirmed.
            </p>
          )}
        </section>
        <section>
          <h2 className="mb-[18px] mt-0 text-[12px] uppercase tracking-[0.14em] text-primary">
            Contact
          </h2>
          <ul className="m-0 list-none p-0 text-[16px] leading-[1.35]">
            {talent.email ? (
              <li className="border-t border-border py-2.5">
                <a href={`mailto:${talent.email}`} className="text-foreground hover:text-primary">
                  {talent.email}
                </a>
              </li>
            ) : null}
            {talent.phone ? <li className="border-t border-border py-2.5">{talent.phone}</li> : null}
            {!talent.email && !talent.phone ? (
              <li className="border-t border-border py-2.5 text-muted-foreground">Public contact links not yet confirmed.</li>
            ) : null}
          </ul>
        </section>
        </div>
      </div>
        </div>

        <aside className="min-w-0 max-[900px]:order-first">
          <div className="border border-border bg-background">
            <div className="relative aspect-[4/5] overflow-hidden bg-transparent">
              {talent.featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={talent.featuredImage} alt={`${talent.name} featured work`} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-[clamp(64px,10vw,140px)] font-black tracking-[-0.08em] text-foreground/20">
                  {talent.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
              )}
              <span className="absolute right-4 top-4 h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
            </div>
            <div className="border-t border-border p-4">
              <span className="block text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">
                Featured work
              </span>
              <span className="mt-1 block text-[13px] text-muted-foreground">
                {talent.featuredImage ? "Public portfolio image" : "No verified project image yet"}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
