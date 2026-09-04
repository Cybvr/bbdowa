"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Campaign } from "@/lib/campaigns";
import type { ClientUser } from "@/lib/users";
import { userHref } from "@/lib/users";
import { plural } from "@/lib/format";
import { EmptyState, ImageWithFallback } from "@/components/dashboard/ui";
import { FilterBar, type FilterTab, type SortOption } from "@/components/dashboard/filter-bar";

const FILTERS: FilterTab<"all" | "live" | "completed">[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "completed", label: "Completed" },
];

type FilterKey = (typeof FILTERS)[number]["key"];

const SORTS: SortOption<"name" | "campaigns">[] = [
  { key: "name", label: "Name (A-Z)" },
  { key: "campaigns", label: "Campaign count" },
];

type SortKey = (typeof SORTS)[number]["key"];

function hasCompletedCampaigns(clientSlug: string, campaigns: Campaign[]): boolean {
  const clientCampaigns = campaigns.filter((campaign) => campaign.clientId === clientSlug);
  return clientCampaigns.length > 0 && clientCampaigns.every((campaign) => campaign.status === "completed");
}

function hasLiveCampaigns(clientSlug: string, campaigns: Campaign[]): boolean {
  return campaigns.some((campaign) => campaign.clientId === clientSlug && campaign.status === "live");
}

export function ClientsDirectory({ clients, campaigns }: { clients: ClientUser[]; campaigns: Campaign[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");

  const visibleClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = clients.filter((client) => {
      const matchesSearch = !query || client.name.toLowerCase().includes(query);
      const matchesFilter =
        filter === "all" ||
        (filter === "live"
          ? hasLiveCampaigns(client.slug, campaigns)
          : hasCompletedCampaigns(client.slug, campaigns));
      return matchesSearch && matchesFilter;
    });

    return [...matches].sort((a, b) => {
      if (sort === "campaigns") {
        const aCount = campaigns.filter((campaign) => campaign.clientId === a.slug).length;
        const bCount = campaigns.filter((campaign) => campaign.clientId === b.slug).length;
        return bCount - aCount || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [campaigns, clients, filter, search, sort]);

  return (
    <>
      <FilterBar
        panelId="client-panel"
        tabs={FILTERS}
        activeTab={filter}
        onTabChange={setFilter}
        tabsLabel="Filter clients by status"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search clients"
        sortOptions={SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visibleClients.length, "client")}
      />

      <section id="client-panel" role="tabpanel" aria-labelledby={`client-panel-tab-${filter}`}>
        {visibleClients.length > 0 ? (
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {visibleClients.map((client) => {
              const clientCampaigns = campaigns.filter((campaign) => campaign.clientId === client.slug);

              return (
                <li key={client.slug}>
                  <Link
                    href={userHref(client)}
                    className="group flex h-full overflow-hidden rounded-xl border border-border bg-background text-foreground no-underline transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <div className="aspect-[4/3] w-[38%] shrink-0 bg-muted overflow-hidden flex items-center justify-center p-3">
                      <ImageWithFallback
                        src={client.profileImage}
                        alt={`${client.name} profile image`}
                        className="h-full w-full object-contain"
                        iconClassName="w-6 h-6"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
                      <span className="text-[16px] font-semibold leading-tight group-hover:text-primary">{client.name}</span>
                      <span className="text-[13px] text-muted-foreground">
                        {clientCampaigns.length} {clientCampaigns.length === 1 ? "campaign" : "campaigns"}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="No clients match" description="Try a different search term or clear your search." />
        )}
      </section>
    </>
  );
}
