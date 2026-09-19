"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { SortOption, ViewMode } from "@/components/dashboard/filter-bar";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { EmptyState } from "@/components/dashboard/ui";
import { plural } from "@/lib/format";

type Resource = { label: string; meta: string; href?: string };
type ResourceGroup = { title: string; links: Resource[] };

const GROUPS: ResourceGroup[] = [
  {
    title: "BBDO West Africa",
    links: [
      { label: "Website", meta: "bbdowestafrica.com", href: "https://www.bbdowestafrica.com/" },
      { label: "Instagram", meta: "@bbdo_westafrica", href: "https://www.instagram.com/bbdo_westafrica/" },
      { label: "X", meta: "@bbdowestafrica", href: "https://x.com/bbdowestafrica" },
      { label: "Facebook", meta: "BBDOWestAfrica", href: "https://www.facebook.com/BBDOWestAfrica/" },
      { label: "LinkedIn", meta: "BBDO West Africa", href: "https://www.linkedin.com/company/bbdo-west-africa" },
      { label: "YouTube", meta: "Channel", href: "https://www.youtube.com/channel/UCfD-UhFcJtLDmgk-pp2PgOw" },
    ],
  },
  {
    title: "Work and profiles",
    links: [
      {
        label: "Lürzer's Archive profile",
        meta: "Selected work",
        href: "https://www.luerzersarchive.com/profiles/all/bbdo-west-africa-lagos/",
      },
    ],
  },
  {
    title: "Casers Group",
    links: [
      { label: "Website", meta: "casersgroup.com", href: "https://www.casersgroup.com/" },
      { label: "LinkedIn", meta: "Casers Group", href: "https://www.linkedin.com/company/casers-group" },
      {
        label: "Office",
        meta: "Plot 5 Chief Yesufu Abiodun Oniru Road, Victoria Island, Lagos 106104",
        href: "https://www.google.com/maps/search/?api=1&query=Plot+5+Chief+Yesufu+Abiodun+Oniru+Road+Victoria+Island+Lagos+106104",
      },
    ],
  },
  {
    title: "Internal",
    links: [
      {
        label: "Microsoft Teams",
        meta: "Team link",
        href: "https://teams.microsoft.com/l/team/19%3AFC6ZMVMFoEbe1WWMY555j6wfpeaN-olxhL1bmLmnkHg1%40thread.tacv2/conversations?groupId=863aed4a-20d5-4a27-a83b-38c7a6e0dedb&tenantId=6aa7a9a2-4b93-43c4-8311-ec14d3acf30c",
      },
      { label: "Company resources", meta: "Shared drive" },
    ],
  },
];

const SORTS: SortOption<"name" | "group">[] = [
  { key: "name", label: "Name (A–Z)" },
  { key: "group", label: "Group (A–Z)" },
];

export function ResourcesDirectory() {
  const [group, setGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "group">("name");
  const [view, setView] = useState<ViewMode>("cards");

  const resources = useMemo(
    () => GROUPS.flatMap((resourceGroup) => resourceGroup.links.map((resource) => ({ ...resource, group: resourceGroup.title }))),
    [],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = resources.filter((resource) => {
      const matchesGroup = group === "all" || resource.group === group;
      const matchesSearch = !query || [resource.label, resource.meta, resource.group].join(" ").toLowerCase().includes(query);
      return matchesGroup && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "group") return a.group.localeCompare(b.group) || a.label.localeCompare(b.label);
      return a.label.localeCompare(b.label);
    });
  }, [resources, group, search, sort]);

  const groupOptions = [{ value: "all", label: "All groups" }, ...GROUPS.map((resourceGroup) => ({ value: resourceGroup.title, label: resourceGroup.title }))];

  return (
    <>
      <FilterBar
        panelId="resources-panel"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search resources"
        filters={[{ label: "Group", value: group, onChange: setGroup, options: groupOptions }]}
        sortOptions={SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visible.length, "resource")}
        view={view}
        onViewChange={setView}
      />

      <section id="resources-panel" aria-label="Resources">
        {visible.length > 0 ? (
          view === "cards" ? (
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((resource) => (
                <li key={`${resource.group}-${resource.label}`}>
                  {resource.href ? (
                    <a
                      href={resource.href}
                      target="_blank"
                      rel="noopener"
                      className="group flex h-full min-h-[142px] flex-col rounded-xl border border-border bg-background p-4 text-foreground no-underline transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{resource.group}</span>
                      <strong className="mt-3 text-[16px] font-semibold leading-tight group-hover:text-primary">{resource.label}</strong>
                      <span className="mt-auto flex items-end justify-between gap-3 pt-4 text-[13px] text-muted-foreground">
                        <span className="line-clamp-2">{resource.meta}</span>
                        <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </span>
                    </a>
                  ) : (
                    <div className="flex h-full min-h-[142px] flex-col rounded-xl border border-border bg-background p-4 text-muted-foreground">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">{resource.group}</span>
                      <strong className="mt-3 text-[16px] font-semibold leading-tight text-foreground">{resource.label}</strong>
                      <span className="mt-auto flex items-center justify-between gap-3 pt-4 text-[13px]">
                        <span>{resource.meta}</span>
                        <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-foreground">Add link</span>
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Resource</th>
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Group</th>
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Details</th>
                    <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((resource) => (
                    <tr key={`${resource.group}-${resource.label}`} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-4 text-[13px] font-semibold">{resource.label}</td>
                      <td className="px-4 py-4 text-[13px] text-primary">{resource.group}</td>
                      <td className="max-w-[42ch] px-4 py-4 text-[13px] text-muted-foreground">{resource.meta}</td>
                      <td className="px-4 py-4 text-[13px]">
                        {resource.href ? (
                          <a href={resource.href} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary focus-visible:text-primary">
                            Open <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">Add link</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <EmptyState title="No resources match" description="Try a different search term or group filter." />
        )}
      </section>
    </>
  );
}
