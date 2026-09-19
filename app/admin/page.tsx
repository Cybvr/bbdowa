import type { Metadata } from "next";
import { SeedPanel } from "@/components/seed-panel";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-8 sm:px-8">
      <h1 className="m-0 text-[22px] font-bold tracking-tight">Admin</h1>
      <p className="mb-6 mt-1.5 text-[14px] text-muted-foreground">Data tools for the dashboard.</p>
      <SeedPanel />
    </main>
  );
}
