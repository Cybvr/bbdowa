import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Admin" description="Data tools for the dashboard." />
      <Link href="/admin/users" className="mt-6 flex items-center justify-between rounded-xl border border-border bg-background p-4 text-foreground no-underline transition hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        <span>
          <strong className="block text-[14px] font-semibold">Users</strong>
          <span className="mt-1 block text-[13px] text-muted-foreground">Add users and manage team, creator, and admin roles.</span>
        </span>
        <span aria-hidden="true" className="text-lg text-muted-foreground">→</span>
      </Link>
      <Link href="/admin/contracts" className="mt-3 flex items-center justify-between rounded-xl border border-border bg-background p-4 text-foreground no-underline transition hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        <span>
          <strong className="block text-[14px] font-semibold">Contracts</strong>
          <span className="mt-1 block text-[13px] text-muted-foreground">Create, review, update, and remove creator agreements.</span>
        </span>
        <span aria-hidden="true" className="text-lg text-muted-foreground">→</span>
      </Link>
      <Link href="/admin/contract-templates" className="mt-3 flex items-center justify-between rounded-xl border border-border bg-background p-4 text-foreground no-underline transition hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        <span>
          <strong className="block text-[14px] font-semibold">Agreement templates</strong>
          <span className="mt-1 block text-[13px] text-muted-foreground">Reusable NDA and agreement text staff can pick from when sending a contract.</span>
        </span>
        <span aria-hidden="true" className="text-lg text-muted-foreground">→</span>
      </Link>
    </main>
  );
}
