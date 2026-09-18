"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Campaign } from "@/lib/campaigns";
import { campaignHref, campaignLiveDateLabel } from "@/lib/campaigns";
import { plural } from "@/lib/format";
import { EmptyState, ImageWithFallback } from "@/components/dashboard/ui";
import { FilterBar, type FilterTab, type SortOption } from "@/components/dashboard/filter-bar";

const STATUS_TABS: FilterTab<"all" | "live" | "completed">[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "completed", label: "Completed" },
];

type StatusKey = (typeof STATUS_TABS)[number]["key"];

const SORTS: SortOption<"recent" | "name" | "organization">[] = [
  { key: "recent", label: "Most recent" },
  { key: "name", label: "Name (A–Z)" },
  { key: "organization", label: "Organization (A–Z)" },
];

type SortKey = (typeof SORTS)[number]["key"];

function liveTime(campaign: Campaign): number {
  return campaign.liveAt ? Date.parse(`${campaign.liveAt.date}T00:00:00Z`) : 0;
}

export function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  const [status, setStatus] = useState<StatusKey>("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...[...new Set(campaigns.map((campaign) => campaign.category))]
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ],
    [campaigns],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = campaigns.filter((campaign) => {
      const matchesStatus = status === "all" || campaign.status === status;
      const matchesCategory = category === "all" || campaign.category === category;
      const matchesSearch =
        !query ||
        [campaign.campaign, campaign.name, campaign.organizationName, campaign.category, campaign.leadUserId]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesStatus && matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "organization") return a.organizationName.localeCompare(b.organizationName);
      return liveTime(b) - liveTime(a);
    });
  }, [campaigns, status, category, search, sort]);

  return (
    <>
      <FilterBar
        panelId="campaign-panel"
        tabs={STATUS_TABS}
        activeTab={status}
        onTabChange={setStatus}
        tabsLabel="Status"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search campaigns"
        filters={[
          { label: "Category", value: category, onChange: setCategory, options: categoryOptions },
        ]}
        sortOptions={SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visible.length, "campaign")}
      />

      <section id="campaign-panel" aria-label="Campaigns">
        {visible.length > 0 ? (
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((campaign) => (
              <li key={campaign.slug}>
                <Link
                  href={campaignHref(campaign.slug)}
                  className="group flex h-full overflow-hidden rounded-xl border border-border bg-background text-foreground no-underline transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="aspect-[4/3] w-[38%] shrink-0 bg-muted overflow-hidden">
                    <ImageWithFallback
                      src={campaign.image}
                      alt={campaign.imageAlt}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-4">
                    <div className="space-y-1">
                      <span className="block text-[16px] font-semibold leading-tight group-hover:text-primary">
                        {campaign.campaign ?? campaign.name}
                      </span>
                      <span className="block text-[13px] text-muted-foreground">{campaign.organizationName}</span>
                    </div>
                    <span className="text-[12px] text-muted-foreground">{campaignLiveDateLabel(campaign)}</span>
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
