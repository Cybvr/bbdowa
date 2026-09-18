"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isApplication = pathname === "/dashboard/careers/apply";
  const isClientDetail = /^\/dashboard\/clients\/[^/]+(?:\/|$)/.test(pathname);

  if (isApplication) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-1 flex-col nav:flex-row">
      <DashboardHeader
        hideMobile={isClientDetail}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
      />
      <div className={`min-w-0 flex-1 ${sidebarCollapsed ? "nav:ml-[80px]" : "nav:ml-[208px]"}`}>{children}</div>
    </div>
  );
}
