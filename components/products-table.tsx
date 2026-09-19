"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { productDate, productHref } from "@/lib/products";
import { longDate, plural } from "@/lib/format";
import { Badge, EmptyState, ImageWithFallback } from "@/components/dashboard/ui";
import { DashboardCard, DashboardCardActions } from "@/components/dashboard-card";
import { FilterBar, type FilterTab, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";

const FILTERS: FilterTab<"all" | "active" | "idea">[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "idea", label: "Idea" },
];

type FilterKey = (typeof FILTERS)[number]["key"];

const SORTS: SortOption<"name" | "status" | "date">[] = [
  { key: "name", label: "Name (A–Z)" },
  { key: "status", label: "Status" },
  { key: "date", label: "Created / target date" },
];

type SortKey = (typeof SORTS)[number]["key"];

function dateValue(product: Product): number {
  const date = productDate(product);
  return date ? Date.parse(date) : 0;
}

const TH =
  "whitespace-nowrap border-b border-border pb-3 pl-0 pr-4 pt-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const TD = "border-b border-border pb-4 pl-0 pr-4 pt-4 align-middle text-[13px] leading-[1.35]";

export function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [view, setView] = useState<ViewMode>("cards");

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesFilter = filter === "all" || product.status === filter;
      const matchesSearch =
        !query ||
        [product.name, product.owner?.name ?? "", ...product.users]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesFilter && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "status") return a.status.localeCompare(b.status);
      if (sort === "date") return dateValue(b) - dateValue(a);
      return a.name.localeCompare(b.name);
    });
  }, [products, filter, search, sort]);

  return (
    <>
      <FilterBar
        panelId="product-panel"
        tabs={FILTERS}
        activeTab={filter}
        onTabChange={setFilter}
        tabsLabel="Status"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products"
        sortOptions={SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visible.length, "product")}
        view={view}
        onViewChange={setView}
      />

      <section id="product-panel" aria-label="Products">
      {visible.length > 0 ? (
      view === "cards" ? (
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((product) => {
          const date = productDate(product);
          return (
            <li key={product.slug}>
              <DashboardCard
                className="h-full"
                actions={<DashboardCardActions collection="products" slug={product.slug} titleField="name" title={product.name} />}
              >
                <Link href={productHref(product.slug)} className="group flex h-full flex-col text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                <div className="flex h-28 items-center justify-center bg-muted px-6 py-4">
                  <ImageWithFallback
                    src={product.avatar}
                    alt={product.name}
                    className="h-full w-full object-contain mix-blend-multiply"
                    fallbackClassName="h-full w-full"
                  />
                </div>
                <div className="flex min-h-[170px] flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="m-0 text-[16px] font-semibold leading-tight group-hover:text-primary">{product.name}</h3>
                    <Badge tone={product.status === "active" ? "active" : "neutral"}>{product.status}</Badge>
                  </div>
                  <p className="m-0 line-clamp-2 text-[13px] leading-[1.4] text-muted-foreground">{product.valueLine}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
                    <span>{product.owner?.name ?? "Unassigned"}</span>
                    <span>{date ? longDate(date) : "—"}</span>
                  </div>
                </div>
                </Link>
              </DashboardCard>
            </li>
          );
        })}
      </ul>
      ) : (
      <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={TH}>Name</th>
            <th className={TH}>Status</th>
            <th className={TH}>Owner</th>
            <th className={`${TH} max-[900px]:hidden`}>Value</th>
            <th className={`${TH} max-[720px]:hidden`}>Users</th>
            <th className={TH}>Created / target date</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((product) => {
            const href = productHref(product.slug);
            const date = productDate(product);
            return (
              <tr
                key={product.slug}
                onClick={(event) => {
                  if (!(event.target as HTMLElement).closest("a")) router.push(href);
                }}
                className="cursor-pointer hover:bg-muted/50"
              >
                <td className={TD}>
                  <Link
                    href={href}
                    className="inline-flex items-center gap-2.5 text-foreground no-underline hover:text-primary focus-visible:text-primary"
                  >
                    <ImageWithFallback
                      src={product.avatar}
                      alt={product.name}
                      className="block h-9 w-[110px] object-contain object-left mix-blend-multiply"
                      fallbackClassName="h-9 w-[110px]"
                    />
                  </Link>
                </td>
                <td className={TD}>
                  <Badge tone={product.status === "active" ? "active" : "neutral"}>{product.status}</Badge>
                </td>
                <td className={TD}>
                  {product.owner ? (
                    <span className="flex items-center gap-3 whitespace-nowrap">
                      <span
                        aria-hidden="true"
                        className="grid h-8 w-8 flex-none place-items-center rounded-full bg-primary text-[12px] font-bold text-white"
                      >
                        {product.owner.avatar}
                      </span>
                      {product.owner.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className={`${TD} max-[900px]:hidden`}>
                  <span className="block max-w-[36ch] text-muted-foreground">{product.valueLine}</span>
                </td>
                <td className={`${TD} max-[720px]:hidden`}>
                  <span className="flex flex-wrap gap-1.5">
                    {product.users.map((user) => (
                      <span
                        key={user}
                        className="whitespace-nowrap rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {user}
                      </span>
                    ))}
                  </span>
                </td>
                <td className={`${TD} whitespace-nowrap [font-variant-numeric:tabular-nums]`}>
                  {date ? <time dateTime={date}>{longDate(date)}</time> : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      )
      ) : (
        <EmptyState
          title="No products match"
          description="Try a different search term, status filter or clear your filters."
        />
      )}
      </section>
    </>
  );
}
