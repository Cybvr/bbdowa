"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Project } from "@/lib/projects";
import { projectHref } from "@/lib/projects";
import { plural } from "@/lib/format";
import { getUserByName, userHref } from "@/lib/users";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "completed", label: "Completed" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const TH =
  "whitespace-nowrap border-b-2 border-foreground pb-3 pl-0 pr-4 pt-3 text-left text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground";
const TD =
  "border-b border-border py-4 pl-0 pr-4 align-middle text-[clamp(15px,1.3vw,18px)] leading-[1.3]";

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");

  const visible =
    filter === "all" ? projects : projects.filter((project) => project.status === filter);

  const move = (index: number) => {
    const next = FILTERS[(index + FILTERS.length) % FILTERS.length];
    setFilter(next.key);
    document.getElementById(`tab-${next.key}`)?.focus();
  };

  return (
    <>
      <div className="my-7 mb-5 flex items-center justify-between gap-6 max-[720px]:flex-col max-[720px]:items-start">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter projects by status">
          {FILTERS.map((tab, index) => {
            const selected = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                id={`tab-${tab.key}`}
                aria-controls="project-panel"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setFilter(tab.key)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    move(index + 1);
                  }
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    move(index - 1);
                  }
                  if (event.key === "Home") {
                    event.preventDefault();
                    move(0);
                  }
                  if (event.key === "End") {
                    event.preventDefault();
                    move(FILTERS.length - 1);
                  }
                }}
                className={`min-h-[44px] cursor-pointer border-2 px-[18px] py-2.5 text-[12px] font-extrabold uppercase tracking-[0.1em] hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none ${
                  selected ? "border-foreground bg-foreground text-white" : "border-foreground bg-transparent text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <p
          aria-live="polite"
          className="m-0 text-[12px] font-extrabold uppercase tracking-[0.14em] text-primary"
        >
          {plural(visible.length, "project")}
        </p>
      </div>

      <section id="project-panel" role="tabpanel" aria-labelledby={`tab-${filter}`}>
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
                      className="cursor-pointer transition-colors duration-150 hover:bg-foreground/5 focus-within:bg-primary/[0.07] motion-reduce:transition-none"
                    >
                      <td className={TD}>
                        <div className="flex min-w-[280px] items-center gap-4 max-[720px]:min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={project.image}
                            alt={project.imageAlt}
                            width={64}
                            height={64}
                            className="h-[44px] w-16 flex-none rounded-[6px] bg-foreground object-cover max-[720px]:h-10 max-[720px]:w-14 max-[720px]:rounded-[5px]"
                          />
                          <div>
                            <Link
                              href={href}
                              className="text-[clamp(20px,2vw,29px)] font-extrabold leading-none tracking-[-0.025em] text-foreground no-underline after:ml-2 after:inline-block after:h-2.5 after:w-[18px] after:bg-primary after:align-middle after:content-[''] after:[clip-path:polygon(0_40%,65%_40%,65%_0,100%_50%,65%_100%,65%_60%,0_60%)] hover:text-primary focus-visible:text-primary focus-visible:outline-none"
                            >
                              {project.name}
                            </Link>
                            <span className="mt-[7px] hidden text-[12px] leading-[1.35] text-muted-foreground max-[720px]:block">
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
                        <span
                          className={`inline-block px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white ${
                            project.status === "live" ? "bg-primary" : "bg-foreground"
                          }`}
                        >
                          {project.status}
                        </span>
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
          <div className="border-b border-border border-t-2 border-t-foreground py-[clamp(52px,8vw,104px)]">
            <h2 className="mb-3.5 mt-0 max-w-[14ch] text-[clamp(32px,5vw,62px)] uppercase leading-[0.96] tracking-[-0.035em]">
              No completed projects yet
            </h2>
            <p className="m-0 max-w-[52ch] text-[18px] leading-[1.45] text-muted-foreground">
              Completed case studies will appear here when their copy and project evidence are ready.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
