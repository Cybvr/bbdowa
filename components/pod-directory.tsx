"use client";

import Link from "next/link";
import { useState } from "react";
import type { PodTalent } from "@/lib/pod";
import { podHref } from "@/lib/pod";
import { plural } from "@/lib/format";

const FILTER_BUTTON =
  "min-h-[44px] cursor-pointer border-2 px-[18px] py-2.5 text-[12px] font-extrabold uppercase tracking-[0.1em] hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary";

const AVAILABILITY_DOT: Record<PodTalent["availability"], string> = {
  open: "bg-primary",
  "on a job": "bg-foreground",
  unconfirmed: "bg-muted-foreground",
};

function Availability({ value }: { value: PodTalent["availability"] }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.1em]">
      <span aria-hidden="true" className={`h-[9px] w-[9px] ${AVAILABILITY_DOT[value]}`} />
      {value}
    </span>
  );
}

export function PodDirectory({
  talents,
  disciplines,
}: {
  talents: PodTalent[];
  disciplines: string[];
}) {
  const [discipline, setDiscipline] = useState<string>("all");
  const [view, setView] = useState<"cards" | "list">("cards");

  const visible =
    discipline === "all" ? talents : talents.filter((talent) => talent.discipline === discipline);

  return (
    <>
      <div className="my-7 mb-5 flex items-start justify-between gap-6 max-[720px]:flex-col">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by discipline">
          {["all", ...disciplines].map((key) => {
            const selected = discipline === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => setDiscipline(key)}
                className={`${FILTER_BUTTON} ${
                  selected
                    ? "border-foreground bg-foreground text-white"
                    : "border-foreground bg-transparent text-foreground"
                }`}
              >
                {key === "all" ? "All" : key}
              </button>
            );
          })}
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
                className={`${FILTER_BUTTON} ${
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
        {plural(visible.length, "person", "people")}
      </p>

      {view === "cards" ? (
        <div className="grid grid-cols-3 gap-px bg-border max-[1000px]:grid-cols-2 max-[640px]:grid-cols-1">
          {visible.map((talent) => (
            <Link
              key={talent.slug}
              href={podHref(talent.slug)}
              className="group flex min-h-[280px] flex-col justify-between bg-background p-7 no-underline outline outline-1 outline-border hover:bg-foreground hover:text-white focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-primary"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-primary">
                    {talent.discipline}
                  </span>
                  <Availability value={talent.availability} />
                </div>
                <h2 className="mb-0 mt-5 text-[clamp(26px,2.6vw,38px)] uppercase leading-[0.95] tracking-[-0.04em]">
                  {talent.name}
                </h2>
                <p className="mb-0 mt-3 text-[14px] leading-[1.4] text-muted-foreground group-hover:text-white/70">
                  {talent.specialties.join(" · ")}
                </p>
              </div>
              <div className="mt-7 flex items-end justify-between gap-4 border-t border-border pt-4 group-hover:border-white/20">
                <div className="text-[13px] leading-[1.5]">
                  <span className="block text-muted-foreground group-hover:text-white/60">
                    {talent.location} · {talent.entity}
                  </span>
                  <strong className="block">{talent.dayRate} / day</strong>
                </div>
                {talent.workedOn.length > 0 && (
                  <span className="flex-none bg-primary px-[9px] py-[5px] text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">
                    Worked with us
                  </span>
                )}
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
            <span>Vetted</span>
          </div>
          {visible.map((talent) => (
            <Link
              key={talent.slug}
              href={podHref(talent.slug)}
              className="grid grid-cols-[minmax(220px,1.4fr)_minmax(120px,0.8fr)_minmax(140px,0.9fr)_minmax(150px,0.9fr)_minmax(130px,0.8fr)_120px] items-center gap-5 border-b border-border py-5 no-underline hover:bg-foreground hover:text-white focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-primary max-[900px]:grid-cols-2 max-[900px]:gap-y-2"
            >
              <span className="text-[clamp(18px,1.8vw,26px)] uppercase leading-none tracking-[-0.03em] max-[900px]:col-span-full">
                {talent.name}
              </span>
              <span className="text-[15px]">{talent.discipline}</span>
              <span className="text-[15px]">{talent.location}</span>
              <span className="text-[15px]">{talent.dayRate}</span>
              <Availability value={talent.availability} />
              <span className="text-[15px]">{talent.workedOn.length ? "Yes" : "Not yet"}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
