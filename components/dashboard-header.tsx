"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  LuBookOpen,
  LuBriefcaseBusiness,
  LuChevronDown,
  LuChevronRight,
  LuCircle,
  LuFolderKanban,
  LuHouse,
  LuInfo,
  LuLayoutDashboard,
  LuNewspaper,
  LuPackage,
  LuPresentation,
  LuUsers,
  LuWorkflow,
} from "react-icons/lu";
import { IoGlobeOutline } from "react-icons/io5";
import { NAV_ITEMS } from "@/lib/nav";
import { ProfileNav } from "@/components/profile-nav";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TOP_TEXT =
  "flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-[14px] font-medium leading-none text-primary-foreground/85 no-underline transition-colors hover:bg-primary-foreground/12 hover:text-primary-foreground focus-visible:bg-primary-foreground/12 focus-visible:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-foreground max-nav:min-h-[48px] max-nav:justify-between max-nav:px-4 max-nav:py-3";

const MENU_TEXT =
  "flex min-h-[38px] w-full items-center gap-2 rounded-lg px-3 py-2 font-mono text-[13px] font-medium text-primary-foreground/85 no-underline transition-colors hover:bg-primary-foreground/12 hover:text-primary-foreground focus-visible:bg-primary-foreground/12 focus-visible:text-primary-foreground focus-visible:outline-none max-nav:min-h-[44px] max-nav:px-4 max-nav:py-3";

const NAV_ICONS: Record<string, IconType> = {
  Home: LuHouse,
  Dashboard: LuLayoutDashboard,
  About: LuInfo,
  People: LuUsers,
  Careers: LuBriefcaseBusiness,
  Projects: LuFolderKanban,
  Products: LuPackage,
  Workflows: LuWorkflow,
  Resources: LuBookOpen,
  Blog: LuNewspaper,
  Agency: LuWorkflow,
  Pitch: LuPresentation,
};

function sentenceCase(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

function NavIcon({ label, small = false }: { label: string; small?: boolean }) {
  const Icon = NAV_ICONS[label] ?? LuCircle;
  return <Icon aria-hidden="true" className={small ? "h-3.5 w-3.5" : "h-[17px] w-[17px]"} />;
}

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
      className="z-[1000] flex flex-col nav:fixed nav:inset-y-4 nav:left-4 nav:w-[224px] max-nav:static max-nav:grid max-nav:min-h-[68px] max-nav:w-full max-nav:grid-cols-[minmax(0,1fr)_auto] max-nav:gap-x-4 max-nav:gap-y-0 max-nav:bg-primary max-nav:px-[max(18px,env(safe-area-inset-left))] max-nav:py-[10px]"
    >
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto rounded-2xl bg-primary p-3 max-nav:contents">
      <Link href="/dashboard" aria-label="BBDO West Africa dashboard" className="min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bbdo-west-africa.png"
          alt="BBDO West Africa"
          className="block h-auto w-[clamp(120px,11vw,150px)] max-w-full brightness-0 invert"
        />
      </Link>

      <ul
        className={`m-0 mt-0 flex list-none flex-col items-stretch gap-1 p-0 max-nav:col-span-full max-nav:mt-2.5 max-nav:ml-0 max-nav:w-full max-nav:gap-0 max-nav:pt-2.5 max-nav:pb-[max(10px,env(safe-area-inset-bottom))] ${
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
                  className={`${TOP_TEXT} ${current ? "bg-background !text-foreground hover:bg-background" : ""}`}
                >
                  <NavIcon label={item.label} />
                  <span>{sentenceCase(item.label)}</span>
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
                className={`cursor-pointer border-0 bg-transparent text-left ${TOP_TEXT} ${
                  sectionActive ? "bg-background !text-foreground hover:bg-background" : ""
                }`}
              >
                <NavIcon label={item.label} />
                <span>{sentenceCase(item.label)}</span>
                <LuChevronDown aria-hidden="true" className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              <ul
                className={`z-[1000] m-0 mt-1 w-full min-w-0 list-none rounded-lg bg-black/15 p-1 ${
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
                        className={`${MENU_TEXT} ${current ? "bg-background !text-foreground" : ""}`}
                      >
                        <NavIcon label={entry.label} small />
                        <span>{sentenceCase(entry.label)}</span>
                        <LuChevronRight aria-hidden="true" className="ml-auto h-3.5 w-3.5 opacity-60" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex items-center gap-2 max-nav:col-start-2 max-nav:row-start-1 max-nav:mt-0 max-nav:justify-self-end">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                onClick={closeAll}
                aria-label="Main site"
                className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <IoGlobeOutline aria-hidden="true" className="h-[18px] w-[18px]" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">Main site</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <ProfileNav />
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMobileOpen((open) => !open)}
          className="hidden min-h-[44px] min-w-[64px] cursor-pointer items-center justify-center border border-white bg-transparent px-[14px] font-mono text-[12px] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white max-nav:inline-flex"
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>
      </div>
    </nav>
  );
}
