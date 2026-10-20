import type { ReactNode } from "react";
import { PageHeader } from "@/components/dashboard/ui";
import type { CreateType } from "@/components/quick-create";

/** Shared shell for dashboard list surfaces. Pages own their data and controls; the shell owns the frame. */
export function DashboardListPage({
  title,
  actions,
  createType,
  toolbar,
  showHeader = true,
  children,
}: {
  title: string;
  actions?: ReactNode;
  createType?: CreateType;
  toolbar?: ReactNode;
  showHeader?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-2 sm:px-8">
      {showHeader ? <PageHeader title={title} actions={actions} createType={createType} /> : null}
      {toolbar}
      {children}
    </main>
  );
}
