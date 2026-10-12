"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { isInternalClient, type Client } from "@/lib/clients";
import type { Job } from "@/lib/jobs";
import { plural, updatedDate } from "@/lib/format";
import { Badge, EmptyState, ImageWithFallback } from "@/components/dashboard/ui";
import { DashboardCardActions } from "@/components/dashboard-card";
import { CardGrid, ListCard } from "@/components/dashboard/list-card";
import { FilterBar, useListView, type SortOption } from "@/components/dashboard/filter-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { useAuth } from "@/components/auth-provider";

const SORTS: SortOption<"name" | "date" | "modified" | "industry">[] = [
  { key: "name", label: "Name (A–Z)" },
  { key: "date", label: "Most recent" },
  { key: "modified", label: "Recently updated" },
  { key: "industry", label: "Industry (A–Z)" },
];

type SortKey = (typeof SORTS)[number]["key"];

export function ClientsDirectory({ clients, jobs }: { clients: Client[]; jobs: Job[] }) {
  const { isAdmin } = useAuth();
  const [industry, setIndustry] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [view, setView] = useListView("clients");

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
      if (sort === "modified") return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
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
            <CardGrid>
              {visibleClients.map((client) => (
                <ListCard
                  key={client.slug}
                  href={`/admin/clients/${client.slug}/overview`}
                  image={client.profileImage}
                  title={client.name}
                  subtitle={updatedDate(client.updatedAt ?? client.date)}
                  menu={<DashboardCardActions collection="clients" slug={client.slug} titleField="name" title={client.name} />}
                />
              ))}
            </CardGrid>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Updated</TableHead>
                    {isAdmin ? <TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleClients.map((client) => (
                    <ClickableTableRow key={client.slug} href={`/admin/clients/${client.slug}/overview`} label={`Open client ${client.name}`}>
                      <TableCell className="font-semibold">
                        <Link href={`/admin/clients/${client.slug}/overview`} className="inline-flex items-center gap-3 text-foreground no-underline hover:text-primary focus-visible:text-primary">
                          <ImageWithFallback
                            src={client.profileImage}
                            alt=""
                            className="h-8 w-8 rounded-full bg-muted object-contain p-1"
                            fallbackClassName="h-8 w-8 rounded-full"
                          />
                          {client.name}
                        </Link>
                      </TableCell>
                      <TableCell><span className="inline-flex flex-wrap gap-1.5"><Badge>{client.industry}</Badge>{isInternalClient(client) ? <Badge tone="active">Internal</Badge> : null}</span></TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{updatedDate(client.updatedAt ?? client.date)}</TableCell>
                      {isAdmin ? <TableCell className="w-[1%] whitespace-nowrap text-right" onClick={(event) => event.stopPropagation()}>
                        <DashboardCardActions collection="clients" slug={client.slug} titleField="name" title={client.name} variant="table" />
                      </TableCell> : null}
                    </ClickableTableRow>
                  ))}
                </TableBody>
              </Table>
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
