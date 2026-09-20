"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Campaign } from "@/lib/campaigns";
import type { Client } from "@/lib/clients";
import { getClientCampaigns } from "@/lib/clients";
import { longDate, plural } from "@/lib/format";
import { getCreator, type Creator } from "@/lib/users";
import { Badge, EmptyState, ImageWithFallback } from "@/components/dashboard/ui";
import { DashboardCard, DashboardCardActions } from "@/components/dashboard-card";
import { CreatorAvatarStack } from "@/components/creator-avatar-stack";
import { FilterBar, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";

const SORTS: SortOption<"name" | "date" | "industry">[] = [
  { key: "name", label: "Name (A–Z)" },
  { key: "date", label: "Most recent" },
  { key: "industry", label: "Industry (A–Z)" },
];

type SortKey = (typeof SORTS)[number]["key"];

function clientCreators(client: Client, campaigns: Campaign[]): Creator[] {
  const slugs = new Set(getClientCampaigns(client.slug, campaigns).flatMap((campaign) => campaign.creatorSlugs ?? []));
  return [...slugs]
    .map((slug) => getCreator(slug))
    .filter((creator): creator is Creator => Boolean(creator));
}

export function ClientsDirectory({ clients, campaigns }: { clients: Client[]; campaigns: Campaign[] }) {
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
                  <DashboardCard
                    className="h-full"
                    actions={<DashboardCardActions collection="clients" slug={client.slug} titleField="name" title={client.name} />}
                  >
                    <Link href={`/dashboard/clients/${client.slug}/overview`} className="group flex h-full flex-col text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    <div className="flex h-28 shrink-0 items-center justify-center overflow-hidden bg-muted px-6 py-4">
                      <ImageWithFallback
                        src={client.profileImage}
                        alt={`${client.name} profile image`}
                        className="h-full w-full object-contain mix-blend-multiply"
                        fallbackClassName="h-full w-full"
                      />
                    </div>
                    <div className="flex min-h-[170px] flex-col gap-3 p-4">
                      <h3 className="m-0 text-[16px] font-semibold leading-tight group-hover:text-primary">{client.name}</h3>
                      <Badge>{client.industry}</Badge>
                      <CreatorAvatarStack creators={clientCreators(client, campaigns)} />
                      <div className="mt-auto text-[12px] text-muted-foreground">
                        {client.date ? <time dateTime={client.date}>{longDate(client.date)}</time> : "—"}
                      </div>
                    </div>
                    </Link>
                  </DashboardCard>
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
