"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IoNotifications } from "react-icons/io5";
import { NAV_ITEMS } from "@/lib/nav";
import { ProfileNav } from "@/components/profile-nav";

const TOP_TEXT =
  "font-mono text-[12.6px] font-semibold uppercase tracking-[0.03em] text-white no-underline hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-white max-nav:flex max-nav:w-full max-nav:min-h-[48px] max-nav:items-center max-nav:justify-between max-nav:text-[13px]";

const MENU_TEXT =
  "block w-full whitespace-nowrap px-4 py-[11px] font-mono text-[10.8px] font-semibold uppercase tracking-[0.1em] text-white no-underline hover:bg-primary focus-visible:bg-primary max-nav:min-h-[44px] max-nav:whitespace-normal max-nav:px-4 max-nav:py-3";

export function DashboardHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1100) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target as HTMLElement | null)?.closest("[data-nav-menu]")) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const closeAll = () => {
    setMobileOpen(false);
    setOpenMenu(null);
  };

  return (
    <nav
      aria-label="Primary navigation"
      onKeyDown={(event) => {
        if (event.key === "Escape") closeAll();
      }}
      className="sticky top-0 z-[1000] flex min-h-[60px] flex-none items-center justify-between gap-8 bg-primary px-[clamp(24px,6vw,96px)] py-[6px] max-nav:grid max-nav:min-h-[68px] max-nav:grid-cols-[minmax(0,1fr)_auto] max-nav:gap-x-4 max-nav:gap-y-0 max-nav:px-[max(18px,env(safe-area-inset-left))] max-nav:py-[10px]"
    >
      <Link href="/dashboard" aria-label="BBDO West Africa dashboard" className="min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bbdo-west-africa.png"
          alt="BBDO West Africa"
          className="block h-auto w-[clamp(120px,11vw,150px)] max-w-full brightness-0 invert"
        />
      </Link>

      <ul
        className={`m-0 ml-auto flex list-none items-center gap-[clamp(12px,1.8vw,28px)] p-0 max-nav:col-span-full max-nav:mt-2.5 max-nav:ml-0 max-nav:w-full max-nav:flex-col max-nav:items-stretch max-nav:gap-0 max-nav:pt-2.5 max-nav:pb-[max(10px,env(safe-area-inset-bottom))] ${
          mobileOpen ? "max-nav:flex" : "max-nav:hidden"
        }`}
      >
        {NAV_ITEMS.map((item) => {
          if (item.kind === "link") {
            const current = pathname === item.href;
            return (
              <li key={item.label} className="text-[14px] max-nav:w-full">
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  onClick={closeAll}
                  className={`${TOP_TEXT} ${current ? "underline underline-offset-[6px]" : ""}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          }

          const sectionActive = Array.isArray(item.match)
            ? item.match.some((match) => pathname.startsWith(match))
            : pathname.startsWith(item.match);
          const open = openMenu === item.label;

          return (
            <li
              key={item.label}
              data-nav-menu
              className="group/menu relative text-[14px] max-nav:w-full"
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={open}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenMenu(open ? null : item.label);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setOpenMenu(item.label);
                  }
                }}
                className={`inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 after:text-[0.8em] after:content-['▾'] ${TOP_TEXT} ${
                  sectionActive ? "underline underline-offset-[6px]" : ""
                }`}
              >
                {item.label}
              </button>
              <ul
                className={`absolute left-[-16px] top-[calc(100%+12px)] z-[1000] m-0 min-w-[200px] list-none bg-foreground p-0 py-1.5 before:absolute before:inset-x-0 before:bottom-full before:h-3 before:content-[''] nav:group-hover/menu:block nav:group-focus-within/menu:block max-nav:static max-nav:w-full max-nav:min-w-0 max-nav:py-1 max-nav:before:hidden ${
                  open ? "block" : "hidden"
                }`}
              >
                {item.items.map((entry) => {
                  const current = pathname === entry.href;
                  return (
                    <li key={entry.href} className="block w-full">
                      <Link
                        href={entry.href}
                        aria-current={current ? "page" : undefined}
                        onClick={closeAll}
                        className={`${MENU_TEXT} ${current ? "underline underline-offset-[4px]" : ""}`}
                      >
                        {entry.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>

      <div className="order-3 flex items-center gap-2 max-nav:col-start-2 max-nav:row-start-1 max-nav:justify-self-end">
        <Link
          href="/"
          onClick={closeAll}
          className="inline-flex items-center whitespace-nowrap border border-white/70 px-3.5 py-[9px] font-mono text-[11px] font-extrabold uppercase tracking-[0.08em] text-white no-underline transition-colors hover:bg-white hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-nav:hidden"
        >
          Main site
        </Link>
        <button
          type="button"
          aria-label="Open notifications"
          className="inline-flex h-11 w-11 items-center justify-center border border-white/45 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <IoNotifications aria-hidden="true" className="h-[18px] w-[18px]" />
        </button>
        <ProfileNav />
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMobileOpen((open) => !open)}
          className="hidden min-h-[44px] min-w-[64px] cursor-pointer items-center justify-center border border-white bg-transparent px-[14px] font-mono text-[12px] font-extrabold uppercase tracking-[0.08em] text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white max-nav:inline-flex"
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>
    </nav>
  );
}
