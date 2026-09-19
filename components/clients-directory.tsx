"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Client } from "@/lib/clients";
import { longDate, plural } from "@/lib/format";
import { Badge, EmptyState, ImageWithFallback } from "@/components/dashboard/ui";
import { FilterBar, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";

const SORTS: SortOption<"name" | "date" | "industry">[] = [
  { key: "name", label: "Name (A–Z)" },
  { key: "date", label: "Most recent" },
  { key: "industry", label: "Industry (A–Z)" },
];

type SortKey = (typeof SORTS)[number]["key"];

export function ClientsDirectory({ clients }: { clients: Client[] }) {
  const [industry, setIndustry] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [view, setView] = useState<ViewMode>("cards");

  const industryOptions = useMemo(
    () => [
      { value: "all", label: "All industries" },
      ...[...new Set(clients.map((client) => client.industry))]
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ],
    [clients],
  );

  const visibleClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = clients.filter((client) => {
      const matchesSearch =
        !query || [client.name, client.industry].join(" ").toLowerCase().includes(query);
      const matchesIndustry = industry === "all" || client.industry === industry;
      return matchesSearch && matchesIndustry;
    });

    return [...matches].sort((a, b) => {
      if (sort === "date") return (b.date ?? "").localeCompare(a.date ?? "");
      if (sort === "industry") return a.industry.localeCompare(b.industry) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [clients, industry, search, sort]);

  return (
    <>
      <FilterBar
        panelId="client-panel"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search clients"
        filters={[
          { label: "Industry", value: industry, onChange: setIndustry, options: industryOptions },
        ]}
        sortOptions={SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visibleClients.length, "client")}
        view={view}
        onViewChange={setView}
      />

      <section id="client-panel" aria-label="Clients">
        {visibleClients.length > 0 ? (
          view === "cards" ? (
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {visibleClients.map((client) => (
                <li key={client.slug}>
                  <Link
                    href={`/dashboard/clients/${client.slug}/overview`}
                    className="group flex h-full overflow-hidden rounded-xl border border-border bg-background text-foreground no-underline transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <div className="flex aspect-[4/3] w-[38%] shrink-0 items-center justify-center overflow-hidden bg-muted p-3">
                      <ImageWithFallback
                        src={client.profileImage}
                        alt={`${client.name} profile image`}
                        className="h-full w-full object-contain"
                        iconClassName="w-6 h-6"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col p-4">
                      <span className="text-[16px] font-semibold leading-tight group-hover:text-primary">
                        {client.name}
                      </span>
                      <div className="mt-auto flex flex-col items-start gap-1.5 pt-3">
                        <Badge>{client.industry}</Badge>
                        <span className="text-[13px] text-muted-foreground">
                          {client.date ? <time dateTime={client.date}>{longDate(client.date)}</time> : "—"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Client</th>
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Industry</th>
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleClients.map((client) => (
                    <tr key={client.slug} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3.5 text-[13px] font-semibold">
                        <Link href={`/dashboard/clients/${client.slug}/overview`} className="inline-flex items-center gap-3 text-foreground no-underline hover:text-primary focus-visible:text-primary">
                          <ImageWithFallback
                            src={client.profileImage}
                            alt=""
                            className="h-8 w-8 rounded-full bg-muted object-contain p-1"
                            fallbackClassName="h-8 w-8 rounded-full"
                          />
                          {client.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-[13px]"><Badge>{client.industry}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-muted-foreground">{client.date ? <time dateTime={client.date}>{longDate(client.date)}</time> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <EmptyState
            title="No clients match"
            description="Try a different search term, industry filter or clear your filters."
          />
        )}
      </section>
    </>
  );
}
