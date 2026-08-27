"use client";

import Link from "next/link";
import { useState } from "react";
import type { IconType } from "react-icons";
import { FaBehance, FaBriefcase, FaGlobe, FaLinkedinIn } from "react-icons/fa";
import type { Talent } from "@/lib/talent";
import { baseCity, rateFloorNgn, talentHref } from "@/lib/talent";

const TOGGLE_BUTTON =
  "min-h-[44px] cursor-pointer border-2 px-[18px] py-2.5 text-[12px] font-extrabold uppercase tracking-[0.1em] hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary";

const AVAILABILITY_DOT: Record<Talent["availability"], string> = {
  open: "bg-[#1a9a4a]",
  busy: "bg-[#d94a3a]",
  unconfirmed: "bg-muted-foreground",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

function Availability({ value }: { value: Talent["availability"] }) {
  return (
    <span
      aria-label={value}
      title={value}
      className="inline-flex items-center"
    >
      <span aria-hidden="true" className={`h-3 w-3 rounded-full ${AVAILABILITY_DOT[value]}`} />
    </span>
  );
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

function PlatformBadges({ talent }: { talent: Talent }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {platformLinks(talent).map(({ label, href, Icon }) =>
        href ? (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${talent.name} on ${label}`}
            title={label}
            className="grid h-9 w-9 place-items-center rounded-full border border-primary bg-primary/10 text-primary no-underline hover:bg-primary hover:text-white focus-visible:outline-[3px] focus-visible:outline-offset-[2px] focus-visible:outline-primary"
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
          </a>
        ) : (
          <span
            key={label}
            aria-label={`${label} unavailable`}
            title={`${label} unavailable`}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#d94a3a]/50 bg-[#d94a3a]/10 text-[#d94a3a]"
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
          </span>
        ),
      )}
    </div>
  );
}

const SELECT =
  "min-h-[44px] cursor-pointer border-2 border-foreground bg-transparent px-[14px] py-2.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-foreground hover:border-primary focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary";

const RATE_STEP = 1_000;
const RATE_MIN = 0;
const RATE_CAP = 100_000;

type SortKey = "name" | "category" | "location" | "rate" | "availability";

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "location", label: "Location & tags" },
  { key: "rate", label: "Day rate estimate" },
  { key: "availability", label: "Availability" },
];

const AVAILABILITY_ORDER: Record<Talent["availability"], number> = {
  open: 0,
  busy: 1,
  unconfirmed: 2,
};

function sortValue(talent: Talent, key: SortKey): string | number {
  if (key === "name") return talent.name;
  if (key === "category") return talent.category;
  if (key === "location") return baseCity(talent.location);
  if (key === "availability") return AVAILABILITY_ORDER[talent.availability];
  return talent.rateMin === null ? Number.MAX_SAFE_INTEGER : rateFloorNgn(talent);
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
  const [view, setView] = useState<"cards" | "list">("cards");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);

  const filtered = talents.filter(
    (talent) =>
      (category === "all" || talent.category === category) &&
      (location === "all" || baseCity(talent.location) === location) &&
      (availability === "all" || talent.availability === availability) &&
      (maxRate >= RATE_CAP || rateFloorNgn(talent) <= maxRate),
  );

  const visible = sort
    ? [...filtered].sort((a, b) => {
        const left = sortValue(a, sort.key);
        const right = sortValue(b, sort.key);
        if (left === right) return 0;
        return (left < right ? -1 : 1) * sort.dir;
      })
    : filtered;

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current?.key === key ? { key, dir: current.dir === 1 ? -1 : 1 } : { key, dir: 1 },
    );

  return (
    <>
      <div className="my-7 mb-5 flex items-center justify-between gap-6 max-[900px]:flex-col max-[900px]:items-start">
        <div className="flex flex-wrap items-center gap-3">
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
        <div className="flex flex-none gap-2" role="group" aria-label="Change view">
          {(["cards", "list"] as const).map((key) => {
            const selected = view === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => setView(key)}
                className={`${TOGGLE_BUTTON} ${
                  selected
                    ? "border-foreground bg-foreground text-white"
                    : "border-border bg-transparent text-muted-foreground"
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>

      <p aria-live="polite" className="mb-5 mt-0 text-[12px] font-extrabold uppercase tracking-[0.14em] text-primary">
        {visible.length} {visible.length === 1 ? "person" : "people"}
      </p>

      {view === "cards" ? (
        <div className="grid grid-cols-4 gap-px bg-transparent max-[1100px]:grid-cols-3 max-[820px]:grid-cols-2 max-[520px]:grid-cols-1">
          {visible.map((talent) => (
            <Link
              key={talent.slug}
              href={talentHref(talent.slug)}
              className="group bg-background no-underline outline outline-1 outline-border hover:bg-foreground hover:text-white focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-primary"
            >
              <div className="relative grid aspect-square place-items-center overflow-hidden bg-transparent">
                {talent.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={talent.featuredImage} alt={`${talent.name} featured work`} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span className="relative text-[clamp(48px,5vw,72px)] font-black tracking-[-0.06em] text-foreground/25">
                    {initials(talent.name)}
                  </span>
                )}
                <span className="absolute right-3 top-3 text-foreground">
                  <Availability value={talent.availability} />
                </span>
              </div>
              <div className="flex items-start gap-3 p-4">
                <Avatar name={talent.name} imageSrc={talent.profileImage} className="mt-[2px] h-8 w-8 text-[11px]" />
                <div className="min-w-0">
                  <h2 className="m-0 text-[18px] uppercase leading-[1.05] tracking-[-0.03em]">
                    {talent.name}
                  </h2>
                  <p className="mb-0 mt-1 text-[12px] leading-[1.4] text-muted-foreground group-hover:text-white/70">
                    {talent.category} · {baseCity(talent.location)}
                  </p>
                  <strong className="mt-2 block text-[13px]">
                    {talent.rateMin === null ? talent.dayRate : `${talent.dayRate} / day`}
                  </strong>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div>
          <div className="hidden grid-cols-[minmax(220px,1.25fr)_minmax(100px,0.7fr)_minmax(180px,1.15fr)_minmax(140px,0.9fr)_minmax(120px,0.75fr)_120px] gap-5 border-b-2 border-foreground py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground min-[901px]:grid">
            {SORT_COLUMNS.map(({ key, label }) => {
              const active = sort?.key === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSort(key)}
                  aria-label={`Sort by ${label}`}
                  aria-pressed={active}
                  className={`flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-left text-[11px] font-extrabold uppercase tracking-[0.14em] hover:text-primary focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                  <span aria-hidden="true" className={active ? "text-primary" : "invisible"}>
                    {active && sort?.dir === -1 ? "↓" : "↑"}
                  </span>
                </button>
              );
            })}
            <span>Profiles</span>
          </div>
          {visible.map((talent) => (
            <article
              key={talent.slug}
              className="group border-b border-border py-5 hover:bg-foreground hover:text-white"
            >
              <div className="grid grid-cols-[minmax(220px,1.25fr)_minmax(100px,0.7fr)_minmax(180px,1.15fr)_minmax(140px,0.9fr)_minmax(120px,0.75fr)_120px] items-start gap-5 max-[900px]:grid-cols-1 max-[900px]:gap-4">
                <div>
                  <Link
                    href={talentHref(talent.slug)}
                    className="flex items-center gap-4 text-[clamp(18px,1.8vw,26px)] uppercase leading-none tracking-[-0.03em] no-underline hover:text-primary focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary"
                  >
                    <Avatar name={talent.name} imageSrc={talent.profileImage} className="h-9 w-9 text-[12px]" />
                    {talent.name}
                  </Link>
                  {talent.workHistory?.length ? (
                    <p className="mb-0 mt-3 min-w-0 truncate whitespace-nowrap pl-[52px] text-[12px] leading-[1.45] text-muted-foreground group-hover:text-white/70">
                      <FaBriefcase aria-hidden="true" className="mr-1.5 inline-block h-3 w-3 text-primary" />
                      {talent.workHistory.map((entry) => entry.company).join(" · ")}
                    </p>
                  ) : null}
                </div>
                <span className="text-[15px]">{talent.category}</span>
                <div>
                  <span className="block text-[15px]">{talent.location}</span>
                  <span className="mt-2 block text-[12px] leading-[1.45] text-muted-foreground group-hover:text-white/70">
                    {talent.tags.join(" · ")}
                  </span>
                </div>
                <strong className="text-[15px]">{talent.dayRate} / day</strong>
                <Availability value={talent.availability} />
                <PlatformBadges talent={talent} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
