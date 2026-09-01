"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  LuBookOpen,
  LuBriefcaseBusiness,
  LuChevronDown,
  LuCircle,
  LuFolderKanban,
  LuHouse,
  LuInfo,
  LuLayoutDashboard,
  LuMenu,
  LuNewspaper,
  LuPackage,
  LuPresentation,
  LuSparkles,
  LuUsers,
  LuWorkflow,
} from "react-icons/lu";
import { IoGlobeOutline } from "react-icons/io5";
import { NAV_ITEMS } from "@/lib/nav";
import { ProfileNav } from "@/components/profile-nav";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV_TEXT =
  "flex min-h-[42px] w-full items-center gap-2.5 rounded-lg px-2.5 py-2 font-mono text-[13px] font-medium leading-none text-primary-foreground/85 no-underline transition-colors hover:bg-primary-foreground/12 hover:text-primary-foreground focus-visible:bg-primary-foreground/12 focus-visible:text-primary-foreground focus-visible:outline-none";

const NAV_ACTIVE = "bg-background !text-foreground hover:bg-background";

const NAV_ICONS: Record<string, IconType> = {
  Home: LuHouse,
  Dashboard: LuLayoutDashboard,
  Assets: LuBookOpen,
  Directory: LuUsers,
  Team: LuUsers,
  Talent: LuSparkles,
  Updates: LuNewspaper,
  Company: LuInfo,
  About: LuInfo,
  People: LuUsers,
  Careers: LuBriefcaseBusiness,
  Projects: LuFolderKanban,
  Products: LuPackage,
  Workflows: LuWorkflow,
  Resources: LuBookOpen,
  "Brand assets": LuBookOpen,
  Blog: LuNewspaper,
  Agency: LuWorkflow,
  Pitch: LuPresentation,
};

function sentenceCase(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

function NavIcon({ label }: { label: string }) {
  const Icon = NAV_ICONS[label] ?? LuCircle;
  return <Icon aria-hidden="true" className="h-[17px] w-[17px]" />;
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <ul className="m-0 flex list-none flex-col items-stretch gap-0.5 p-0">
      {NAV_ITEMS.map((item) => {
        if (item.kind === "link") {
          const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.label} className="w-full">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                onClick={onNavigate}
                className={`${NAV_TEXT} ${current ? NAV_ACTIVE : ""}`}
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
              className={`cursor-pointer border-0 text-left ${NAV_TEXT} ${
                sectionActive ? NAV_ACTIVE : "bg-transparent"
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
                        className={`${NAV_TEXT} ${current ? NAV_ACTIVE : ""}`}
                      >
                        <NavIcon label={entry.label} />
                        <span>{sentenceCase(entry.label)}</span>
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
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-primary-foreground/20 focus-visible:outline-none"
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
        className="hidden flex-col gap-3 overflow-y-auto rounded-2xl bg-primary p-3 nav:fixed nav:inset-y-4 nav:left-4 nav:flex nav:w-[208px]"
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-primary-foreground hover:bg-primary-foreground/12 focus-visible:outline-none"
          >
            <LuMenu aria-hidden="true" className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(280px,84vw)] gap-3 overflow-y-auto p-3">
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
