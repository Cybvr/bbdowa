"use client";

/**
 * Shared filter bar for dashboard list pages: status tabs, search and
 * sort-by, plus a live result count. Purely presentational and controlled —
 * each table owns its own filter/sort/search state and passes it down.
 */

export type FilterTab<TabKey extends string> = {
  key: TabKey;
  label: string;
};

export type SortOption<SortKey extends string> = {
  key: SortKey;
  label: string;
};

const FIELD =
  "h-9 appearance-none rounded-lg border border-border bg-background px-3 text-[13px] text-foreground focus-visible:outline-none";

export function FilterBar<TabKey extends string, SortKey extends string>({
  panelId,
  tabs,
  activeTab,
  onTabChange,
  tabsLabel = "Filter",
  search,
  onSearchChange,
  searchPlaceholder = "Search",
  sortOptions,
  activeSort,
  onSortChange,
  resultCount,
}: {
  panelId: string;
  tabs?: FilterTab<TabKey>[];
  activeTab?: TabKey;
  onTabChange?: (key: TabKey) => void;
  tabsLabel?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  sortOptions?: SortOption<SortKey>[];
  activeSort?: SortKey;
  onSortChange?: (key: SortKey) => void;
  resultCount?: string;
}) {
  const move = (index: number) => {
    if (!tabs || !onTabChange) return;
    const next = tabs[(index + tabs.length) % tabs.length];
    onTabChange(next.key);
    document.getElementById(`${panelId}-tab-${next.key}`)?.focus();
  };

  return (
    <div className="my-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {tabs && tabs.length > 0 && onTabChange ? (
          <div
            className="flex h-9 items-center gap-1 rounded-lg border border-border p-1"
            role="tablist"
            aria-label={tabsLabel}
          >
            {tabs.map((tab, index) => {
              const selected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  id={`${panelId}-tab-${tab.key}`}
                  aria-controls={panelId}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onTabChange(tab.key)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight") {
                      event.preventDefault();
                      move(index + 1);
                    }
                    if (event.key === "ArrowLeft") {
                      event.preventDefault();
                      move(index - 1);
                    }
                    if (event.key === "Home") {
                      event.preventDefault();
                      move(0);
                    }
                    if (event.key === "End") {
                      event.preventDefault();
                      move(tabs.length - 1);
                    }
                  }}
                  className={`flex h-full cursor-pointer items-center rounded-md border-0 px-3 text-[13px] font-medium focus-visible:outline-none ${
                    selected
                      ? "bg-foreground text-background"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {onSearchChange ? (
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className={`${FIELD} w-[220px] max-w-full placeholder:text-muted-foreground`}
          />
        ) : null}

        {sortOptions && sortOptions.length > 0 && onSortChange ? (
          <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
            Sort by
            <select
              value={activeSort}
              onChange={(event) => onSortChange(event.target.value as SortKey)}
              aria-label="Sort by"
              className={`${FIELD} cursor-pointer pr-2`}
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {resultCount ? (
        <p aria-live="polite" className="m-0 text-[13px] font-medium text-muted-foreground">
          {resultCount}
        </p>
      ) : null}
    </div>
  );
}
