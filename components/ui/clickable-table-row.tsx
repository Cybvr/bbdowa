"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const INTERACTIVE = "a, button, input, select, textarea, [role='button'], [role='link']";

export function ClickableTableRow({ href, external = false, onActivate, label, className, children }: {
  href?: string;
  external?: boolean;
  onActivate?: () => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const active = Boolean(onActivate || href);
  const activate = () => {
    if (onActivate) onActivate();
    else if (href && external) window.open(href, "_blank", "noopener,noreferrer");
    else if (href) router.push(href);
  };

  return (
    <TableRow
      tabIndex={active ? 0 : undefined}
      aria-label={label}
      className={cn(active && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50", className)}
      onClick={(event) => {
        if (!active) return;
        if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
        activate();
      }}
      onKeyDown={(event) => {
        if (!active) return;
        if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        activate();
      }}
    >
      {children}
    </TableRow>
  );
}
