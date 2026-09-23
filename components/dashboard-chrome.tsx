"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardFooter } from "@/components/dashboard-footer";
import { MobileHeaderProvider } from "@/components/dashboard/mobile-header";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => pathname === "/dashboard/creators");
  const isApplication = pathname === "/dashboard/careers/apply";
  const isClientDetail = /^\/dashboard\/clients\/[^/]+(?:\/|$)/.test(pathname);
  const isCreators = pathname === "/dashboard/creators";
  const isCreatorDetail = /^\/dashboard\/creators\/[^/]+$/.test(pathname);

  useEffect(() => {
    setSidebarCollapsed(pathname === "/dashboard/creators");
  }, [pathname]);

  if (isApplication) return <>{children}</>;

  const hideMobileHeader = isClientDetail || isCreators || isCreatorDetail;

  return (
    <MobileHeaderProvider enabled={!hideMobileHeader}>
    <div className="flex min-h-screen flex-1 flex-col nav:flex-row">
      <DashboardHeader
        hideMobile={hideMobileHeader}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
      />
      <div
        className={`min-w-0 flex-1 pb-16 pt-0 nav:pb-0 nav:pt-[60px] transition-[margin-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCollapsed ? "nav:ml-[80px]" : "nav:ml-[208px]"}`}
      >
        {children}
      </div>
      <DashboardFooter />
    </div>
    </MobileHeaderProvider>
  );
}
