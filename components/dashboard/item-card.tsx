import Link from "next/link";
import type { ReactNode } from "react";

/** Vertical list of ItemCards with hairline dividers between them. */
export function ItemCardList({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-border">{children}</div>;
}

/**
 * One list row: a rounded icon tile, a title with an optional subtitle, and an
 * optional trailing slot (a status pill, an action). Renders as a link when
 * `href` is set, a button when `onClick` is set, otherwise a plain row.
 */
export function ItemCard({
  icon,
  title,
  subtitle,
  trailing,
  href,
  onClick,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      {icon ? (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">{icon}</span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-foreground">{title}</span>
        {subtitle ? <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{subtitle}</span> : null}
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </>
  );
  const base = "flex w-full items-center gap-3 py-3 text-left";

  if (href) {
    return <Link href={href} className={`${base} transition hover:opacity-80`}>{body}</Link>;
  }
  if (onClick) {
    return <button type="button" onClick={onClick} className={`${base} transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}>{body}</button>;
  }
  return <div className={base}>{body}</div>;
}
