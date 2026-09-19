"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuMenu } from "react-icons/lu";
import { NAV_ITEMS } from "@/lib/nav";
import { NAV_ICON_SET } from "@/components/nav-icons";
import { ProfileNav } from "@/components/profile-nav";
import { useOptionalAuth } from "@/components/auth-provider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV_TEXT =
  "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-sm font-medium leading-none text-foreground no-underline transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground focus-visible:outline-none nav:min-h-9 nav:gap-2 nav:px-2 nav:py-1.5 nav:text-xs";

const NAV_LABEL = "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

const NAV_ACTIVE = "bg-muted !text-foreground hover:bg-muted";

function sentenceCase(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

function NavIcon({ label }: { label: string }) {
  const Icon = NAV_ICON_SET[label];
  if (!Icon) return <span aria-hidden="true" className="h-5 w-5 nav:h-4 nav:w-4" />;
  return <Icon className="h-5 w-5 nav:h-4 nav:w-4" />;
}

export function DashboardLogo({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      aria-label="BBDO West Africa dashboard"
      className="inline-flex min-w-0 w-fit"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bbdo-west-africa.png"
        alt="BBDO West Africa"
        className="block h-auto w-[clamp(112px,10vw,138px)] max-w-full brightness-0"
      />
    </Link>
  );
}

export function DashboardNavList({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const auth = useOptionalAuth();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const visibleItems = NAV_ITEMS.filter((item) => !item.requiresAuth || Boolean(auth?.user));

  useEffect(() => {
    const activeMenu = NAV_ITEMS.find(
      (item) =>
        item.kind === "menu" &&
        (Array.isArray(item.match)
          ? item.match.some((match) => pathname.startsWith(match))
          : pathname.startsWith(item.match)),
    );

    if (activeMenu?.kind === "menu") setOpenMenu(activeMenu.label);
  }, [pathname]);

  return (
    <ul className="m-0 flex list-none flex-col items-stretch gap-0.5 p-0">
      {visibleItems.map((item) => {
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
                title={collapsed ? sentenceCase(item.label) : undefined}
                className={`${NAV_TEXT} ${collapsed ? "justify-center px-0" : ""} ${current ? NAV_ACTIVE : ""}`}
              >
                <NavIcon label={item.label} />
                <span className={`${NAV_LABEL} ${collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"}`}>
                  {sentenceCase(item.label)}
                </span>
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
              title={collapsed ? sentenceCase(item.label) : undefined}
              className={`cursor-pointer border-0 text-left ${NAV_TEXT} ${collapsed ? "justify-center px-0" : ""} ${
                sectionActive ? NAV_ACTIVE : "bg-transparent"
              }`}
            >
              <NavIcon label={item.label} />
              <span className={`${NAV_LABEL} ${collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"}`}>
                {sentenceCase(item.label)}
              </span>
              <LuChevronDown aria-hidden="true" className={`${collapsed ? "hidden" : "ml-auto"} h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <div
              aria-hidden={!open}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                open ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <ul className="m-0 mt-1 w-full list-none rounded-lg p-1">
                  {item.items
                    .filter((entry) => !entry.requiresAuth || Boolean(auth?.user))
                    .map((entry) => {
                      const current = pathname === entry.href;
                      return (
                        <li key={entry.href} className="block w-full">
                          <Link
                            href={entry.href}
                            aria-current={current ? "page" : undefined}
                            onClick={onNavigate}
                            tabIndex={open ? 0 : -1}
                            title={collapsed ? sentenceCase(entry.label) : undefined}
                            className={`${NAV_TEXT} ${collapsed ? "justify-center px-0" : "pl-7"} ${current ? NAV_ACTIVE : ""}`}
                          >
                            <NavIcon label={entry.label} />
                            <span className={`${NAV_LABEL} ${collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"}`}>
                              {sentenceCase(entry.label)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardNavFooter({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="mt-auto pt-3">
      <ProfileNav variant={collapsed ? "avatar" : "row"} />
    </div>
  );
}

export function DashboardSidebarContent({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  showCollapseToggle = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
}) {
  return (
    <>
      <div className={`flex min-h-9 items-center gap-2 ${collapsed ? "justify-center" : "justify-between"}`}>
        <div
          className={`min-w-0 overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
          }`}
        >
          <DashboardLogo onNavigate={onNavigate} />
        </div>
        {showCollapseToggle && onToggleCollapse ? (
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapse}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {collapsed ? <LuChevronRight aria-hidden="true" className="h-4 w-4" /> : <LuChevronLeft aria-hidden="true" className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      <DashboardNavList onNavigate={onNavigate} collapsed={collapsed} />
      <DashboardNavFooter collapsed={collapsed} />
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
      <SheetContent side="left" className="w-[min(264px,84vw)] gap-2 overflow-y-auto rounded-2xl border-0 bg-background p-2.5 text-foreground shadow-2xl">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <DashboardSidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
