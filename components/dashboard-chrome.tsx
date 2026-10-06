"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardFooter } from "@/components/dashboard-footer";
import { MobileHeaderProvider } from "@/components/dashboard/mobile-header";
import { useOptionalAuth } from "@/components/auth-provider";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useOptionalAuth();
  const onboardingDue = auth?.onboardingDue ?? false;
  const isClientUser = auth?.role === "client";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => pathname === "/dashboard/discover");
  const [hydrated, setHydrated] = useState(false);
  const isApplication = pathname === "/dashboard/careers/apply";
  const isClientDetail = /^\/admin\/clients\/[^/]+(?:\/|$)/.test(pathname);

  useEffect(() => {
    setSidebarCollapsed(pathname === "/dashboard/discover");
  }, [pathname]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Client users have their own portal and never use the agency dashboard.
  useEffect(() => {
    if (isClientUser) router.replace("/portal");
  }, [isClientUser, router]);

  // An admin switched onboarding on for this person: send them through it first.
  useEffect(() => {
    if (onboardingDue && !pathname.startsWith("/onboarding")) router.replace("/onboarding");
  }, [onboardingDue, pathname, router]);

  if (isClientUser) return null;
  if (isApplication) return <>{children}</>;

  const hideMobileHeader = isClientDetail;

  return (
    <MobileHeaderProvider enabled={!hideMobileHeader}>
    <div className="flex min-h-screen flex-1 flex-col nav:flex-row">
      {hydrated ? (
        <DashboardHeader
          hideMobile={hideMobileHeader}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        />
      ) : null}
      <div
        className={`min-w-0 flex-1 pb-16 pt-0 nav:pb-0 transition-[margin-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCollapsed ? "nav:ml-[80px]" : "nav:ml-[272px]"}`}
      >
        {children}
      </div>
      <DashboardFooter />
    </div>
    </MobileHeaderProvider>
  );
}
