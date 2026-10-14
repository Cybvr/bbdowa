"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Briefcase, Building2, File, FolderOpen, HelpCircle, Home, Info, LayoutGrid, Search, Users, Workflow } from "lucide-react";
import { plural } from "@/lib/format";

export type HelpArticle = { title: string; section: string; href: string };
export type HelpSection = { key: string; label: string; count: number };

const ICONS: Record<string, ReactNode> = {
  bantaba: <Home className="h-6 w-6" aria-hidden="true" />,
  features: <LayoutGrid className="h-6 w-6" aria-hidden="true" />,
  workflows: <Workflow className="h-6 w-6" aria-hidden="true" />,
  about: <Info className="h-6 w-6" aria-hidden="true" />,
  casers: <Building2 className="h-6 w-6" aria-hidden="true" />,
  team: <Users className="h-6 w-6" aria-hidden="true" />,
  resources: <FolderOpen className="h-6 w-6" aria-hidden="true" />,
  careers: <Briefcase className="h-6 w-6" aria-hidden="true" />,
  faqs: <HelpCircle className="h-6 w-6" aria-hidden="true" />,
};

function ArticleList({ articles }: { articles: HelpArticle[] }) {
  return (
    <ul className="m-0 list-none divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background p-0">
      {articles.map((article) => (
        <li key={`${article.section}-${article.title}`}>
          <Link href={article.href} className="flex items-center gap-3 px-4 py-4 text-foreground sm:gap-4 sm:px-6 sm:py-5 no-underline transition hover:bg-muted/40">
            <File className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-body">{article.title}</span>
            <span className="shrink-0 text-sm text-muted-foreground">{article.section}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The Help landing: search, sections to browse and popular articles. */
export function HelpGuide({ sections, articles, popular }: { sections: HelpSection[]; articles: HelpArticle[]; popular: HelpArticle[] }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const results = query ? articles.filter((article) => `${article.title} ${article.section}`.toLowerCase().includes(query)) : [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="py-6 text-center sm:py-10">
        <h1 className="m-0 text-page-title-lg font-bold tracking-tight">Help Guide</h1>
        <p className="m-0 mt-3 text-body text-muted-foreground">Find answers and learn how to use each section.</p>
        <label className="mx-auto mt-6 flex h-14 max-w-3xl items-center gap-3 rounded-2xl border border-border bg-background px-4 sm:mt-8 sm:h-16 sm:gap-4 sm:px-6">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search help articles" aria-label="Search help articles" className="h-full min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground" />
        </label>
      </header>

      {query ? (
        <section className="mt-6">
          <h2 className="m-0 mb-4 text-item-title font-semibold">{plural(results.length, "result")}</h2>
          {results.length ? <ArticleList articles={results} /> : <p className="m-0 text-sm text-muted-foreground">No articles match.</p>}
        </section>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="m-0 mb-4 text-item-title font-semibold">Browse by section</h2>
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:gap-4 lg:grid-cols-4">
              {sections.map((section) => (
                <li key={section.key} className="min-w-0">
                  <Link href={`/dashboard/help?tab=${section.key}`} className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-background p-4 text-foreground no-underline transition hover:border-foreground/30 sm:flex-row sm:items-center sm:gap-4 sm:p-6">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted sm:h-14 sm:w-14">{ICONS[section.key]}</span>
                    <span className="w-full min-w-0">
                      <span className="block break-words text-item-title font-semibold leading-tight">{section.label}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{plural(section.count, "article")}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 sm:mt-12">
            <h2 className="m-0 mb-4 text-item-title font-semibold">Start here</h2>
            <ArticleList articles={popular} />
          </section>
        </>
      )}
    </div>
  );
}
