"use client";

import { useState } from "react";
import { LuMenu } from "react-icons/lu";
import { DashboardLogo, DashboardSidebarContent, DashboardSidebarSheet } from "@/components/dashboard-sidebar";
import { ProfileNav } from "@/components/profile-nav";
import { TrackerIcon } from "@/components/nav-icons";
import { TimeTracker } from "@/components/time-tracker";
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
  const [trackerOpen, setTrackerOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        aria-label="Primary navigation"
        className={`hidden flex-col gap-2 overflow-y-auto rounded-2xl bg-background p-2.5 text-foreground transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] nav:fixed nav:inset-y-4 nav:left-4 nav:flex ${sidebarCollapsed ? "nav:w-[64px]" : "nav:w-[192px]"}`}
      >
        <DashboardSidebarContent
          collapsed={sidebarCollapsed}
          onToggleCollapse={onToggleSidebar}
          showCollapseToggle
        />
      </nav>

      {/* Mobile top bar */}
      <div
        className={`${hideMobile ? "hidden" : "sticky top-0 z-40 flex"} items-center justify-between bg-primary px-[max(18px,env(safe-area-inset-left))] py-3 nav:hidden`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <DashboardSidebarSheet
            trigger={
              <button
                type="button"
                aria-label="Open dashboard menu"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary-foreground transition hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60"
              >
                <LuMenu aria-hidden="true" className="h-5 w-5" />
              </button>
            }
          />
          <DashboardLogo light />
        </div>
        <div className="flex items-center gap-1">
          <Dialog open={trackerOpen} onOpenChange={setTrackerOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Open tracker"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground transition hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60"
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
          <ProfileNav variant="avatar" />
        </div>
      </div>
    </>
  );
}
