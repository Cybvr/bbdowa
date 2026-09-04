"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Campaign } from "@/lib/campaigns";
import { campaignHref, campaignLiveDateLabel } from "@/lib/campaigns";
import { plural } from "@/lib/format";
import { Badge, EmptyState } from "@/components/dashboard/ui";
import { FilterBar, type FilterTab, type SortOption } from "@/components/dashboard/filter-bar";

const FILTERS: FilterTab<"all" | "live" | "completed">[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "completed", label: "Completed" },
];

type FilterKey = (typeof FILTERS)[number]["key"];

const SORTS: SortOption<"recent" | "name" | "client">[] = [
  { key: "recent", label: "Most recent" },
  { key: "name", label: "Name (A–Z)" },
  { key: "client", label: "Client (A–Z)" },
];

type SortKey = (typeof SORTS)[number]["key"];

function liveTime(campaign: Campaign): number {
  return campaign.liveAt ? Date.parse(`${campaign.liveAt.date}T00:00:00Z`) : 0;
}

export function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = campaigns.filter((campaign) => {
      const matchesFilter = filter === "all" || campaign.status === filter;
      const matchesSearch =
        !query ||
        [campaign.campaign, campaign.name, campaign.client, campaign.category, campaign.lead]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesFilter && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "client") return a.client.localeCompare(b.client);
      return liveTime(b) - liveTime(a);
    });
  }, [campaigns, filter, search, sort]);

  return (
    <>
      <FilterBar
        panelId="campaign-panel"
        tabs={FILTERS}
        activeTab={filter}
        onTabChange={setFilter}
        tabsLabel="Filter campaigns by status"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search campaigns"
        sortOptions={SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visible.length, "campaign")}
      />

      <section id="campaign-panel" role="tabpanel" aria-labelledby={`campaign-panel-tab-${filter}`}>
        {visible.length > 0 ? (
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((campaign) => (
              <li key={campaign.slug}>
                <Link
                  href={campaignHref(campaign.slug)}
                  className="group flex h-full overflow-hidden rounded-xl border border-border bg-background text-foreground no-underline transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="aspect-[4/3] w-[38%] shrink-0 bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={campaign.image}
                      alt={campaign.imageAlt}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
                    <div className="space-y-1">
                      <span className="block text-[16px] font-semibold leading-tight group-hover:text-primary">
                        {campaign.campaign ?? campaign.name}
                      </span>
                      <span className="block text-[13px] text-muted-foreground">
                        {campaign.client} · {campaign.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={campaign.status === "live" ? "active" : "neutral"}>{campaign.status}</Badge>
                      <span className="text-[12px] text-muted-foreground">{campaignLiveDateLabel(campaign)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No campaigns match"
            description="Try a different search term, status filter or clear your filters."
          />
        )}
      </section>
    </>
  );
}
