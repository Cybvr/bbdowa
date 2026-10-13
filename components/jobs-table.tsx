"use client";

import Link from "next/link";
import { Building2, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { JOB_STATUS_LABELS, byLastModified, jobTitle, type Job } from "@/lib/jobs";
import { jobHref, jobModifiedAt } from "@/lib/jobs";
import { plural, updatedDate } from "@/lib/format";
import { Badge, EmptyState } from "@/components/dashboard/ui";
import { DashboardCardActions } from "@/components/dashboard-card";
import { CardGrid, DesktopTable, ListCard, MobileRow, MobileRows, ROW_ICON_ACTION } from "@/components/dashboard/list-card";
import { FilterBar, useListView, type FilterTab, type SortOption } from "@/components/dashboard/filter-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { useAuth } from "@/components/auth-provider";
import { QuickCreate, type CreateType } from "@/components/quick-create";

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

export function JobsTable({ jobs, createType }: { jobs: Job[]; createType?: CreateType }) {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState<StatusKey>("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("modified");
  const [view, setView] = useListView("jobs");

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
        actions={createType ? <QuickCreate type={createType} /> : null}
      />

      <section id="job-panel" aria-label="Jobs">
        {visible.length > 0 ? (
          view === "cards" ? (
            <CardGrid>
              {visible.map((job) => (
                <ListCard
                  key={job.slug}
                  href={jobHref(job, true)}
                  image={job.image}
                  title={jobTitle(job)}
                  subtitle={updatedDate(jobModifiedAt(job))}
                  menu={<DashboardCardActions collection="jobs" slug={job.slug} titleField="title" title={jobTitle(job)} />}
                />
              ))}
            </CardGrid>
          ) : (
            <>
            <MobileRows>
              {visible.map((job) => (
                <MobileRow
                  key={job.slug}
                  href={jobHref(job, true)}
                  image={job.image}
                  title={jobTitle(job)}
                  chip={job.clientName}
                  chipIcon={<Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  detail={[job.category, updatedDate(jobModifiedAt(job))].filter(Boolean).join(" · ")}
                  status={<Badge tone={job.status === "active" ? "active" : "neutral"}>{JOB_STATUS_LABELS[job.status]}</Badge>}
                  actions={<Link href={jobHref(job, true)} aria-label={`View ${jobTitle(job)}`} className={ROW_ICON_ACTION}><Eye className="h-5 w-5" aria-hidden="true" /></Link>}
                  menu={<DashboardCardActions collection="jobs" slug={job.slug} titleField="title" title={jobTitle(job)} triggerClassName={ROW_ICON_ACTION} />}
                />
              ))}
            </MobileRows>
            <DesktopTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Updated</TableHead>
                    {isAdmin ? <TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((job) => (
                    <ClickableTableRow key={job.slug} href={jobHref(job, true)} label={`Open job ${jobTitle(job)}`}>
                      <TableCell className="font-semibold">
                        <Link href={jobHref(job, true)} className="text-foreground no-underline hover:text-primary focus-visible:text-primary">
                          {jobTitle(job)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{job.clientName}</TableCell>
                      <TableCell><Badge tone={job.status === "active" ? "active" : "neutral"}>{JOB_STATUS_LABELS[job.status]}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{job.category}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{updatedDate(jobModifiedAt(job))}</TableCell>
                      {isAdmin ? <TableCell className="w-[1%] whitespace-nowrap text-right" onClick={(event) => event.stopPropagation()}>
                        <DashboardCardActions collection="jobs" slug={job.slug} titleField="title" title={jobTitle(job)} variant="table" />
                      </TableCell> : null}
                    </ClickableTableRow>
                  ))}
                </TableBody>
              </Table>
            </DesktopTable>
            </>
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
