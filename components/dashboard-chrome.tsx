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
  const isViewingAs = auth?.isViewingAs ?? false;
  const stopViewingAs = auth?.stopViewingAs;
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

  // Entering the dashboard while viewing a client ends the admin's temporary view.
  // A signed-in client still belongs in the portal.
  useEffect(() => {
    if (!isClientUser) return;
    if (isViewingAs) stopViewingAs?.();
    else router.replace("/portal");
  }, [isClientUser, isViewingAs, stopViewingAs, router]);

  // The dashboard is for signed-in people only. Shared job links live at /jobs.
  const signedOut = Boolean(auth && !auth.loading && !auth.user);
  useEffect(() => {
    if (signedOut) router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
  }, [signedOut, pathname, router]);

  // An admin switched onboarding on for this person: send them through it first.
  useEffect(() => {
    if (onboardingDue && !pathname.startsWith("/onboarding")) router.replace("/onboarding");
  }, [onboardingDue, pathname, router]);

  if (isClientUser) return null;
  if (!auth || auth.loading || signedOut) return null;
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
        className={`min-w-0 flex-1 pb-16 pt-0 nav:pb-0 transition-[margin-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCollapsed ? "nav:ml-[64px]" : "nav:ml-[256px]"}`}
      >
        {children}
      </div>
      <DashboardFooter />
    </div>
    </MobileHeaderProvider>
  );
}
