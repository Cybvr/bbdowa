"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LuChevronDown, LuMenu } from "react-icons/lu";
import { IoGlobeOutline } from "react-icons/io5";
import { NAV_ITEMS } from "@/lib/nav";
import { NAV_ICON_SET } from "@/components/nav-icons";
import { ProfileNav } from "@/components/profile-nav";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV_TEXT =
  "flex min-h-[42px] w-full items-center gap-2.5 rounded-lg px-2.5 py-2 font-mono text-[13px] font-medium leading-none text-primary-foreground/85 no-underline transition-colors hover:bg-black/15 hover:text-primary-foreground focus-visible:bg-black/15 focus-visible:text-primary-foreground focus-visible:outline-none";

const NAV_ACTIVE = "bg-black/25 !text-primary-foreground hover:bg-black/25";

function sentenceCase(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

function NavIcon({ label }: { label: string }) {
  const Icon = NAV_ICON_SET[label];
  if (!Icon) return <span aria-hidden="true" className="h-[17px] w-[17px]" />;
  return <Icon className="h-[17px] w-[17px]" />;
}

export function DashboardLogo({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/dashboard" onClick={onNavigate} aria-label="BBDO West Africa dashboard" className="min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bbdo-west-africa.png"
        alt="BBDO West Africa"
        className="block h-auto w-[clamp(120px,11vw,150px)] max-w-full brightness-0 invert"
      />
    </Link>
  );
}

export function DashboardNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <ul className="m-0 flex list-none flex-col items-stretch gap-0.5 p-0">
      {NAV_ITEMS.map((item) => {
        if (item.kind === "link") {
          const current =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
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
              <ul className="m-0 mt-1 w-full list-none rounded-lg p-1">
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

export function DashboardNavFooter({ onNavigate }: { onNavigate?: () => void }) {
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

export function DashboardSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <DashboardLogo onNavigate={onNavigate} />
      <DashboardNavList onNavigate={onNavigate} />
      <DashboardNavFooter onNavigate={onNavigate} />
    </>
  );
}

export function DashboardSidebarSheet({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <button
            type="button"
            aria-label="Open navigation menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent text-foreground hover:bg-muted focus-visible:outline-none transition cursor-pointer"
          >
            <LuMenu className="h-5 w-5" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(280px,84vw)] gap-3 overflow-y-auto p-3 bg-primary text-primary-foreground border-0 shadow-2xl rounded-2xl">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <DashboardSidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
