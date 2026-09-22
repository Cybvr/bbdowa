"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Campaign } from "@/lib/campaigns";
import { campaignHref, campaignLiveDateLabel } from "@/lib/campaigns";
import type { Client } from "@/lib/clients";
import { longDate, plural } from "@/lib/format";
import type { Creator, User } from "@/lib/users";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { Badge, EmptyState, ImageWithFallback } from "@/components/dashboard/ui";
import { DashboardCard, DashboardCardActions } from "@/components/dashboard-card";
import { CreatorAvatarStack } from "@/components/creator-avatar-stack";
import { FilterBar, type FilterTab, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";

function campaignCreators(campaign: Campaign, clients: Client[], users: User[]): Creator[] {
  const client = clients.find((item) => item.slug === campaign.clientId);
  return (client?.creatorSlugs ?? [])
    .map((slug) => users.find((user) => user.slug === slug))
    .filter((creator): creator is Creator => Boolean(creator));
}

const STATUS_TABS: FilterTab<"all" | "live" | "completed">[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "completed", label: "Completed" },
];

type StatusKey = (typeof STATUS_TABS)[number]["key"];

const SORTS: SortOption<"recent" | "name" | "client" | "modified">[] = [
  { key: "recent", label: "Most recent" },
  { key: "name", label: "Name (A–Z)" },
  { key: "client", label: "Client (A–Z)" },
  { key: "modified", label: "Recently updated" },
];

type SortKey = (typeof SORTS)[number]["key"];

function liveTime(campaign: Campaign): number {
  return campaign.liveAt ? Date.parse(`${campaign.liveAt.date}T00:00:00Z`) : 0;
}

/** Formats an ISO datetime (e.g. Firestore's updatedAt) using the date-only formatter. */
function updatedDate(iso: string | null | undefined): string {
  return longDate(iso?.slice(0, 10));
}

export function CampaignsTable({ campaigns, clients }: { campaigns: Campaign[]; clients: Client[] }) {
  const { users } = useFirestoreUsers();
  const [status, setStatus] = useState<StatusKey>("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<ViewMode>("cards");

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
        [campaign.campaign, campaign.name, campaign.clientName, campaign.category, campaign.leadUserId]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesStatus && matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "client") return a.clientName.localeCompare(b.clientName);
      if (sort === "modified") return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
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
        view={view}
        onViewChange={setView}
      />

      <section id="campaign-panel" aria-label="Campaigns">
        {visible.length > 0 ? (
          view === "cards" ? (
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((campaign) => (
                <li key={campaign.slug}>
                  <DashboardCard
                    className="h-full"
                    actions={<DashboardCardActions collection="campaigns" slug={campaign.slug} titleField="campaign" title={campaign.campaign ?? campaign.name} />}
                  >
                    <Link href={campaignHref(campaign.slug)} className="group flex h-full flex-col text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    <div className="h-28 shrink-0 overflow-hidden bg-muted">
                      <ImageWithFallback
                        src={campaign.image}
                        alt={campaign.imageAlt}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex min-h-[170px] flex-col gap-3 p-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{campaign.clientName}</span>
                      <h3 className="m-0 line-clamp-2 text-[16px] font-semibold leading-tight group-hover:text-primary">{campaign.campaign ?? campaign.name}</h3>
                      <CreatorAvatarStack creators={campaignCreators(campaign, clients, users)} />
                      <div className="mt-auto flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
                          <Badge tone={campaign.status === "live" ? "active" : "neutral"}>{campaign.status}</Badge>
                          <span>{campaignLiveDateLabel(campaign)}</span>
                        </div>
                        {campaign.updatedAt ? (
                          <span className="text-[11px] text-muted-foreground">Updated {updatedDate(campaign.updatedAt)}</span>
                        ) : null}
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
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Campaign</th>
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Client</th>
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Category</th>
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Date</th>
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((campaign) => (
                    <tr key={campaign.slug} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-4 text-[15px] font-semibold">
                        <Link href={campaignHref(campaign.slug)} className="text-foreground no-underline hover:text-primary focus-visible:text-primary">
                          {campaign.campaign ?? campaign.name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-[15px] text-muted-foreground">{campaign.clientName}</td>
                      <td className="px-4 py-4 text-[15px]"><Badge tone={campaign.status === "live" ? "active" : "neutral"}>{campaign.status}</Badge></td>
                      <td className="px-4 py-4 text-[15px] text-muted-foreground">{campaign.category}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-[15px] text-muted-foreground">{campaignLiveDateLabel(campaign)}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-[15px] text-muted-foreground">{campaign.updatedAt ? updatedDate(campaign.updatedAt) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
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
