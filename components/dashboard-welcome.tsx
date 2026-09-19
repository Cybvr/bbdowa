"use client";

import { useAuth } from "@/components/auth-provider";

export function DashboardWelcome() {
  const { user } = useAuth();
  const name = user?.name?.trim().split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <header className="border-b border-border pb-5">
      <h1 className="m-0 text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
        Welcome back, {name}.
      </h1>
      <p className="mb-0 mt-2 text-[14px] text-muted-foreground">
        Here’s what’s happening across the agency.
      </p>
    </header>
  );
}
