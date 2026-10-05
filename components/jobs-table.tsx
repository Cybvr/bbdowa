"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { JOB_STATUS_LABELS, byLastModified, jobTitle, type Job } from "@/lib/jobs";
import { jobHref, jobLiveDateLabel } from "@/lib/jobs";
import { longDate, plural } from "@/lib/format";
import { Badge, EmptyState } from "@/components/dashboard/ui";
import { DashboardCardActions } from "@/components/dashboard-card";
import { JobCard } from "@/components/job-card";
import { FilterBar, type FilterTab, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";

const STATUS_TABS: FilterTab<"all" | "active" | "completed" | "archive">[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "archive", label: "Archive" },
];

type StatusKey = (typeof STATUS_TABS)[number]["key"];

function jobMatchesStatus(job: Job, status: StatusKey) {
  if (status === "all") return true;
  if (status === "active") return job.status === "active";
  if (status === "completed") return job.status === "completed";
  return job.status === "archived";
}

const SORTS: SortOption<"recent" | "name" | "client" | "modified">[] = [
  { key: "modified", label: "Last modified" },
  { key: "recent", label: "Most recent" },
  { key: "name", label: "Name (A–Z)" },
  { key: "client", label: "Client (A–Z)" },
];

type SortKey = (typeof SORTS)[number]["key"];

function liveTime(job: Job): number {
  return job.liveAt ? Date.parse(`${job.liveAt.date}T00:00:00Z`) : 0;
}

/** Formats an ISO datetime (e.g. Firestore's updatedAt) using the date-only formatter. */
function updatedDate(iso: string | null | undefined): string {
  return longDate(iso?.slice(0, 10));
}

export function JobsTable({ jobs }: { jobs: Job[] }) {
  const [status, setStatus] = useState<StatusKey>("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("modified");
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
      if (sort === "modified") return byLastModified(a, b);
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
                  <JobCard
                    job={job}
                    admin
                    actions={<DashboardCardActions collection="jobs" slug={job.slug} titleField="title" title={jobTitle(job)} />}
                  />
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
                    <ClickableTableRow key={job.slug} href={jobHref(job.slug, true)} label={`Open job ${jobTitle(job)}`}>
                      <TableCell className="px-4 py-4 font-semibold">
                        <Link href={jobHref(job.slug, true)} className="text-foreground no-underline hover:text-primary focus-visible:text-primary">
                          {jobTitle(job)}
                        </Link>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-muted-foreground">{job.clientName}</TableCell>
                      <TableCell className="px-4 py-4"><Badge tone={job.status === "active" ? "active" : "neutral"}>{JOB_STATUS_LABELS[job.status]}</Badge></TableCell>
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
