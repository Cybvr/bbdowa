"use client";

import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { SiteFooter } from "@/components/site-footer";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApplication = pathname === "/dashboard/careers/apply";

  return (
    <>
      {isApplication ? null : <DashboardHeader />}
      {children}
      {isApplication ? null : <SiteFooter />}
    </>
  );
}
