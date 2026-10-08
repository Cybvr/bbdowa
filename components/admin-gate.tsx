"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

/** The admin workspace is shared by admins and managers; individual tools can remain admin-only. */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  if (loading) return null;
  if (isStaff) return <>{children}</>;
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="max-w-sm text-center">
        <h1 className="m-0 text-item-title font-semibold">Staff only</h1>
        <p className="mb-0 mt-2 text-sm text-muted-foreground">You don’t have access to this page.</p>
        <Link href="/dashboard" className="mt-5 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground no-underline hover:opacity-90">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
