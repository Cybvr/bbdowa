"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BlogCategory, BlogPost } from "@/lib/blog";
import { plural } from "@/lib/format";
import { EmptyState } from "@/components/dashboard/ui";
import { DashboardThumbnail } from "@/components/dashboard-thumbnail";
import { DashboardCard, DashboardCardActions } from "@/components/dashboard-card";
import { FilterBar, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";

const CATEGORIES: { value: BlogCategory | "all"; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "News", label: "News" },
  { value: "People", label: "People" },
  { value: "Work", label: "Work" },
  { value: "Industry", label: "Industry" },
];

const SORTS: SortOption<"recent" | "title">[] = [
  { key: "recent", label: "Most recent" },
  { key: "title", label: "Title (A–Z)" },
];

function dateValue(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  const timestamp = Date.UTC(year, (month || 1) - 1, day || 1);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!month) return String(year);

  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    ...(day ? { day: "numeric" as const } : {}),
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day || 1)));
}

export function UpdatesDirectory({ posts }: { posts: BlogPost[] }) {
  const [category, setCategory] = useState<BlogCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "title">("recent");
  const [view, setView] = useState<ViewMode>("cards");

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = posts.filter((post) => {
      const matchesCategory = category === "all" || post.category === category;
      const matchesSearch =
        !query || [post.title, post.category, post.sourceName, post.excerpt].join(" ").toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      return dateValue(b.publishedAt) - dateValue(a.publishedAt);
    });
  }, [posts, category, search, sort]);

  return (
    <>
      <FilterBar
        panelId="updates-panel"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search updates"
        filters={[{ label: "Category", value: category, onChange: (value) => setCategory(value as BlogCategory | "all"), options: CATEGORIES }]}
        sortOptions={SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visible.length, "update")}
        view={view}
        onViewChange={setView}
      />

      <section id="updates-panel" aria-label="Updates">
        {visible.length > 0 ? (
          view === "cards" ? (
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((post) => (
                <li key={post.slug}>
                  <DashboardCard
                    className="h-full"
                    actions={<DashboardCardActions collection="blogs" slug={post.slug} titleField="title" title={post.title} />}
                  >
                    <Link href={`/dashboard/blog/${post.slug}`} className="group flex h-full flex-col text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    <DashboardThumbnail src={post.image} label={post.category} className="h-36 w-full" imageClassName="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
                    <div className="flex min-h-[164px] flex-col p-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        <span className="text-primary">{post.category}</span>
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      <h2 className="m-0 mt-3 text-[16px] font-semibold leading-[1.25] tracking-tight group-hover:text-primary">{post.title}</h2>
                      <span className="mt-auto pt-4 text-[12px] text-muted-foreground">{post.sourceName}</span>
                    </div>
                    </Link>
                  </DashboardCard>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full border-collapse">
                <TableHeader>
                  <TableRow>
                    <TableHead>Update</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Published</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((post) => (
                    <ClickableTableRow key={post.slug} href={`/dashboard/blog/${post.slug}`} label={`Open update ${post.title}`}>
                      <TableCell className="px-4 py-4 font-semibold">
                        <Link href={`/dashboard/blog/${post.slug}`} className="text-foreground no-underline hover:text-primary focus-visible:text-primary">{post.title}</Link>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-primary">{post.category}</TableCell>
                      <TableCell className="px-4 py-4 text-muted-foreground">{post.sourceName}</TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-muted-foreground">{formatDate(post.publishedAt)}</TableCell>
                    </ClickableTableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : (
          <EmptyState title="No updates match" description="Try a different search term or category filter." />
        )}
      </section>
    </>
  );
}
