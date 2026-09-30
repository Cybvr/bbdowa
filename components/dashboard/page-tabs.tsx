import Link from "next/link";

export type PageTab = { key: string; label: string };

/** Link tabs for a page whose sections are chosen with `?tab=`. The first tab is the default. */
export function PageTabs({ basePath, tabs, active, label }: { basePath: string; tabs: readonly PageTab[]; active: string; label: string }) {
  return (
    <nav className="mb-6 mt-4 flex items-center gap-5 border-b border-border" aria-label={label}>
      {tabs.map((entry, index) => (
        <Link
          key={entry.key}
          href={index === 0 ? basePath : `${basePath}?tab=${entry.key}`}
          aria-current={active === entry.key ? "page" : undefined}
          className={`-mb-px border-b-2 px-0.5 pb-2 text-[13px] font-semibold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
            active === entry.key
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
          }`}
        >
          {entry.label}
        </Link>
      ))}
    </nav>
  );
}

export function resolveTab<T extends readonly PageTab[]>(tabs: T, requested: string | undefined): T[number]["key"] {
  return tabs.some((entry) => entry.key === requested) ? (requested as T[number]["key"]) : tabs[0].key;
}
