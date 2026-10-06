"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { isInternalClient, type Client } from "@/lib/clients";
import type { Job } from "@/lib/jobs";
import { longDate, plural } from "@/lib/format";
import { matchesJobTeamKey, type Creator, type User } from "@/lib/users";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { Badge, EmptyState, ImageWithFallback } from "@/components/dashboard/ui";
import { DashboardCard, DashboardCardActions } from "@/components/dashboard-card";
import { CreatorAvatarStack } from "@/components/creator-avatar-stack";
import { FilterBar, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";

const SORTS: SortOption<"name" | "date" | "modified" | "industry">[] = [
  { key: "name", label: "Name (A–Z)" },
  { key: "date", label: "Most recent" },
  { key: "modified", label: "Recently updated" },
  { key: "industry", label: "Industry (A–Z)" },
];

/** Formats an ISO datetime (e.g. Firestore's updatedAt) using the date-only formatter. */
function updatedDate(iso: string | null | undefined): string {
  return longDate(iso?.slice(0, 10));
}

type SortKey = (typeof SORTS)[number]["key"];

// A client's people are everyone on the team of one of its jobs.
function clientCreators(client: Client, jobs: Job[], users: User[]): Creator[] {
  return [...new Set(jobs.filter((job) => job.clientId === client.slug).flatMap((job) => job.creatorSlugs ?? []))]
    .map((key) => users.find((user) => matchesJobTeamKey(user, key)))
    .filter((creator): creator is Creator => Boolean(creator));
}

export function ClientsDirectory({ clients, jobs }: { clients: Client[]; jobs: Job[] }) {
  const { users } = useFirestoreUsers();
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
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {visibleClients.map((client) => (
                <li key={client.slug}>
                  <DashboardCard
                    className="h-full"
                    actions={<DashboardCardActions collection="clients" slug={client.slug} titleField="name" title={client.name} />}
                  >
                    <Link href={`/admin/clients/${client.slug}/overview`} className="group flex h-full flex-col text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
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
                      <div className="flex flex-wrap gap-1.5"><Badge>{client.industry}</Badge>{isInternalClient(client) ? <Badge tone="active">Internal</Badge> : null}</div>
                      <CreatorAvatarStack creators={clientCreators(client, jobs, users)} />
                      <div className="mt-auto text-[12px] text-muted-foreground">
                        {client.date ? (
                          <time dateTime={client.date}>{longDate(client.date)}</time>
                        ) : client.updatedAt ? (
                          <span>Updated {updatedDate(client.updatedAt)}</span>
                        ) : (
                          "—"
                        )}
                      </div>
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
                    <TableHead>Client</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleClients.map((client) => (
                    <ClickableTableRow key={client.slug} href={`/admin/clients/${client.slug}/overview`} label={`Open client ${client.name}`}>
                      <TableCell className="px-4 py-3.5 font-semibold">
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
                      <TableCell className="px-4 py-3.5"><span className="inline-flex flex-wrap gap-1.5"><Badge>{client.industry}</Badge>{isInternalClient(client) ? <Badge tone="active">Internal</Badge> : null}</span></TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{client.date ? <time dateTime={client.date}>{longDate(client.date)}</time> : "—"}</TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{client.updatedAt ? updatedDate(client.updatedAt) : "—"}</TableCell>
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
