import Link from "next/link";
import type { ReactNode } from "react";
import { QuickCreate, type CreateType } from "@/components/quick-create";
import { MobilePageHeader } from "@/components/dashboard/mobile-header";

/**
 * Shared Operate-mode primitives for the dashboard.
 *
 * The dashboard is a tool, not a pitch: one sans, a fixed rem scale (no
 * clamp()), sentence case, restrained color (neutrals + red reserved for
 * primary actions, current state, and status only). Panels are quiet
 * rounded surfaces with a hairline border, not thick black rules or
 * full-bleed color blocks. No kicker labels above headings.
 */

export function PageHeader({
  title,
  description,
  meta,
  actions,
  createType,
}: {
  title: string;
  description?: string;
  meta?: string;
  actions?: ReactNode;
  createType?: CreateType;
}) {
  return (
    <MobilePageHeader
      title={title}
      action={createType ? <QuickCreate type={createType} iconOnly /> : null}
      hideAll={!description && !meta && !actions}
    >
    <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
      <div>
        <h1 data-mobile-header className="m-0 text-page-title font-bold leading-tight tracking-tight sm:text-page-title-lg">{title}</h1>
        {description ? (
          <p className="mb-0 mt-1.5 max-w-[60ch] text-body leading-[1.4] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {meta ? (
          <span className="text-[13px] font-medium text-muted-foreground">{meta}</span>
        ) : null}
        {actions}
        {createType ? <div data-mobile-header><QuickCreate type={createType} /></div> : null}
      </div>
    </div>
    </MobilePageHeader>
  );
}

export function SectionHeading({
  id,
  children,
  action,
}: {
  id?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2
        id={id}
        className="m-0 text-eyebrow font-semibold uppercase tracking-[0.08em] text-muted-foreground"
      >
        {children}
      </h2>
      {action}
    </div>
  );
}

export const PANEL = "rounded-xl border border-border bg-background p-5 sm:p-6";
export const PANEL_MUTED = "rounded-xl border border-border bg-muted/40 p-5 sm:p-6";

export function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`${PANEL} ${className}`}>{children}</div>;
}

const BADGE_TONE = {
  active: "bg-primary/10 text-primary",
  neutral: "bg-muted text-muted-foreground",
  inverse: "bg-foreground text-background",
} as const;

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof BADGE_TONE;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${BADGE_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export function MetaGrid({ children, columns = 3 }: { children: ReactNode; columns?: number }) {
  const cols = columns === 2 ? "sm:grid-cols-2" : columns === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border ${cols}`}>
      {children}
    </div>
  );
}

export function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[92px] flex-col justify-center gap-1.5 bg-background p-5">
      <span className="text-eyebrow font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <div className="text-item-title font-semibold leading-snug">{children}</div>
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
      {children}
    </div>
  );
}

export function StatItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 bg-background p-5">
      <span className="text-eyebrow font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <strong className="text-hero-stat font-bold leading-none tracking-tight tabular-nums">{value}</strong>
      {detail ? <div className="text-[14px] leading-snug text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <h3 className="m-0 text-[17px] font-semibold">{title}</h3>
      <p className="mx-auto mb-0 mt-2 max-w-[46ch] text-[15px] leading-[1.5] text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[13px] font-semibold text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary"
    >
      {children}
    </Link>
  );
}

export { EmptyThumbnail, ImageWithFallback } from "@/components/empty-thumbnail";
