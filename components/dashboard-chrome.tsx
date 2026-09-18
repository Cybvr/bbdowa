"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { AuthProvider, useAuth } from "@/components/auth-provider";

function AuthenticatedDashboard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      router.replace(`/auth/login?next=${encodeURIComponent(`${pathname}${window.location.search}`)}`);
    }
  }, [auth.loading, auth.user, pathname, router]);

  if (auth.loading || !auth.user) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  return <>{children}</>;
}

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => pathname === "/dashboard/creators");
  const isApplication = pathname === "/dashboard/careers/apply";
  const isClientDetail = /^\/dashboard\/clients\/[^/]+(?:\/|$)/.test(pathname);

  useEffect(() => {
    setSidebarCollapsed(pathname === "/dashboard/creators");
  }, [pathname]);

  if (isApplication) return <>{children}</>;

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-1 flex-col nav:flex-row">
        <DashboardHeader
          hideMobile={isClientDetail}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        />
        <div className={`min-w-0 flex-1 transition-[margin-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCollapsed ? "nav:ml-[80px]" : "nav:ml-[208px]"}`}>
          <AuthenticatedDashboard>{children}</AuthenticatedDashboard>
        </div>
      </div>
    </AuthProvider>
  );
}
