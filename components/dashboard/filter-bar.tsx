"use client";

/**
 * Shared filter bar for dashboard list pages. Search stays inline because it is
 * the most-used control; status, category and sort live behind a right-aligned
 * filter button that opens a sheet. Purely presentational and controlled — each
 * table owns its own filter/sort/search state and passes it down.
 */

import type { ReactNode } from "react";
import { useState } from "react";
import { Check, Filter, Grid2X2, List } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type FilterTab<TabKey extends string> = {
  key: TabKey;
  label: string;
};

export type SortOption<SortKey extends string> = {
  key: SortKey;
  label: string;
};

export type ViewMode = "table" | "cards";

export type SelectFilter = {
  /** Accessible label for the group. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

const FIELD =
  "h-9 appearance-none rounded-lg border border-border bg-background px-3 text-[13px] text-foreground focus-visible:outline-none";

function OptionRow({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 text-left text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        selected
          ? "border-foreground bg-muted font-semibold text-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className="truncate">{children}</span>
      {selected ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
    </button>
  );
}

function OptionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="m-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
      <div role="radiogroup" aria-label={label} className="grid gap-1.5">
        {children}
      </div>
    </div>
  );
}

export function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (view: ViewMode) => void }) {
  return (
    <div className="flex items-center rounded-lg border border-border p-0.5" role="group" aria-label="View">
      <button
        type="button"
        aria-label="Table view"
        aria-pressed={view === "table"}
        onClick={() => onChange("table")}
        className={`grid h-8 w-8 cursor-pointer place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          view === "table" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <List className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Cards view"
        aria-pressed={view === "cards"}
        onClick={() => onChange("cards")}
        className={`grid h-8 w-8 cursor-pointer place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          view === "cards" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Grid2X2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function FilterBar<TabKey extends string, SortKey extends string>({
  panelId,
  tabs,
  activeTab,
  onTabChange,
  tabsLabel = "Status",
  search,
  onSearchChange,
  searchPlaceholder = "Search",
  searchClassName = "min-w-[140px] flex-1 sm:max-w-[280px]",
  filters,
  sortOptions,
  activeSort,
  onSortChange,
  resultCount,
  view,
  onViewChange,
}: {
  panelId: string;
  tabs?: FilterTab<TabKey>[];
  activeTab?: TabKey;
  onTabChange?: (key: TabKey) => void;
  tabsLabel?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchClassName?: string;
  filters?: SelectFilter[];
  sortOptions?: SortOption<SortKey>[];
  activeSort?: SortKey;
  onSortChange?: (key: SortKey) => void;
  resultCount?: string;
  view?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
}) {
  const [open, setOpen] = useState(false);

  const hasStatus = Boolean(tabs && tabs.length > 0 && onTabChange);
  const hasSort = Boolean(sortOptions && sortOptions.length > 0 && onSortChange);
  const hasFilters = hasStatus || hasSort || Boolean(filters && filters.length > 0);

  // The first entry of each group is its neutral default, so anything else is a
  // narrowing the user chose and worth surfacing on the trigger.
  const activeCount =
    (hasStatus && activeTab !== tabs![0].key ? 1 : 0) +
    (hasSort && activeSort !== sortOptions![0].key ? 1 : 0) +
    (filters ?? []).filter((filter) => filter.value !== filter.options[0]?.value).length;

  const reset = () => {
    if (hasStatus) onTabChange!(tabs![0].key);
    if (hasSort) onSortChange!(sortOptions![0].key);
    filters?.forEach((filter) => {
      if (filter.options[0]) filter.onChange(filter.options[0].value);
    });
  };

  return (
    <div className="my-6 flex flex-wrap items-center gap-3">
      {onSearchChange ? (
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className={`${FIELD} ${searchClassName} max-w-full placeholder:text-muted-foreground`}
        />
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        {view && onViewChange ? <ViewToggle view={view} onChange={onViewChange} /> : null}
        {resultCount ? (
          <p aria-live="polite" className="m-0 text-[13px] font-medium text-muted-foreground">
            {resultCount}
          </p>
        ) : null}

        {hasFilters ? (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-controls={panelId}
              aria-label={activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-[13px] font-medium text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Filters</span>
              {activeCount > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1 text-[11px] font-semibold text-background">
                  {activeCount}
                </span>
              ) : null}
            </SheetTrigger>

            <SheetContent
              side="right"
              aria-describedby={undefined}
              className="[&>button]:bg-muted [&>button]:text-foreground [&>button]:opacity-100"
            >
              <SheetHeader className="border-b border-border">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>

              <div className="flex-1 space-y-5 overflow-y-auto px-4">
                {hasStatus ? (
                  <OptionGroup label={tabsLabel}>
                    {tabs!.map((tab) => (
                      <OptionRow
                        key={tab.key}
                        selected={activeTab === tab.key}
                        onSelect={() => onTabChange!(tab.key)}
                      >
                        {tab.label}
                      </OptionRow>
                    ))}
                  </OptionGroup>
                ) : null}

                {filters?.map((filter) => (
                  <OptionGroup key={filter.label} label={filter.label}>
                    {filter.options.map((option) => (
                      <OptionRow
                        key={option.value}
                        selected={filter.value === option.value}
                        onSelect={() => filter.onChange(option.value)}
                      >
                        {option.label}
                      </OptionRow>
                    ))}
                  </OptionGroup>
                ))}

                {hasSort ? (
                  <OptionGroup label="Sort by">
                    {sortOptions!.map((option) => (
                      <OptionRow
                        key={option.key}
                        selected={activeSort === option.key}
                        onSelect={() => onSortChange!(option.key)}
                      >
                        {option.label}
                      </OptionRow>
                    ))}
                  </OptionGroup>
                ) : null}
              </div>

              <SheetFooter className="flex-row items-center gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={reset}
                  disabled={activeCount === 0}
                  className="h-10 flex-1 cursor-pointer rounded-lg border border-border bg-background text-[13px] font-medium text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Reset
                </button>
                <SheetClose className="h-10 flex-1 cursor-pointer rounded-lg bg-foreground text-[13px] font-semibold text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  {resultCount ? `Show ${resultCount}` : "Done"}
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
    </div>
  );
}
