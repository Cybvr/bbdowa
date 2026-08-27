"use client";

import Link from "next/link";
import { useState } from "react";
import type { Talent } from "@/lib/talent";
import { baseCity, rateFloorNgn, talentHref } from "@/lib/talent";

const TOGGLE_BUTTON =
  "min-h-[44px] cursor-pointer border-2 px-[18px] py-2.5 text-[12px] font-extrabold uppercase tracking-[0.1em] hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary";

const AVAILABILITY_DOT: Record<Talent["availability"], string> = {
  open: "bg-primary",
  "on a job": "bg-foreground",
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
    <span className="inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.1em]">
      <span aria-hidden="true" className={`h-[9px] w-[9px] ${AVAILABILITY_DOT[value]}`} />
      {value}
    </span>
  );
}

function Avatar({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid flex-none place-items-center bg-primary font-black tracking-[-0.04em] text-white ${className}`}
    >
      {initials(name)}
    </span>
  );
}

const SELECT =
  "min-h-[44px] cursor-pointer border-2 border-foreground bg-transparent px-[14px] py-2.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-foreground hover:border-primary focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary";

const RATE_STEP = 50_000;
const RATE_MIN = 100_000;
const RATE_CAP = 1_500_000;

function formatNgn(value: number): string {
  return value >= 1_000_000 ? `₦${value / 1_000_000}m` : `₦${value / 1_000}k`;
}

export function TalentDirectory({
  talents,
  disciplines,
  locations,
}: {
  talents: Talent[];
  disciplines: string[];
  locations: string[];
}) {
  const [discipline, setDiscipline] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [maxRate, setMaxRate] = useState<number>(RATE_CAP);
  const [view, setView] = useState<"cards" | "list">("cards");

  const visible = talents.filter(
    (talent) =>
      (discipline === "all" || talent.discipline === discipline) &&
      (location === "all" || baseCity(talent.location) === location) &&
      (maxRate >= RATE_CAP || rateFloorNgn(talent) <= maxRate),
  );

  return (
    <>
      <div className="my-7 mb-5 flex items-center justify-between gap-6 max-[900px]:flex-col max-[900px]:items-start">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={discipline}
            onChange={(event) => setDiscipline(event.target.value)}
            aria-label="Discipline"
            className={SELECT}
          >
            <option value="all">Discipline</option>
            {disciplines.map((key) => (
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
          <label className="flex min-h-[44px] items-center gap-3 border-2 border-foreground px-[14px] text-[12px] font-extrabold uppercase tracking-[0.1em]">
            <span className="whitespace-nowrap">
              {maxRate >= RATE_CAP ? "Any day rate" : `Up to ${formatNgn(maxRate)}`}
            </span>
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
        <div className="grid grid-cols-4 gap-px bg-border max-[1100px]:grid-cols-3 max-[820px]:grid-cols-2 max-[520px]:grid-cols-1">
          {visible.map((talent) => (
            <Link
              key={talent.slug}
              href={talentHref(talent.slug)}
              className="group bg-background no-underline outline outline-1 outline-border hover:bg-foreground hover:text-white focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-primary"
            >
              <div className="relative grid aspect-square place-items-center bg-border/60">
                <span
                  aria-hidden="true"
                  className="text-[clamp(48px,5vw,72px)] font-black tracking-[-0.06em] text-foreground/25"
                >
                  {initials(talent.name)}
                </span>
                <span className="absolute right-3 top-3 text-foreground">
                  <Availability value={talent.availability} />
                </span>
              </div>
              <div className="flex items-start gap-3 p-4">
                <Avatar name={talent.name} className="mt-[2px] h-8 w-8 text-[11px]" />
                <div className="min-w-0">
                  <h2 className="m-0 text-[18px] uppercase leading-[1.05] tracking-[-0.03em]">
                    {talent.name}
                  </h2>
                  <p className="mb-0 mt-1 text-[12px] leading-[1.4] text-muted-foreground group-hover:text-white/70">
                    {talent.discipline} · {baseCity(talent.location)}
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
          <div
            aria-hidden="true"
            className="grid grid-cols-[minmax(220px,1.4fr)_minmax(120px,0.8fr)_minmax(140px,0.9fr)_minmax(150px,0.9fr)_minmax(130px,0.8fr)_120px] gap-5 border-b-2 border-foreground py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground max-[900px]:hidden"
          >
            <span>Name</span>
            <span>Discipline</span>
            <span>Location</span>
            <span>Day rate</span>
            <span>Availability</span>
            <span>Engagements</span>
          </div>
          {visible.map((talent) => (
            <Link
              key={talent.slug}
              href={talentHref(talent.slug)}
              className="grid grid-cols-[minmax(220px,1.4fr)_minmax(120px,0.8fr)_minmax(140px,0.9fr)_minmax(150px,0.9fr)_minmax(130px,0.8fr)_120px] items-center gap-5 border-b border-border py-5 no-underline hover:bg-foreground hover:text-white focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-primary max-[900px]:grid-cols-2 max-[900px]:gap-y-2"
            >
              <span className="flex items-center gap-4 text-[clamp(18px,1.8vw,26px)] uppercase leading-none tracking-[-0.03em] max-[900px]:col-span-full">
                <Avatar name={talent.name} className="h-9 w-9 text-[12px]" />
                {talent.name}
              </span>
              <span className="text-[15px]">{talent.discipline}</span>
              <span className="text-[15px]">{talent.location}</span>
              <span className="text-[15px]">{talent.dayRate}</span>
              <Availability value={talent.availability} />
              <span className="text-[15px]">{talent.workedOn.length ? talent.workedOn.join(", ") : "—"}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
