import Link from "next/link";
import { MARKETING_FOOTER_LINKS, MARKETING_NAV } from "@/lib/nav";

const COLUMN_TITLE = "m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-white/55";
const COLUMN_LINK =
  "text-[17px] uppercase tracking-[-0.02em] text-white no-underline hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

export function Footer() {
  return (
    <footer className="flex-none bg-foreground px-[clamp(20px,5vw,72px)] pb-[clamp(28px,4vw,44px)] pt-[clamp(48px,6vw,80px)] text-white">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-x-[clamp(20px,4vw,64px)] gap-y-10 border-b border-white/25 pb-[clamp(36px,5vw,64px)]">
        <nav aria-label="Page sections">
          <h2 className={COLUMN_TITLE}>This page</h2>
          <ul className="m-0 mt-5 list-none p-0">
            {MARKETING_NAV.map((item) => (
              <li key={item.href} className="py-[7px]">
                <Link href={item.href} className={COLUMN_LINK}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Agency">
          <h2 className={COLUMN_TITLE}>Agency</h2>
          <ul className="m-0 mt-5 list-none p-0">
            {MARKETING_FOOTER_LINKS.map((item) => (
              <li key={item.href} className="py-[7px]">
                <Link href={item.href} className={COLUMN_LINK}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={COLUMN_TITLE}>Studio</h2>
          <address className="mt-5 not-italic text-[17px] leading-[1.5] text-white/85">
            Lagos, Nigeria
            <br />
            <a
              href="mailto:info@bbdowestafrica.com"
              className="text-white underline underline-offset-[5px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              info@bbdowestafrica.com
            </a>
          </address>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6 pt-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
          BBDO West Africa
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
          Do Big Things
        </span>
      </div>
    </footer>
  );
}
