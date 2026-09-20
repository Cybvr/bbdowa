"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/dashboard/ui";

/**
 * Shared banner + breadcrumb + horizontal tabs shell, matching the client
 * workspace's hero pattern, for other detail pages (campaigns, creators) to
 * mirror the same layout.
 */

export type DetailCrumb = { label: string; href?: string };

export function DetailBreadcrumb({ crumbs, actions }: { crumbs: DetailCrumb[]; actions?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-4 px-1">
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
