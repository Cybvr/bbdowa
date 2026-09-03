"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Project } from "@/lib/projects";
import { projectHref } from "@/lib/projects";
import { plural } from "@/lib/format";
import { getUserByName, userHref } from "@/lib/users";
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

function liveTime(project: Project): number {
  return project.liveAt ? Date.parse(`${project.liveAt.date}T00:00:00Z`) : 0;
}

const TH =
  "whitespace-nowrap border-b border-border pb-3 pl-0 pr-4 pt-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const TD = "border-b border-border py-4 pl-0 pr-4 align-middle text-[15px] leading-[1.3]";

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = projects.filter((project) => {
      const matchesFilter = filter === "all" || project.status === filter;
      const matchesSearch =
        !query ||
        [project.name, project.client, project.category, project.lead]
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
  }, [projects, filter, search, sort]);

  return (
    <>
      <FilterBar
        panelId="project-panel"
        tabs={FILTERS}
        activeTab={filter}
        onTabChange={setFilter}
        tabsLabel="Filter projects by status"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search projects"
        sortOptions={SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visible.length, "project")}
      />

      <section id="project-panel" role="tabpanel" aria-labelledby={`project-panel-tab-${filter}`}>
        {visible.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={TH}>Project</th>
                  <th className={`${TH} max-[720px]:hidden`}>Client</th>
                  <th className={`${TH} max-[1024px]:hidden`}>Fee</th>
                  <th className={`${TH} max-[1024px]:hidden`}>Target</th>
                  <th className={`${TH} max-[1024px]:hidden`}>Result so far</th>
                  <th className={TH}>Status</th>
                  <th className={`${TH} max-[900px]:hidden`}>Lead</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((project) => {
                  const href = projectHref(project.slug);
                  const leadUser = getUserByName(project.lead);
                  return (
                    <tr
                      key={project.slug}
                      onClick={(event) => {
                        if (!(event.target as HTMLElement).closest("a")) router.push(href);
                      }}
                      className="cursor-pointer transition-colors duration-150 hover:bg-muted/50 focus-within:bg-muted/50 motion-reduce:transition-none"
                    >
                      <td className={TD}>
                        <div className="flex min-w-[280px] items-center gap-3 max-[720px]:min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={project.image}
                            alt={project.imageAlt}
                            width={64}
                            height={64}
                            className="h-11 w-14 flex-none rounded-md bg-muted object-cover"
                          />
                          <div>
                            <Link
                              href={href}
                              className="text-[16px] font-semibold leading-tight text-foreground no-underline hover:text-primary focus-visible:text-primary focus-visible:outline-none"
                            >
                              {project.name}
                            </Link>
                            <span className="mt-[5px] hidden text-[12px] leading-[1.35] text-muted-foreground max-[720px]:block">
                              {project.client} · {project.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={`${TD} max-[720px]:hidden`}>{project.client}</td>
                      <td className={`${TD} max-[1024px]:hidden ${project.fee === "To be confirmed" ? "text-muted-foreground" : ""}`}>
                        {project.fee}
                      </td>
                      <td className={`${TD} max-[1024px]:hidden ${project.target === "To be confirmed" ? "text-muted-foreground" : ""}`}>
                        {project.target}
                      </td>
                      <td className={`${TD} max-[1024px]:hidden ${project.result === "To be confirmed" ? "text-muted-foreground" : ""}`}>
                        {project.result}
                      </td>
                      <td className={TD}>
                        <Badge tone={project.status === "live" ? "active" : "neutral"}>{project.status}</Badge>
                      </td>
                      <td className={`${TD} max-[900px]:hidden`}>
                        {leadUser ? (
                          <Link
                            href={userHref(leadUser)}
                            className="text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary"
                          >
                            {project.lead}
                          </Link>
                        ) : (
                          project.lead || "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No projects match"
            description="Try a different search term, status filter or clear your filters."
          />
        )}
      </section>
    </>
  );
}
