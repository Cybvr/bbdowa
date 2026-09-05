"use client";

import { DashboardLogo, DashboardSidebarContent, DashboardSidebarSheet } from "@/components/dashboard-sidebar";

export function DashboardHeader({ hideMobile = false }: { hideMobile?: boolean }) {
  return (
    <>
      {/* Desktop sidebar */}
      <nav
        aria-label="Primary navigation"
        className="hidden flex-col gap-2 overflow-y-auto rounded-2xl bg-primary p-2.5 nav:fixed nav:inset-y-4 nav:left-4 nav:flex nav:w-[192px]"
      >
        <DashboardSidebarContent />
      </nav>

      {/* Mobile top bar */}
      <div
        className={`${hideMobile ? "hidden" : "sticky top-0 z-40 flex"} items-center justify-between bg-primary px-[max(18px,env(safe-area-inset-left))] py-3 nav:hidden`}
      >
        <DashboardLogo />
        <DashboardSidebarSheet />
      </div>
    </>
  );
}
