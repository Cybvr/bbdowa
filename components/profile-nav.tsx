"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { LuChevronRight } from "react-icons/lu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOptionalAuth } from "@/components/auth-provider";
import { createGlyphAvatarDataUri } from "@/lib/avatar";
import { firebaseDb } from "@/lib/firebase/client";

export type ProfileNavItem = {
  label: string;
  icon?: ReactNode;
  href?: string;
  onSelect?: () => void;
};

export type ProfileNavProps = {
  initials?: string;
  name?: string;
  email?: string;
  items?: readonly ProfileNavItem[];
  logoutLabel?: string;
  onLogout?: () => void;
  variant?: "avatar" | "row";
  tone?: "primary" | "background";
  showHandleOnly?: boolean;
  showRole?: boolean;
  showChevron?: boolean;
  showAdminForStaff?: boolean;
  menuAlign?: "start" | "center" | "end";
  menuSide?: "top" | "right" | "bottom" | "left";
};

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M10 10a3.25 3.25 0 1 0 0-6.5A3.25 3.25 0 0 0 10 10Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.75 17.25c.62-2.72 2.7-4.25 6.25-4.25s5.63 1.53 6.25 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m8.55 2.6.33-.35a1.5 1.5 0 0 1 2.24 0l.33.35c.26.28.64.4 1.02.33l.47-.1a1.5 1.5 0 0 1 1.75 1.4l.03.48c.02.38.24.72.58.9l.42.22a1.5 1.5 0 0 1 .5 2.2l-.3.38c-.23.3-.28.7-.14 1.05l.18.45a1.5 1.5 0 0 1-1.2 2.03l-.48.08a1.1 1.1 0 0 0-.83.65l-.18.45a1.5 1.5 0 0 1-2.2.63l-.4-.27a1.1 1.1 0 0 0-1.07 0l-.4.27a1.5 1.5 0 0 1-2.2-.63l-.18-.45a1.1 1.1 0 0 0-.83-.65l-.48-.08a1.5 1.5 0 0 1-1.2-2.03l.18-.45c.14-.35.09-.75-.14-1.05l-.3-.38a1.5 1.5 0 0 1 .5-2.2l.42-.22c.34-.18.56-.52.58-.9l.03-.48a1.5 1.5 0 0 1 1.75-1.4l.47.1c.38.07.76-.05 1.02-.33Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M10 2.5 4 4.75v4.1c0 3.4 2.4 6.15 6 7.65 3.6-1.5 6-4.25 6-7.65v-4.1L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m7.5 10 1.75 1.75L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M8.25 3.25H5.5A1.75 1.75 0 0 0 3.75 5v10A1.75 1.75 0 0 0 5.5 16.75h2.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 6.5 14.5 10 11 13.5M14.25 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DEFAULT_ITEMS: readonly ProfileNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <UserIcon /> },
  { label: "Settings", href: "/dashboard/settings", icon: <SettingsIcon /> },
];

export function ProfileNav({
  initials,
  name,
  email,
  items = DEFAULT_ITEMS,
  logoutLabel = "Log out",
  onLogout,
  variant = "avatar",
  tone = "primary",
  showHandleOnly = false,
  showRole = false,
  showChevron = false,
  showAdminForStaff = false,
  menuAlign = "end",
  menuSide = "bottom",
}: ProfileNavProps) {
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const loading = auth?.loading ?? false;
  const logout = auth?.logout;
  const role = auth?.role ?? null;
  const profileImage = useProfileImage(user?.uid ?? null);
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : null;
  const isAdmin = auth?.isAdmin ?? false;
  const menuItems: readonly ProfileNavItem[] = [
    ...(auth?.isViewingAs ? [{ label: "Exit view as", onSelect: auth.stopViewingAs }] : []),
    ...(isAdmin || (showAdminForStaff && role === "manager") ? [{ label: "Admin", href: "/admin", icon: <AdminIcon /> }] : []),
    ...items,
  ];
  const displayName = name ?? user?.name ?? user?.email?.split("@")[0] ?? "BBDO User";
  const displayEmail = email ?? user?.email ?? (loading ? "Loading profile..." : "Signed in");
  const handle = (email ?? user?.email)?.split("@")[0]?.toLowerCase() ?? null;
  const avatarSrc = profileImage || createGlyphAvatarDataUri(displayName || displayEmail || initials || "BBDO User");
  const handleLogout = onLogout ?? (logout ? () => void logout() : undefined);

  if (!auth || !user) {
    return (
      <Link
        href="/auth/login"
        className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary-foreground px-4 text-xs font-bold text-primary no-underline transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
      >
        Sign in
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "row" ? (
          <button
            type="button"
            aria-label="Open profile menu"
            className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left transition-colors hover:bg-foreground/10 focus-visible:bg-foreground/10 focus-visible:outline-none"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              {showHandleOnly ? (
                <span className="block truncate text-sm font-normal leading-tight text-foreground">{handle ? `@${handle}` : displayName}</span>
              ) : showRole ? (
                <>
                  <span className="block truncate text-sm font-normal leading-tight text-foreground">{displayName}</span>
                  <span className="mt-0.5 block truncate text-xs font-normal leading-tight text-muted-foreground">{roleLabel ?? "Member"}</span>
                </>
              ) : (
                <>
                  <span className="block truncate text-sm font-bold leading-tight text-foreground">{displayName}</span>
                  {handle ? (
                    <span className="mt-0.5 block truncate text-xs leading-tight text-muted-foreground">@{handle}</span>
                  ) : roleLabel ? (
                    <span className="mt-0.5 block truncate text-xs leading-tight text-muted-foreground">{roleLabel}</span>
                  ) : null}
                </>
              )}
            </span>
            {showChevron ? <LuChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Open profile menu"
            className={`inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 ${tone === "background" ? "bg-primary focus-visible:outline-primary" : "bg-primary-foreground focus-visible:outline-primary-foreground"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarSrc} alt={`${displayName} avatar`} className="h-full w-full object-cover" />
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={menuAlign} side={menuSide} className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-extrabold">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{displayEmail}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems.map((item) => (
          <DropdownMenuItem key={item.label} asChild={Boolean(item.href)} onSelect={item.onSelect}>
            {item.href ? (
              <Link href={item.href}>
                {item.icon}
                {item.label}
              </Link>
            ) : (
              <>
                {item.icon}
                <span>{item.label}</span>
              </>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOutIcon />
          {logoutLabel}
        </DropdownMenuItem>
        <p className="m-0 border-t border-border/60 px-2 pt-2 text-center font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/35">
          Powered by VCNS
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The signed-in person's uploaded avatar, kept live so a change in Settings shows straight away. */
function useProfileImage(uid: string | null): string | null {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setImage(null);
      return;
    }
    return onSnapshot(
      doc(firebaseDb, "users", uid),
      (snapshot) => {
        const data = snapshot.data();
        setImage(data?.profileImage || data?.picture || null);
      },
      () => setImage(null),
    );
  }, [uid]);

  return image;
}
