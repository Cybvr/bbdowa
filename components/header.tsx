import Link from "next/link";
import { MARKETING_NAV } from "@/lib/nav";
import { ProfileNav } from "@/components/profile-nav";

const LINK =
  "font-mono text-[11px] uppercase tracking-[0.16em] text-white no-underline hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex flex-none flex-wrap items-center gap-x-10 gap-y-3 bg-primary px-[clamp(20px,5vw,72px)] py-4">
      <Link href="/" aria-label="BBDO West Africa" className="min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bbdo-west-africa.png"
          alt="BBDO West Africa"
          className="block h-auto w-[clamp(104px,10vw,132px)] max-w-full brightness-0 invert"
        />
      </Link>

      <div className="ml-auto flex items-center gap-5 max-[760px]:w-full max-[760px]:justify-between">
        <nav aria-label="Sections" className="min-w-0">
          <ul className="m-0 flex list-none flex-wrap items-center justify-end gap-x-8 gap-y-2 p-0 max-[760px]:gap-x-4">
            {MARKETING_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={LINK}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ProfileNav />
      </div>
    </header>
  );
}
