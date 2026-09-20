import type { ReactNode } from "react";

export function ClientWorkspaceHeading({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <h2 className="m-0 min-w-0 truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
        {title}
      </h2>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function ClientWorkspaceContent({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pb-4 pt-2 sm:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-4 pb-8">{children}</div>
    </div>
  );
}
