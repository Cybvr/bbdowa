"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { DashboardSidebarContent, DashboardSidebarSheet } from "@/components/dashboard-sidebar";
import { TrackerIcon } from "@/components/nav-icons";
import { createGlyphAvatarDataUri } from "@/lib/avatar";
import { TimeTracker } from "@/components/time-tracker";
import { useMobileHeader } from "@/components/dashboard/mobile-header";
import { NAV_ITEMS, type NavItem } from "@/lib/nav";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DashboardHeader({
  hideMobile = false,
  sidebarCollapsed = false,
  onToggleSidebar,
}: {
  hideMobile?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}) {
  const { user, isViewingAs, viewAsUser, stopViewingAs } = useAuth();
  const pathname = usePathname();
  const [trackerOpen, setTrackerOpen] = useState(false);
  const mobileHeader = useMobileHeader();
  const mobileTitle =
    mobileHeader?.title ??
    NAV_ITEMS.find((item): item is Extract<NavItem, { kind: "link" }> => item.kind === "link" && item.href === pathname)?.label ??
    null;

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        aria-label="Primary navigation"
        className={`hidden flex-col gap-2 overflow-y-auto border-r border-border bg-background p-2.5 text-foreground transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] nav:fixed nav:inset-y-4 nav:left-4 nav:flex ${sidebarCollapsed ? "nav:w-[64px]" : "nav:w-[256px]"}`}
      >
        <DashboardSidebarContent
          collapsed={sidebarCollapsed}
          onToggleCollapse={onToggleSidebar}
          showCollapseToggle
        />
      </nav>

      {/* Mobile top bar */}
      <div
        className={`${hideMobile ? "hidden" : "sticky top-0 z-40 flex"} items-center justify-between bg-background px-[max(18px,env(safe-area-inset-left))] py-3 text-foreground nav:hidden`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <DashboardSidebarSheet
            trigger={
              <button
                type="button"
                aria-label="Open dashboard menu"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={createGlyphAvatarDataUri(user?.name ?? user?.email?.split("@")[0] ?? "BBDO User")}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            }
          />
          {mobileTitle ? (
            <h1 className="m-0 truncate text-[20px] font-bold leading-tight tracking-tight">{mobileTitle}</h1>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div ref={mobileHeader?.setSearchSlot} className="contents" />
          <div ref={mobileHeader?.setActionSlot} className="contents" />
          {isViewingAs ? (
            <button
              type="button"
              onClick={stopViewingAs}
              className="inline-flex h-9 max-w-[150px] items-center truncate rounded-lg border border-primary/30 bg-primary/5 px-2 text-[11px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              title="Exit view as mode"
            >
              Exit view
            </button>
          ) : null}
          <Dialog open={trackerOpen} onOpenChange={setTrackerOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Open tracker"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <TrackerIcon className="h-5 w-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-x-hidden overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tracker</DialogTitle>
                <DialogDescription>Start a timer or log time from your phone.</DialogDescription>
              </DialogHeader>
              <TimeTracker compact />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
