"use client";

import * as React from "react";
import Link from "next/link";
import { Badge as DashboardBadge } from "@/components/dashboard/ui";
import { ImageWithFallback } from "@/components/empty-thumbnail";
import { DashboardCard } from "@/components/dashboard-card";
import { FilterBar, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { UserActions } from "@/components/user-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { plural } from "@/lib/format";
import { creatorCategoryOptions as knownCreatorCategories, type User } from "@/lib/users";

type TeamSort = "name" | "category" | "availability";

const TEAM_SORTS: SortOption<TeamSort>[] = [
  { key: "name", label: "Name (A–Z)" },
  { key: "category", label: "Category (A–Z)" },
  { key: "availability", label: "Availability" },
];

/** Searchable card/table list of a job's team. */
export function TeamPanel({
  panelId,
  label,
  members,
  allUsers,
  listHref,
  emptyText,
}: {
  panelId: string;
  label: string;
  members: User[];
  allUsers: User[];
  listHref: string;
  emptyText: string;
}) {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [sort, setSort] = React.useState<TeamSort>("name");
  const [view, setView] = React.useState<ViewMode>("cards");

  const categoryOptions = React.useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...[...new Set(members.map((member) => member.category))]
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ],
    [members],
  );

  const visible = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = members.filter((member) => {
      const matchesCategory = category === "all" || member.category === category;
      const matchesSearch =
        !query ||
        [member.name, member.category, member.location, member.availability, ...member.tags]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      if (sort === "availability") return a.availability.localeCompare(b.availability) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [category, members, search, sort]);

  return (
    <>
      <FilterBar
        panelId={panelId}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search team"
        filters={[{ label: "Category", value: category, onChange: setCategory, options: categoryOptions }]}
        sortOptions={TEAM_SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visible.length, "team member")}
        view={view}
        onViewChange={setView}
        className="my-4"
      />
      {members.length ? (
        <section id={panelId} aria-label={label} className="pt-2">
          {visible.length > 0 ? (
            view === "cards" ? (
              <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
                {visible.map((member) => (
                  <li key={member.slug}>
                    <DashboardCard
                      className="h-full"
                      actions={<UserActions user={member} variant="creator" listHref={listHref} compactMenu categoryOptions={knownCreatorCategories(allUsers)} />}
                    >
                      <Link
                        href={`/dashboard/discover/${member.slug}`}
                        className="group flex h-full flex-col text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <div className="h-28 shrink-0 overflow-hidden bg-muted">
                          <ImageWithFallback
                            src={member.profileImage ?? member.featuredImage ?? "/images/projects/project-placeholder.svg"}
                            alt={`${member.name} profile`}
                            className="h-full w-full object-cover"
                            fallbackSeed={member.name}
                          />
                        </div>
                        <div className="flex min-h-[170px] flex-col gap-3 p-4">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{member.category}</span>
                          <h3 className="m-0 line-clamp-2 text-[16px] font-semibold leading-tight group-hover:text-primary">{member.name}</h3>
                          <div className="mt-auto flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
                            <DashboardBadge tone={member.availability === "open" ? "active" : "neutral"}>{member.availability}</DashboardBadge>
                            <span>{!member.hideRate && member.rateMin !== null ? member.dayRate : member.location}</span>
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
                      <TableHead>Creator</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((member) => (
                      <ClickableTableRow key={member.slug} href={`/dashboard/discover/${member.slug}`} label={`Open creator ${member.name}`}>
                        <TableCell className="px-3 py-2 font-semibold">
                          <Link href={`/dashboard/discover/${member.slug}`} className="inline-flex items-center gap-3 text-foreground no-underline hover:text-primary focus-visible:text-primary">
                            <ImageWithFallback
                              src={member.profileImage ?? member.featuredImage}
                              alt=""
                              className="h-8 w-8 rounded-full bg-muted object-cover"
                              fallbackClassName="h-8 w-8 rounded-full"
                              fallbackSeed={member.name}
                            />
                            {member.name}
                          </Link>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-muted-foreground">{member.category}</TableCell>
                        <TableCell className="px-3 py-2"><DashboardBadge tone={member.availability === "open" ? "active" : "neutral"}>{member.availability}</DashboardBadge></TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-2 text-muted-foreground">{member.location || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-2 text-muted-foreground">{!member.hideRate && member.rateMin !== null ? member.dayRate : "—"}</TableCell>
                      </ClickableTableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <p className="m-0 py-8 text-center text-sm text-muted-foreground">No team members match this search or filter.</p>
          )}
        </section>
      ) : (
        <p className="py-10 text-sm text-muted-foreground">{emptyText}</p>
      )}
    </>
  );
}
