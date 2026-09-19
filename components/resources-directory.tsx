"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Resource } from "@/lib/resources";
import type { SortOption } from "@/components/dashboard/filter-bar";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { EmptyState } from "@/components/dashboard/ui";
import { DashboardCard, DashboardCardActions } from "@/components/dashboard-card";
import { plural } from "@/lib/format";

const SORTS: SortOption<"name" | "group">[] = [
  { key: "name", label: "Name (A–Z)" },
  { key: "group", label: "Group (A–Z)" },
];

export function ResourcesDirectory({ resources }: { resources: Resource[] }) {
  const [group, setGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "group">("name");

  const groupOptions = useMemo(
    () => [
      { value: "all", label: "All groups" },
      ...[...new Set(resources.map((resource) => resource.group))]
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ],
    [resources],
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
      />

      <section id="resources-panel" aria-label="Resources">
        {visible.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Image</th>
                  <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Resource</th>
                  <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Group</th>
                  <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Details</th>
                  <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Link</th>
                  <th className="whitespace-nowrap border-b border-border px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((resource) => (
                  <tr key={resource.slug} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-4">
                      {resource.image ? <img src={resource.image} alt="" className="h-10 w-14 rounded-md object-cover" /> : <span className="text-[12px] text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-4 text-[13px] font-semibold">{resource.label}</td>
                    <td className="px-4 py-4 text-[13px] text-primary">{resource.group}</td>
                    <td className="max-w-[42ch] px-4 py-4 text-[13px] text-muted-foreground">{resource.meta}</td>
                    <td className="px-4 py-4 text-[13px]">
                      {resource.href ? <a href={resource.href} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary focus-visible:text-primary">Open <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="inline-flex"><DashboardCardActions collection="resources" slug={resource.slug} titleField="label" title={resource.label} /></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={resources.length === 0 ? "No resources in Firebase" : "No resources match"} description={resources.length === 0 ? "Push the resource records to Firebase from the admin seed panel." : "Try a different search term or group filter."} />
        )}
      </section>
    </>
  );
}
