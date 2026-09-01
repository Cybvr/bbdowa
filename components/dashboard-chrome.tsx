"use client";

import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApplication = pathname === "/dashboard/careers/apply";

  if (isApplication) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-1 flex-col nav:flex-row">
      <DashboardHeader />
      <div className="min-w-0 flex-1 nav:ml-[224px]">{children}</div>
    </div>
  );
}
