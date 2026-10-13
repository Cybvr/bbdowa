"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { TableCell } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type TableRowAction = {
  label: string;
  icon?: ReactNode;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

export const TABLE_PRIMARY_ACTION_CLASS =
  "grid h-9 w-9 place-items-center rounded-md text-foreground no-underline transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-wait disabled:opacity-50";

export const TABLE_ACTION_MENU_TRIGGER =
  "grid h-9 w-9 place-items-center rounded-md border-0 bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-wait disabled:opacity-50";

function PrimaryAction({ action }: { action: TableRowAction }) {
  const content = action.icon ?? <span className="sr-only">{action.label}</span>;
  if (action.href) {
    return <Link href={action.href} aria-label={action.label} className={TABLE_PRIMARY_ACTION_CLASS}>{content}</Link>;
  }
  return (
    <button type="button" aria-label={action.label} disabled={action.disabled} onClick={action.onSelect} className={TABLE_PRIMARY_ACTION_CLASS}>
      {content}
    </button>
  );
}

export function TableRowActions({
  primary,
  items = [],
  menu,
  label = "More actions",
}: {
  primary?: TableRowAction | TableRowAction[] | null;
  items?: TableRowAction[];
  menu?: ReactNode;
  label?: string;
}) {
  const router = useRouter();
  const primaryActions = (Array.isArray(primary) ? primary : primary ? [primary] : []).slice(0, 2);
  const menuItems = items.filter(Boolean);
  if (!primaryActions.length && !menuItems.length && !menu) return null;

  return (
    <div className="inline-flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      {primaryActions.map((action) => <PrimaryAction key={action.label} action={action} />)}
      {menu ?? (menuItems.length ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={label} className={TABLE_ACTION_MENU_TRIGGER}>
              <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {menuItems.map((item) => (
              <DropdownMenuItem
                key={item.label}
                className="text-xs"
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
      ) : null)}
    </div>
  );
}

export function TableActionsCell({
  primary,
  items,
  menu,
  label,
}: {
  primary?: TableRowAction | TableRowAction[] | null;
  items?: TableRowAction[];
  menu?: ReactNode;
  label?: string;
}) {
  return (
    <TableCell
      className="w-[1%] whitespace-nowrap text-right"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <TableRowActions primary={primary} items={items} menu={menu} label={label} />
    </TableCell>
  );
}
