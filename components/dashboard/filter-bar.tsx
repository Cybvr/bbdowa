"use client";

/**
 * Shared filter bar for dashboard list pages. Desktop keeps the controls
 * visible, while mobile keeps search on one row and moves the refinements into
 * a sheet. Each page still owns its own controlled state.
 */

import { useState } from "react";
import { Filter, Grid2X2, List } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  "h-9 rounded-lg border-border bg-background px-3 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

function SelectControl({
  label,
  value,
  onChange,
  options,
  className = "min-w-28",
  fullWidth = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={`${FIELD} ${className} ${fullWidth ? "!w-full" : "!w-auto"}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function SheetSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      <SelectControl
        label={label}
        value={value}
        onChange={onChange}
        options={options}
        className="w-full"
        fullWidth
      />
    </label>
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
  searchClassName = "min-w-0 flex-1 sm:max-w-[280px]",
  filters,
  sortOptions,
  activeSort,
  onSortChange,
  resultCount,
  view,
  onViewChange,
  className = "my-6",
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
  className?: string;
}) {
  const hasStatus = Boolean(tabs && tabs.length > 0 && onTabChange);
  const hasSort = Boolean(sortOptions && sortOptions.length > 0 && onSortChange);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const activeFilterCount =
    (hasStatus && activeTab !== tabs?.[0]?.key ? 1 : 0) +
    (filters?.filter((filter) => filter.value !== filter.options[0]?.value).length ?? 0) +
    (hasSort && activeSort !== sortOptions?.[0]?.key ? 1 : 0);
  const statusOptions = tabs?.map((tab) => ({ value: tab.key, label: tab.label })) ?? [];

  const clearFilters = () => {
    if (hasStatus && tabs?.[0] && onTabChange) onTabChange(tabs[0].key);
    filters?.forEach((filter) => {
      const firstOption = filter.options[0];
      if (firstOption) filter.onChange(firstOption.value);
    });
    if (hasSort && sortOptions?.[0] && onSortChange) onSortChange(sortOptions[0].key);
  };

  return (
    <div data-filter-panel={panelId} className={`${className} flex flex-wrap items-center gap-2 sm:gap-3`}>
      <div className="flex w-full items-center gap-2 sm:contents">
        {onSearchChange ? (
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className={`${FIELD} ${searchClassName} w-full max-w-full flex-1 placeholder:text-muted-foreground sm:w-auto`}
          />
        ) : null}
        {hasStatus || filters?.length || hasSort ? (
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[13px] font-semibold text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:hidden"
              >
                <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] text-background">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-0">
              <SheetHeader className="border-b border-border pr-12">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-4">
                {hasStatus ? (
                  <SheetSelect
                    label={tabsLabel}
                    value={String(activeTab)}
                    onChange={(value) => onTabChange!(value as TabKey)}
                    options={statusOptions}
                  />
                ) : null}
                {filters?.map((filter) => (
                  <SheetSelect
                    key={filter.label}
                    label={filter.label}
                    value={filter.value}
                    onChange={filter.onChange}
                    options={filter.options}
                  />
                ))}
                {hasSort ? (
                  <SheetSelect
                    label="Sort by"
                    value={String(activeSort)}
                    onChange={(value) => onSortChange!(value as SortKey)}
                    options={sortOptions!.map((option) => ({ value: option.key, label: option.label }))}
                  />
                ) : null}
              </div>
              <SheetFooter className="border-t border-border sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0}
                  className="h-9 rounded-lg px-3 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Clear filters
                </button>
                <SheetClose asChild>
                  <button type="button" className="h-9 rounded-lg bg-foreground px-4 text-[13px] font-semibold text-background transition hover:opacity-90">
                    Done
                  </button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ) : null}
      </div>

      <div className="hidden ml-auto flex-wrap items-center justify-end gap-2 sm:flex sm:gap-3">
        {hasStatus ? (
          <SelectControl
            label={tabsLabel}
            value={String(activeTab)}
            onChange={(value) => onTabChange!(value as TabKey)}
            options={statusOptions}
          />
        ) : null}
        {filters?.map((filter) => (
          <SelectControl
            key={filter.label}
            label={filter.label}
            value={filter.value}
            onChange={filter.onChange}
            options={filter.options}
          />
        ))}
        {hasSort ? (
          <SelectControl
            label="Sort by"
            value={String(activeSort)}
            onChange={(value) => onSortChange!(value as SortKey)}
            options={sortOptions!.map((option) => ({ value: option.key, label: option.label }))}
            className="min-w-32"
          />
        ) : null}
        {view && onViewChange ? <ViewToggle view={view} onChange={onViewChange} /> : null}
        {resultCount ? (
          <p aria-live="polite" className="m-0 whitespace-nowrap text-[13px] font-medium text-muted-foreground">
            {resultCount}
          </p>
        ) : null}

      </div>
      <div className="flex w-full items-center justify-end gap-2 sm:hidden">
        {view && onViewChange ? <ViewToggle view={view} onChange={onViewChange} /> : null}
        {resultCount ? (
          <p aria-live="polite" className="m-0 whitespace-nowrap text-[13px] font-medium text-muted-foreground">
            {resultCount}
          </p>
        ) : null}
      </div>
    </div>
  );
}
