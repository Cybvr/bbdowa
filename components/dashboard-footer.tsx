"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ICON_SET } from "@/components/nav-icons";
import { useProfileImage } from "@/components/profile-nav";
import { useOptionalAuth } from "@/components/auth-provider";
import { createGlyphAvatarDataUri } from "@/lib/avatar";
import { NAV_ITEMS } from "@/lib/nav";

const FOOTER_LABELS = ["Home", "Jobs", "Tasks", "Tracker", "Njeri", "My profile"];
const FOOTER_LABEL_OVERRIDES: Record<string, string> = { "My profile": "Profile" };

export function DashboardFooter({ hidden = false }: { hidden?: boolean }) {
  const pathname = usePathname();
  const auth = useOptionalAuth();

  const profileImage = useProfileImage(auth?.user?.uid ?? null);

  if (hidden) return null;

  const isAdminSection = pathname.startsWith("/admin");
  const isStaff = auth?.role === "admin" || auth?.role === "manager";

  const items = isAdminSection
    ? [
        { label: "Overview", href: "/admin" },
        { label: "Jobs", href: "/admin/jobs" },
        ...(auth?.role === "admin" ? [{ label: "Users", href: "/admin/users" }] : []),
        { label: "Documents", href: "/admin/documents" },
        { label: "Tasks", href: "/admin/tasks" },
      ]
    : NAV_ITEMS.filter(
        (item): item is Extract<typeof item, { kind: "link" }> =>
          item.kind === "link" &&
          FOOTER_LABELS.includes(item.label) &&
          (!item.requiresAuth || Boolean(auth?.user)) &&
          (!item.requiresStaff || isStaff),
      ).sort((a, b) => FOOTER_LABELS.indexOf(a.label) - FOOTER_LABELS.indexOf(b.label));

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
        const avatarName = auth?.user?.name ?? auth?.user?.email?.split("@")[0] ?? "BBDO User";
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium no-underline transition-colors ${
              current ? "text-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            {item.label === "My profile" ? (
              <span className="h-6 w-6 overflow-hidden rounded-full bg-primary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profileImage || createGlyphAvatarDataUri(avatarName)} alt="" className="h-full w-full object-cover" />
              </span>
            ) : Icon ? <Icon className="h-6 w-6" /> : null}
            <span className="truncate">{FOOTER_LABEL_OVERRIDES[item.label] ?? item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
