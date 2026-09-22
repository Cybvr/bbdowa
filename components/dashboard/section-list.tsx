import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared home-dashboard rail/list piece. One scannable list at every
 * screen size — no side-scrolling carousel, no rail-nav buttons. A
 * `lead` section renders larger to read as the page's primary content;
 * other sections stay compact so only one thing dominates the screen.
 */

export function DashboardSection({
  id,
  title,
  href,
  hrefLabel = "View all",
  children,
}: {
  id: string;
  title: string;
  href: string;
  hrefLabel?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <div className="flex items-center justify-between gap-4">
        <h2 id={id} className="m-0 text-eyebrow font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </h2>
        <Link
          href={href}
          className="text-[12px] font-semibold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground focus-visible:text-foreground"
        >
          {hrefLabel}
        </Link>
      </div>
      <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
        {children}
      </div>
    </section>
  );
}

export function DashboardListRow({
  href,
  thumbnail,
  badge,
  eyebrow,
  title,
  meta,
  lead = false,
  actions,
}: {
  href: string;
  thumbnail?: ReactNode;
  badge?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  lead?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className="group relative flex items-center gap-4 bg-background transition hover:bg-muted/40">
      <Link
        href={href}
        className={`flex min-w-0 flex-1 items-center gap-4 text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 ${lead ? "p-4" : "p-3.5"}`}
      >
        {thumbnail ? (
          <div
            className={`relative shrink-0 overflow-hidden rounded-lg bg-muted ${lead ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12"}`}
          >
            {thumbnail}
            {badge ? <span className="absolute right-1 top-1">{badge}</span> : null}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <span className="block truncate text-eyebrow font-semibold uppercase tracking-[0.08em] text-primary">
              {eyebrow}
            </span>
          ) : null}
          <strong
            className={`block truncate font-semibold leading-snug ${lead ? "text-item-title" : "text-body font-medium"}`}
          >
            {title}
          </strong>
          {meta ? <div className="mt-1 truncate text-[13px] text-muted-foreground">{meta}</div> : null}
        </div>
      </Link>
      {actions ? <div className={`shrink-0 ${lead ? "pr-4" : "pr-3.5"}`}>{actions}</div> : null}
    </div>
  );
}
