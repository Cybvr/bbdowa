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
  LuMenu,
  LuNewspaper,
  LuPackage,
  LuPresentation,
  LuUsers,
  LuWorkflow,
} from "react-icons/lu";
import { IoGlobeOutline } from "react-icons/io5";
import { NAV_ITEMS } from "@/lib/nav";
import { ProfileNav } from "@/components/profile-nav";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const TOP_TEXT =
  "flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-[14px] font-medium leading-none text-primary-foreground/85 no-underline transition-colors hover:bg-primary-foreground/12 hover:text-primary-foreground focus-visible:bg-primary-foreground/12 focus-visible:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-foreground";

const MENU_TEXT =
  "flex min-h-[38px] w-full items-center gap-2 rounded-lg px-3 py-2 font-mono text-[13px] font-medium text-primary-foreground/85 no-underline transition-colors hover:bg-primary-foreground/12 hover:text-primary-foreground focus-visible:bg-primary-foreground/12 focus-visible:text-primary-foreground focus-visible:outline-none";

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

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <ul className="m-0 flex list-none flex-col items-stretch gap-1 p-0">
      {NAV_ITEMS.map((item) => {
        if (item.kind === "link") {
          const current = pathname === item.href;
          return (
            <li key={item.label} className="w-full">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                onClick={onNavigate}
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
          <li key={item.label} className="w-full">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenMenu(open ? null : item.label)}
              className={`cursor-pointer border-0 bg-transparent text-left ${TOP_TEXT} ${
                sectionActive ? "bg-background !text-foreground hover:bg-background" : ""
              }`}
            >
              <NavIcon label={item.label} />
              <span>{sentenceCase(item.label)}</span>
              <LuChevronDown aria-hidden="true" className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <ul className="m-0 mt-1 w-full list-none rounded-lg bg-black/15 p-1">
                {item.items.map((entry) => {
                  const current = pathname === entry.href;
                  return (
                    <li key={entry.href} className="block w-full">
                      <Link
                        href={entry.href}
                        aria-current={current ? "page" : undefined}
                        onClick={onNavigate}
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
            )}
          </li>
        );
      })}
    </ul>
  );
}

function NavFooter({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="mt-auto flex items-center gap-2 pt-4">
      <Link
        href="/"
        onClick={onNavigate}
        aria-label="Main site"
        title="Main site"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-primary-foreground/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
      >
        <IoGlobeOutline aria-hidden="true" className="h-[18px] w-[18px]" />
      </Link>
      <ProfileNav />
    </div>
  );
}

function Logo() {
  return (
    <Link href="/dashboard" aria-label="BBDO West Africa dashboard" className="min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bbdo-west-africa.png"
        alt="BBDO West Africa"
        className="block h-auto w-[clamp(120px,11vw,150px)] max-w-full brightness-0 invert"
      />
    </Link>
  );
}

export function DashboardHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        aria-label="Primary navigation"
        className="hidden flex-col gap-6 overflow-y-auto rounded-2xl bg-primary p-4 nav:fixed nav:inset-y-4 nav:left-4 nav:flex nav:w-[224px]"
      >
        <Logo />
        <NavList />
        <NavFooter />
      </nav>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between bg-primary px-[max(18px,env(safe-area-inset-left))] py-3 nav:hidden">
        <Logo />
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            aria-label="Open navigation"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-primary-foreground hover:bg-primary-foreground/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
          >
            <LuMenu aria-hidden="true" className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(300px,84vw)] gap-6 overflow-y-auto p-4">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Logo />
            <NavList onNavigate={() => setMobileOpen(false)} />
            <NavFooter onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
