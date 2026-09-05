"use client";

import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApplication = pathname === "/dashboard/careers/apply";
  const isClientDetail = /^\/dashboard\/clients\/[^/]+(?:\/|$)/.test(pathname);

  if (isApplication) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-1 flex-col nav:flex-row">
      <DashboardHeader hideMobile={isClientDetail} />
      <div className="min-w-0 flex-1 nav:ml-[208px]">{children}</div>
    </div>
  );
}
