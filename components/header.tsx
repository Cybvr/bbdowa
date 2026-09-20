"use client";

import Link from "next/link";
import { useState } from "react";
import { MARKETING_NAV } from "@/lib/nav";
import { ProfileNav } from "@/components/profile-nav";

const LINK =
  "font-mono text-[11px] uppercase tracking-[0.16em] text-white no-underline hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white max-[760px]:flex max-[760px]:min-h-[48px] max-[760px]:items-center max-[760px]:text-[13px]";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex flex-none flex-wrap items-center gap-x-10 bg-primary px-[clamp(20px,5vw,72px)] py-4">
      <Link href="/" aria-label="BBDO West Africa" onClick={() => setOpen(false)} className="min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bbdo-west-africa.png"
          alt="BBDO West Africa"
          className="block h-auto w-[clamp(104px,10vw,132px)] max-w-full brightness-0 invert"
        />
      </Link>

      <div className="ml-auto hidden items-center gap-2 max-[760px]:flex">
        <ProfileNav />
        <button
          type="button"
          aria-expanded={open}
          aria-controls="marketing-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((current) => !current)}
          className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] bg-white/10 text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true" className={`h-[2px] w-[18px] bg-current transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
          <span aria-hidden="true" className={`h-[2px] w-[18px] bg-current ${open ? "opacity-0" : ""}`} />
          <span aria-hidden="true" className={`h-[2px] w-[18px] bg-current transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </div>

      <nav
        id="marketing-nav"
        aria-label="Sections"
        className={`ml-auto min-w-0 max-[760px]:ml-0 max-[760px]:w-full max-[760px]:basis-full ${
          open ? "" : "max-[760px]:hidden"
        }`}
      >
        <ul className="m-0 flex list-none flex-wrap items-center justify-end gap-x-8 gap-y-2 p-0 max-[760px]:mt-3 max-[760px]:flex-col max-[760px]:items-stretch max-[760px]:gap-0 max-[760px]:border-t max-[760px]:border-white/25 max-[760px]:pt-2">
          {MARKETING_NAV.map((item) => (
            <li key={item.href} className="max-[760px]:border-b max-[760px]:border-white/15">
              <Link href={item.href} onClick={() => setOpen(false)} className={LINK}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 max-[760px]:hidden">
        <ProfileNav />
      </div>
    </header>
  );
}
