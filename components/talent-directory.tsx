"use client";

import Link from "next/link";
import { useState } from "react";
import type { IconType } from "react-icons";
import { FaBehance, FaGlobe, FaLinkedinIn } from "react-icons/fa";
import type { Talent } from "@/lib/talent";
import { baseCity, rateFloorNgn, talentHref } from "@/lib/talent";

const AVAILABILITY_DOT: Record<Talent["availability"], string> = {
  open: "bg-[#1a9a4a]",
  busy: "bg-[#d94a3a]",
  unconfirmed: "bg-muted-foreground",
};

const AVAILABILITY_LABEL: Record<Talent["availability"], string> = {
  open: "Open for work",
  busy: "On a job",
  unconfirmed: "Unconfirmed",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

function Avatar({ name, imageSrc, className = "" }: { name: string; imageSrc?: string | null; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid flex-none place-items-center overflow-hidden rounded-full bg-primary font-black tracking-[-0.04em] text-white ${className}`}
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

type PlatformLink = { label: string; href: string | null; Icon: IconType };

function platformLinks(talent: Talent): PlatformLink[] {
  const portfolioIsBehance = talent.portfolio?.toLowerCase().includes("behance.net") ?? false;
  return [
    { label: "Website", href: portfolioIsBehance ? null : talent.portfolio, Icon: FaGlobe },
    { label: "LinkedIn", href: talent.linkedin ?? null, Icon: FaLinkedinIn },
    { label: "Behance", href: talent.behance ?? (portfolioIsBehance ? talent.portfolio : null), Icon: FaBehance },
  ];
}

const SELECT =
  "min-h-[44px] cursor-pointer border-2 border-foreground bg-transparent px-[14px] py-2.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-foreground hover:border-primary focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary";

const PILL =
  "inline-block rounded-full bg-foreground/[0.07] px-3 py-1.5 text-[12px] leading-none text-foreground";

const RATE_STEP = 1_000;
const RATE_MIN = 0;
const RATE_CAP = 100_000;

function Stat({ children }: { children: React.ReactNode }) {
  return <span className="text-[14px] leading-none text-foreground">{children}</span>;
}

export function TalentDirectory({
  talents,
  categories,
  locations,
}: {
  talents: Talent[];
  categories: string[];
  locations: string[];
}) {
  const [category, setCategory] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [availability, setAvailability] = useState<Talent["availability"] | "all">("all");
  const [maxRate, setMaxRate] = useState<number>(RATE_CAP);

  const visible = talents.filter(
    (talent) =>
      (category === "all" || talent.category === category) &&
      (location === "all" || baseCity(talent.location) === location) &&
      (availability === "all" || talent.availability === availability) &&
      (maxRate >= RATE_CAP || rateFloorNgn(talent) <= maxRate),
  );

  return (
    <>
      <div className="my-7 mb-5 flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Category"
          className={SELECT}
        >
          <option value="all">Category</option>
          {categories.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
        <select
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          aria-label="Location"
          className={SELECT}
        >
          <option value="all">Location</option>
          {locations.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
        <select
          value={availability}
          onChange={(event) => setAvailability(event.target.value as Talent["availability"] | "all")}
          aria-label="Availability"
          className={SELECT}
        >
          <option value="all">Availability</option>
          <option value="open">Open</option>
          <option value="busy">Busy</option>
          <option value="unconfirmed">Unconfirmed</option>
        </select>
        <label className="flex h-[44px] items-center gap-3 border-2 border-foreground px-[14px] text-[10px] font-extrabold uppercase text-muted-foreground">
          <span aria-hidden="true">₦0</span>
          <input
            type="range"
            min={RATE_MIN}
            max={RATE_CAP}
            step={RATE_STEP}
            value={maxRate}
            onChange={(event) => setMaxRate(Number(event.target.value))}
            aria-label="Maximum day rate in naira"
            className="w-[140px] accent-primary"
          />
          <span aria-hidden="true">₦100k</span>
        </label>
      </div>

      <p aria-live="polite" className="mb-5 mt-0 text-[12px] font-extrabold uppercase tracking-[0.14em] text-primary">
        {visible.length} {visible.length === 1 ? "person" : "people"}
      </p>

      <div className="flex flex-col gap-4">
        {visible.map((talent) => (
          <article
            key={talent.slug}
            className="rounded-2xl border border-border bg-background p-[clamp(20px,3vw,32px)] hover:border-foreground"
          >
            <div className="flex items-start gap-5 max-[640px]:flex-col max-[640px]:gap-4">
              <Link
                href={talentHref(talent.slug)}
                aria-label={talent.name}
                className="flex-none focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary"
              >
                <Avatar name={talent.name} imageSrc={talent.profileImage} className="h-16 w-16 text-[18px]" />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="m-0 text-[22px] uppercase leading-none tracking-[-0.03em]">
                    <Link
                      href={talentHref(talent.slug)}
                      className="text-foreground no-underline hover:text-primary focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary"
                    >
                      {talent.name}
                    </Link>
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${AVAILABILITY_DOT[talent.availability]}`} />
                    {AVAILABILITY_LABEL[talent.availability]}
                  </span>
                </div>
                <p className="mb-0 mt-1.5 text-[14px] text-muted-foreground">
                  {talent.category} · {baseCity(talent.location)}
                </p>
              </div>

              <div className="flex flex-none items-center gap-2 max-[640px]:w-full">
                <Link
                  href={talentHref(talent.slug)}
                  className="rounded-full bg-foreground px-6 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-white no-underline hover:bg-primary focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary max-[640px]:flex-1 max-[640px]:text-center"
                >
                  View profile
                </Link>
                {platformLinks(talent)
                  .filter((platform) => platform.href)
                  .slice(0, 1)
                  .map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href!}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${talent.name} on ${label}`}
                      title={label}
                      className="grid h-11 w-11 flex-none place-items-center rounded-full border border-border text-foreground hover:border-foreground focus-visible:outline-[3px] focus-visible:outline-offset-[2px] focus-visible:outline-primary"
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </a>
                  ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
              <Stat>
                <strong className="font-extrabold">{talent.dayRate}</strong> / day
              </Stat>
              {talent.yearsActive !== null && (
                <Stat>
                  <strong className="font-extrabold">{talent.yearsActive}</strong> years active
                </Stat>
              )}
              <Stat>{talent.entity}</Stat>
              {talent.workedOn.length > 0 && (
                <Stat>Worked on {talent.workedOn.join(", ")}</Stat>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {talent.tags.slice(0, 6).map((tag) => (
                <span key={tag} className={PILL}>
                  {tag}
                </span>
              ))}
              {talent.tags.length > 6 && <span className={PILL}>+{talent.tags.length - 6}</span>}
            </div>

            <p className="mb-0 mt-5 line-clamp-2 max-w-[95ch] text-[15px] leading-[1.5] text-muted-foreground">
              {talent.craftNote}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
