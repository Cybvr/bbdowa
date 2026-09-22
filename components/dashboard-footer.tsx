"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ICON_SET } from "@/components/nav-icons";
import { useOptionalAuth } from "@/components/auth-provider";
import { NAV_ITEMS, resolveNavItemsForRole } from "@/lib/nav";

const FOOTER_LABELS = ["Home", "Campaigns", "Njeri", "Creators", "Tracker"];

export function DashboardFooter({ hidden = false }: { hidden?: boolean }) {
  const pathname = usePathname();
  const auth = useOptionalAuth();

  if (hidden) return null;

  const isAdminSection = pathname.startsWith("/admin");

  const items = isAdminSection
    ? [
        { label: "Overview", href: "/admin" },
        { label: "Users", href: "/admin/users" },
        { label: "Contracts", href: "/admin/contracts" },
        { label: "Documents", href: "/admin/contract-templates" },
        { label: "Home", href: "/dashboard" },
      ]
    : resolveNavItemsForRole(NAV_ITEMS, Boolean(auth?.user)).filter(
        (item): item is Extract<typeof item, { kind: "link" }> =>
          item.kind === "link" &&
          (FOOTER_LABELS.includes(item.label) || item.label === "My profile") &&
          (!item.requiresAuth || Boolean(auth?.user)),
      );

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur nav:hidden"
    >
      {items.map((item) => {
        const current =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        const Icon = NAV_ICON_SET[item.label];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium no-underline transition-colors ${
              current ? "text-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            {Icon ? <Icon className="h-5 w-5" /> : null}
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
