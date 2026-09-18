"use client";

import { DashboardLogo, DashboardSidebarContent, DashboardSidebarSheet } from "@/components/dashboard-sidebar";

export function DashboardHeader({
  hideMobile = false,
  sidebarCollapsed = false,
  onToggleSidebar,
}: {
  hideMobile?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}) {
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
        <DashboardLogo />
        <DashboardSidebarSheet />
      </div>
    </>
  );
}
