"use client";

import type { ReactNode } from "react";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const THREE_COLUMN_WIDTHS = ["w-[28%]", "w-[52%]", "w-[20%]"];
const FOUR_COLUMN_WIDTHS = ["w-[26%]", "w-[42%]", "w-[22%]", "w-[10%]"];
const CELL_STYLES = ["truncate font-semibold", "truncate", "whitespace-nowrap text-sm text-muted-foreground", "text-right"];

export type EmailWorkspaceTableRow = {
  id: string;
  label: string;
  primary: ReactNode;
  secondary: ReactNode;
  tertiary: ReactNode;
  action?: ReactNode;
  href?: string;
  onOpen?: () => void;
  selected?: boolean;
};

export function EmailWorkspaceTable({ label, columns, rows, emptyTitle, emptyDescription, toolbar, columnWidths }: {
  label: string;
  columns: [string, string, string] | [string, string, string, string];
  rows: EmailWorkspaceTableRow[];
  emptyTitle: string;
  emptyDescription?: string;
  toolbar?: ReactNode;
  columnWidths?: readonly string[];
}) {
  const widths = columnWidths ?? (columns.length === 4 ? FOUR_COLUMN_WIDTHS : THREE_COLUMN_WIDTHS);
  // Cells truncate, so the list never needs to scroll sideways.
  return <div className="hidden overflow-x-hidden lg:block [&>div]:overflow-x-hidden">
    {toolbar}
    <Table className="w-full table-fixed" aria-label={label}>
      <TableBody>
        {rows.length ? rows.map((row) => {
          const values = [row.primary, row.secondary, row.tertiary, row.action];
          const cells = columns.map((column, index) => <TableCell key={column} className={cn("py-1.5", CELL_STYLES[index], widths[index])}>{values[index]}</TableCell>);
          return row.href || row.onOpen
            ? <ClickableTableRow key={row.id} label={row.label} href={row.href} onActivate={row.onOpen} className={row.selected ? "bg-muted/30" : undefined}>{cells}</ClickableTableRow>
            : <TableRow key={row.id} className={row.selected ? "bg-muted/30" : undefined}>{cells}</TableRow>;
        }) : <TableRow><TableCell colSpan={columns.length} className="py-16 text-center">
          <p className="m-0 font-semibold">{emptyTitle}</p>
          {emptyDescription ? <p className="m-0 mt-2 text-sm text-muted-foreground">{emptyDescription}</p> : null}
        </TableCell></TableRow>}
      </TableBody>
    </Table>
  </div>;
}
