"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Job } from "@/lib/jobs";
import { jobHref, jobLiveDateLabel } from "@/lib/jobs";
import type { Client } from "@/lib/clients";
import { longDate, plural } from "@/lib/format";
import type { Creator, User } from "@/lib/users";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { Badge, EmptyState, ImageWithFallback } from "@/components/dashboard/ui";
import { DashboardCard, DashboardCardActions } from "@/components/dashboard-card";
import { CreatorAvatarStack } from "@/components/creator-avatar-stack";
import { FilterBar, type FilterTab, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";

function jobCreators(job: Job, clients: Client[], users: User[]): Creator[] {
  const client = clients.find((item) => item.slug === job.clientId);
  return (client?.creatorSlugs ?? [])
    .map((slug) => users.find((user) => user.slug === slug))
    .filter((creator): creator is Creator => Boolean(creator));
}

const STATUS_TABS: FilterTab<"all" | "active" | "completed" | "archive">[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "archive", label: "Archive" },
];

type StatusKey = (typeof STATUS_TABS)[number]["key"];

function jobMatchesStatus(job: Job, status: StatusKey) {
  if (status === "all") return true;
  if (status === "active") return job.status === "live";
  if (status === "completed") return job.status === "completed";
  return job.status === "pitch";
}

const SORTS: SortOption<"recent" | "name" | "client" | "modified">[] = [
  { key: "recent", label: "Most recent" },
  { key: "name", label: "Name (A–Z)" },
  { key: "client", label: "Client (A–Z)" },
  { key: "modified", label: "Recently updated" },
];

type SortKey = (typeof SORTS)[number]["key"];

function liveTime(job: Job): number {
  return job.liveAt ? Date.parse(`${job.liveAt.date}T00:00:00Z`) : 0;
}

/** Formats an ISO datetime (e.g. Firestore's updatedAt) using the date-only formatter. */
function updatedDate(iso: string | null | undefined): string {
  return longDate(iso?.slice(0, 10));
}

export function JobsTable({ jobs, clients }: { jobs: Job[]; clients: Client[] }) {
  const { users } = useFirestoreUsers();
  const [status, setStatus] = useState<StatusKey>("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<ViewMode>("cards");

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...[...new Set(jobs.map((job) => job.category))]
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ],
    [jobs],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      const matchesStatus = jobMatchesStatus(job, status);
      const matchesCategory = category === "all" || job.category === category;
      const matchesSearch =
        !query ||
        [job.title, job.name, job.clientName, job.category, job.leadUserId]
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
  }, [jobs, status, category, search, sort]);

  return (
    <>
      <FilterBar
        panelId="job-panel"
        tabs={STATUS_TABS}
        activeTab={status}
        onTabChange={setStatus}
        tabsLabel="Status"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search jobs"
        filters={[
          { label: "Category", value: category, onChange: setCategory, options: categoryOptions },
        ]}
        sortOptions={SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visible.length, "job")}
        view={view}
        onViewChange={setView}
      />

      <section id="job-panel" aria-label="Jobs">
        {visible.length > 0 ? (
          view === "cards" ? (
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((job) => (
                <li key={job.slug}>
                  <DashboardCard
                    className="h-full"
                    actions={<DashboardCardActions collection="jobs" slug={job.slug} titleField="title" title={job.title ?? job.name} />}
                  >
                    <Link href={jobHref(job.slug, true)} className="group flex h-full flex-col text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    <div className="h-28 shrink-0 overflow-hidden bg-muted">
                      <ImageWithFallback
                        src={job.image}
                        alt={job.imageAlt}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex min-h-[170px] flex-col gap-3 p-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{job.clientName}</span>
                      <h3 className="m-0 line-clamp-2 text-[16px] font-semibold leading-tight group-hover:text-primary">{job.title ?? job.name}</h3>
                      <CreatorAvatarStack creators={jobCreators(job, clients, users)} />
                      <div className="mt-auto flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
                          <Badge tone={job.status === "live" ? "active" : "neutral"}>{job.status}</Badge>
                          <span>{jobLiveDateLabel(job)}</span>
                        </div>
                        {job.updatedAt ? (
                          <span className="text-[11px] text-muted-foreground">Updated {updatedDate(job.updatedAt)}</span>
                        ) : null}
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
                    <TableHead>Job</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((job) => (
                    <ClickableTableRow key={job.slug} href={jobHref(job.slug, true)} label={`Open job ${job.title ?? job.name}`}>
                      <TableCell className="px-4 py-4 font-semibold">
                        <Link href={jobHref(job.slug, true)} className="text-foreground no-underline hover:text-primary focus-visible:text-primary">
                          {job.title ?? job.name}
                        </Link>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-muted-foreground">{job.clientName}</TableCell>
                      <TableCell className="px-4 py-4"><Badge tone={job.status === "live" ? "active" : "neutral"}>{job.status}</Badge></TableCell>
                      <TableCell className="px-4 py-4 text-muted-foreground">{job.category}</TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-muted-foreground">{jobLiveDateLabel(job)}</TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-muted-foreground">{job.updatedAt ? updatedDate(job.updatedAt) : "—"}</TableCell>
                    </ClickableTableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : (
          <EmptyState
            title="No jobs match"
            description="Try a different search term, status filter or clear your filters."
          />
        )}
      </section>
    </>
  );
}
