"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { EmptyState, ImageWithFallback } from "@/components/dashboard/ui";
import { DashboardSidebarSheet } from "@/components/dashboard-sidebar";

/**
 * Shared banner + breadcrumb + horizontal tabs shell, matching the client
 * workspace's hero pattern, for other detail pages (campaigns, creators) to
 * mirror the same layout.
 */

export type DetailCrumb = { label: string; href?: string };

export function DetailBreadcrumb({ crumbs, actions }: { crumbs: DetailCrumb[]; actions?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-4 px-1">
      <div className="flex min-w-0 items-center gap-1.5">
        {/* The dashboard's own mobile header is hidden on these detail pages
         * (see DashboardChrome), so this is the only way back into the nav
         * drawer below the "nav" breakpoint. */}
        <div className="shrink-0 nav:hidden">
          <DashboardSidebarSheet />
        </div>
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0 text-xs text-muted-foreground sm:text-sm">
            {crumbs.map((crumb, index) => (
              <li key={crumb.label} className="flex items-center gap-2">
                {index > 0 ? <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" /> : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="transition hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-foreground">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function DetailHeroBanner({
  image,
  alt,
  badgeImage,
  badgeAlt,
  badgeHref,
  cornerAction,
}: {
  image: string | null | undefined;
  alt: string;
  badgeImage?: string | null;
  badgeAlt?: string;
  badgeHref?: string;
  cornerAction?: ReactNode;
}) {
  const badge = badgeImage ? (
    <ImageWithFallback
      src={badgeImage}
      alt={badgeAlt ?? ""}
      className="h-full w-full object-contain"
      fallbackClassName="h-full w-full rounded-xl"
      fallbackSeed={badgeAlt}
    />
  ) : null;
  const badgeClassName = "absolute bottom-0 left-4 flex h-12 w-20 items-center justify-center rounded-t-xl bg-card p-2 sm:left-6 sm:h-16 sm:w-24 sm:p-3";

  return (
    <div className="relative h-[140px] overflow-hidden rounded-2xl bg-muted sm:h-[180px]">
      <ImageWithFallback src={image} alt={alt} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/5 to-black/20" aria-hidden="true" />
      {badge ? (
        badgeHref ? (
          <Link href={badgeHref} aria-label={badgeAlt} className={badgeClassName}>
            {badge}
          </Link>
        ) : (
          <span className={badgeClassName}>{badge}</span>
        )
      ) : null}
      {cornerAction ? <div className="absolute bottom-4 right-4 flex items-center gap-1.5 sm:bottom-10 sm:right-6">{cornerAction}</div> : null}
    </div>
  );
}

/**
 * BambooHR-style profile shell: a colored banner holding the avatar, name
 * and tabs fused to its bottom edge (the active tab pokes up as a white
 * card), a fixed-fact sidebar, and card sections with a single-row table
 * of current values. Built for the creator profile; nothing else uses it
 * yet, so feel free to reshape it alongside that page.
 */

export function ProfileBanner<T extends string>({
  avatarSrc,
  avatarAlt,
  name,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
}: {
  avatarSrc: string | null | undefined;
  avatarAlt: string;
  name: string;
  subtitle?: ReactNode;
  tabs: { id: T; label: string }[];
  activeTab: T;
  onTabChange: (id: T) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card text-foreground">
      <div className="flex flex-wrap items-center gap-3 p-3.5 sm:gap-5 sm:p-7">
        <span className="grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-full bg-background sm:h-24 sm:w-24">
          <ImageWithFallback
            src={avatarSrc}
            alt={avatarAlt}
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
            fallbackSeed={avatarAlt}
          />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="m-0 truncate text-[17px] font-bold leading-tight sm:text-[26px]">{name}</h1>
          {subtitle ? <div className="mt-1 text-[12px] font-medium text-muted-foreground sm:mt-1.5 sm:text-[14px]">{subtitle}</div> : null}
        </div>
      </div>
      <div role="tablist" className="no-scrollbar flex touch-pan-x gap-1 overflow-x-auto overscroll-x-contain px-2 sm:px-5">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              type="button"
              role="tab"
              key={tab.id}
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-[12.5px] font-semibold transition focus-visible:outline-none sm:px-4 sm:py-2.5 sm:text-[13px] ${
                isActive ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProfileLayout({
  sidebar,
  children,
  showSidebarOnMobile = true,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  /** On mobile the sidebar stacks above the tab content, so it's only worth
   * showing there for the tab it actually belongs to (Overview); other tabs
   * hide it on mobile and get it back once there's room beside them (lg+). */
  showSidebarOnMobile?: boolean;
}) {
  return (
    <div className="mt-4 flex flex-col gap-4 sm:mt-6 sm:gap-6 lg:flex-row lg:items-start">
      <aside className={`space-y-3 sm:space-y-4 lg:w-[240px] lg:flex-none lg:block ${showSidebarOnMobile ? "" : "hidden"}`}>
        {sidebar}
      </aside>
      <div className="min-w-0 flex-1 space-y-4 sm:space-y-5">{children}</div>
    </div>
  );
}

export function ProfileIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-foreground hover:text-foreground"
    >
      {children}
    </a>
  );
}

export function ProfileFacts({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-border px-3.5 py-1 sm:px-4">{children}</div>;
}

/** One compact row: field on the left, value on the right. No icon — kept
 * deliberately slim so the sidebar doesn't crowd out the tab content below
 * it on mobile, where the sidebar stacks above the content. */
export function ProfileFact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 text-[13px]">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function ProfileSection({
  icon,
  title,
  action,
  children,
  variant = "boxed",
}: {
  icon?: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  /** "plain" drops the icon badge and the bordered card, for pages that want a quieter section heading. */
  variant?: "boxed" | "plain";
}) {
  if (variant === "plain") {
    return (
      <section>
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h3 className="m-0 text-[12px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{title}</h3>
          {action}
        </div>
        {children}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-3.5 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">{icon}</span>
          <h3 className="m-0 text-[12px] font-bold uppercase tracking-[0.06em]">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-3.5 sm:p-5">{children}</div>
    </section>
  );
}

export type ProfileColumn = { key: string; label: string };

/** Bamboo's "current status" table: one column per field, one row of values. */
export function ProfileTable({
  columns,
  rows,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Nothing on file yet.",
}: {
  columns: ProfileColumn[];
  rows: Record<string, ReactNode>[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {columns.map((column) => (
              <th key={column.key} className="border-b border-border px-3 py-2 first:pl-0">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border last:border-b-0">
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-3 align-top first:pl-0">
                  {row[column.key] ?? <span className="text-muted-foreground">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetailTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="no-scrollbar mt-2 flex touch-pan-x items-center gap-1 overflow-x-auto overscroll-x-contain border-b border-border/70 px-0.5">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            type="button"
            role="tab"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-selected={isActive}
            className={`relative flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 text-[13px] font-semibold tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              isActive
                ? "text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
