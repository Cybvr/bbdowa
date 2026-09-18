import type { Metadata } from "next";
import { CREATORS, TEAM, creatorHref, userHref } from "@/lib/users";
import { UserGraph, type GraphLink, type GraphNode } from "@/components/user-graph";
import { PageHeader } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Users graph" };

const IGNORED_COMPANIES = new Set(["Freelance", "Independent"]);

function buildGraph(): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [{ id: "root", label: "BBDO WA", kind: "root" }];
  const links: GraphLink[] = [];

  const departments = [...new Set(TEAM.map((member) => member.department))];
  for (const department of departments) {
    nodes.push({ id: `dept:${department}`, label: department, kind: "department" });
    links.push({ source: "root", target: `dept:${department}` });
  }
  for (const member of TEAM) {
    nodes.push({ id: member.slug, label: member.name, kind: "team", href: userHref(member) });
    links.push({ source: member.slug, target: `dept:${member.department}` });
  }

  const categories = [...new Set(CREATORS.map((creator) => creator.category))];
  for (const category of categories) {
    nodes.push({ id: `cat:${category}`, label: category, kind: "category" });
    links.push({ source: "root", target: `cat:${category}` });
  }

  const companies = new Map<string, string>();
  for (const creator of CREATORS) {
    nodes.push({ id: creator.slug, label: creator.name, kind: "creator", href: creatorHref(creator.slug) });
    links.push({ source: creator.slug, target: `cat:${creator.category}` });
    const seen = new Set<string>();
    for (const job of creator.workHistory ?? []) {
      const company = job.company.trim();
      if (IGNORED_COMPANIES.has(company) || seen.has(company)) continue;
      seen.add(company);
      if (!companies.has(company)) {
        const id = `co:${company}`;
        companies.set(company, id);
        nodes.push({ id, label: company, kind: "company" });
      }
      links.push({ source: creator.slug, target: companies.get(company)! });
    }
  }

  return { nodes, links };
}

export default function UsersGraphPage() {
  const { nodes, links } = buildGraph();
  const userCount = TEAM.length + CREATORS.length;

  return (
    <main className="flex min-h-[calc(100vh-0px)] flex-1 flex-col px-5 pb-10 pt-8 sm:px-8">
      <PageHeader title="Graph" meta={`${userCount} users · click a node to open a profile`} />
      <div className="mt-6 min-h-[520px] flex-1 overflow-hidden rounded-xl border border-border bg-background">
        <UserGraph nodes={nodes} links={links} />
      </div>
    </main>
  );
}
