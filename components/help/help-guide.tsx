"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Briefcase, File, FolderOpen, Info, LayoutGrid, Palette, Search, Users, Workflow } from "lucide-react";
import { plural } from "@/lib/format";

export type HelpArticle = { title: string; section: string; href: string };
export type HelpSection = { key: string; label: string; count: number };

const ICONS: Record<string, ReactNode> = {
  general: <LayoutGrid className="h-6 w-6" aria-hidden="true" />,
  workflows: <Workflow className="h-6 w-6" aria-hidden="true" />,
  team: <Users className="h-6 w-6" aria-hidden="true" />,
  resources: <FolderOpen className="h-6 w-6" aria-hidden="true" />,
  brand: <Palette className="h-6 w-6" aria-hidden="true" />,
  about: <Info className="h-6 w-6" aria-hidden="true" />,
  careers: <Briefcase className="h-6 w-6" aria-hidden="true" />,
};

function ArticleList({ articles }: { articles: HelpArticle[] }) {
  return (
    <ul className="m-0 list-none divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background p-0">
      {articles.map((article) => (
        <li key={`${article.section}-${article.title}`}>
          <Link href={article.href} className="flex items-center gap-4 px-6 py-5 text-foreground no-underline transition hover:bg-muted/40">
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
      <header className="py-10 text-center">
        <h1 className="m-0 text-page-title-lg font-bold tracking-tight">Help Guide</h1>
        <p className="m-0 mt-3 text-body text-muted-foreground">Find answers and learn how to use each section.</p>
        <label className="mx-auto mt-8 flex h-16 max-w-3xl items-center gap-4 rounded-2xl border border-border bg-background px-6">
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
            <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {sections.map((section) => (
                <li key={section.key}>
                  <Link href={`/dashboard/help?tab=${section.key}`} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-6 text-foreground no-underline transition hover:border-foreground/30">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-muted">{ICONS[section.key]}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-item-title font-semibold">{section.label}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{plural(section.count, "article")}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <h2 className="m-0 mb-4 text-item-title font-semibold">Popular articles</h2>
            <ArticleList articles={popular} />
          </section>
        </>
      )}
    </div>
  );
}
