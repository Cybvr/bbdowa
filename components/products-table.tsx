"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { productDate, productHref } from "@/lib/products";
import { longDate, plural } from "@/lib/format";
import { Badge, EmptyState } from "@/components/dashboard/ui";
import { FilterBar, type FilterTab, type SortOption } from "@/components/dashboard/filter-bar";

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
        tabsLabel="Filter products by status"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products"
        sortOptions={SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visible.length, "product")}
      />

      <section id="product-panel" role="tabpanel" aria-labelledby={`product-panel-tab-${filter}`}>
      {visible.length > 0 ? (
      <div className="overflow-x-auto">
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.avatar}
                      alt={product.name}
                      className="block h-9 w-[110px] object-contain object-left mix-blend-multiply"
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
