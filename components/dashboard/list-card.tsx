"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { ImageWithFallback } from "@/components/empty-thumbnail";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Card grid used by every dashboard list in its cards view. */
export function CardGrid({ children }: { children: ReactNode }) {
  return <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</ul>;
}

export const CARD_MENU_TRIGGER =
  "grid h-9 w-9 place-items-center rounded-lg bg-background/90 text-muted-foreground shadow-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-wait";

export type CardMenuItem = {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  href?: string;
  destructive?: boolean;
  disabled?: boolean;
};

/** The three-dot menu in a card's top right corner. */
export function CardMenu({ items, label = "Actions", triggerClassName = CARD_MENU_TRIGGER }: { items: CardMenuItem[]; label?: string; triggerClassName?: string }) {
  const router = useRouter();
  const shown = items.filter(Boolean);
  if (!shown.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={label} className={triggerClassName}>
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {shown.map((item) => (
          <DropdownMenuItem
            key={item.label}
            disabled={item.disabled}
            variant={item.destructive ? "destructive" : undefined}
            onSelect={() => (item.href ? router.push(item.href) : item.onSelect?.())}
          >
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The one card used by every admin list: our thumbnail on top (the BBDO
 * pattern when there is no image), a menu in the corner, then title and date.
 * The whole card opens `href` (or runs `onActivate`), except clicks on its
 * own buttons and links.
 */
export function ListCard({
  href,
  onActivate,
  image,
  title,
  subtitle,
  menu,
}: {
  href?: string;
  onActivate?: () => void;
  image?: string | null;
  title: ReactNode;
  /** Small line under the title, the date. */
  subtitle?: ReactNode;
  /** A <CardMenu> or other corner control. */
  menu?: ReactNode;
}) {
  const router = useRouter();
  const open = () => (onActivate ? onActivate() : href ? router.push(href) : undefined);
  return (
    <li
      onClick={(event) => { if (!(event.target as HTMLElement).closest("button, a, [role=menu], [role=dialog]")) open(); }}
      className="relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-background transition hover:border-foreground/30"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
        <ImageWithFallback src={image} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
      </div>
      {menu ? <div className="absolute right-3 top-3 z-10" onClick={(event) => event.stopPropagation()}>{menu}</div> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <p className="m-0 truncate text-body font-semibold">
          {href ? <Link href={href} className="text-foreground no-underline hover:text-primary">{title}</Link> : title}
        </p>
        {subtitle ? <p className="m-0 truncate text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
    </li>
  );
}

/** Rows that replace a list's table below the large breakpoint: one column on phones, two on tablets. */
export function MobileRows({ children }: { children: ReactNode }) {
  return <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 lg:hidden">{children}</ul>;
}

/** Wraps a table so it only shows from the large breakpoint up. */
export function DesktopTable({ children }: { children: ReactNode }) {
  return <div className="hidden overflow-x-auto lg:block">{children}</div>;
}

export const ROW_ICON_ACTION =
  "grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

/**
 * One row in a list's table view on phones: thumbnail, title, a chip and a
 * muted detail line, then the status and actions underneath.
 */
export function MobileRow({
  href,
  onActivate,
  image,
  title,
  chip,
  chipIcon,
  detail,
  status,
  actions,
  menu,
}: {
  href?: string;
  onActivate?: () => void;
  image?: string | null;
  title: ReactNode;
  chip?: ReactNode;
  chipIcon?: ReactNode;
  /** Muted text after the chip, e.g. "₦120,000 · 12 Oct 2026". */
  detail?: ReactNode;
  status?: ReactNode;
  /** Icon buttons shown before the menu, e.g. view. */
  actions?: ReactNode;
  menu?: ReactNode;
}) {
  const router = useRouter();
  const open = () => (onActivate ? onActivate() : href ? router.push(href) : undefined);
  return (
    <li
      onClick={(event) => { if (!(event.target as HTMLElement).closest("button, a, [role=menu], [role=dialog]")) open(); }}
      className="min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-border bg-background p-4 transition hover:border-foreground/30"
    >
      <div className="flex min-w-0 gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
          <ImageWithFallback src={image} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-body font-semibold">
            {href ? <Link href={href} className="text-foreground no-underline hover:text-primary">{title}</Link> : title}
          </p>
          {chip || detail ? (
            <div className="mt-1.5 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              {chip ? <span className="inline-flex min-w-0 max-w-[60%] shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-foreground">{chipIcon}<span className="truncate">{chip}</span></span> : null}
              {detail ? <span className="truncate">{detail}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
      {status || actions || menu ? (
        <div className="mt-3 flex min-w-0 items-center justify-between gap-2 pl-20" onClick={(event) => event.stopPropagation()}>
          <div className="min-w-0">{status}</div>
          <div className="flex shrink-0 items-center gap-1">{actions}{menu}</div>
        </div>
      ) : null}
    </li>
  );
}
