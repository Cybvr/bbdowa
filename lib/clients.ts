import { PROJECTS, type Project } from "@/lib/projects";
import { makeEmptyWorkspace, type ClientWorkspace } from "@/lib/client-workspaces";

export type Client = {
  type: "client";
  slug: string;
  name: string;
  /** First live/engagement date; used to sort the clients directory. */
  date: string | null;
  industry: string;
  /** Optional short bio shown on the client page; editable per client. */
  description?: string | null;
  /** Client logo/headshot; null/absent falls back to the placeholder. */
  profileImage?: string | null;
};

/**
 * Clients are their own records. A project belongs to one client
 * via its `clientId`; an client "has" the projects that point at
 * it (see `getClientProjects`). Edit an client here without
 * touching its projects, and vice versa.
 */
export const CLIENTS: Client[] = [
  {
    type: "client",
    slug: "1utility",
    name: "1 Utility Bank",
    date: "2026-08-19",
    industry: "Finance",
    profileImage: "/images/one-utility-logo.svg",
  },
  {
    type: "client",
    slug: "benin-tourism",
    name: "Benin Tourism",
    date: "2026-05-15",
    industry: "Travel & tourism",
    profileImage: "/images/clients/benin-tourism.png",
  },
  {
    type: "client",
    slug: "brown-forman",
    name: "Brown-Forman",
    date: "2026-08-01",
    industry: "Food & beverages",
    profileImage: "/images/clients/brown-forman.png",
  },
  {
    type: "client",
    slug: "central-bank-of-nigeria",
    name: "Central Bank of Nigeria",
    date: "2026-08-15",
    industry: "Finance",
    profileImage: "/images/clients/central-bank-of-nigeria.png",
  },
  {
    type: "client",
    slug: "chicken-republic",
    name: "Chicken Republic",
    date: "2020-04-15",
    industry: "Food & beverages",
    profileImage: "/images/clients/chicken-republic.png",
  },
  {
    type: "client",
    slug: "diageo",
    name: "Diageo",
    date: "2021-07-15",
    industry: "Food & beverages",
    profileImage: "/images/clients/diageo.png",
  },
  {
    type: "client",
    slug: "google",
    name: "Google",
    date: "2020-06-15",
    industry: "Technology",
    profileImage: "/images/clients/google.png",
  },
  {
    type: "client",
    slug: "interswitch",
    name: "Interswitch",
    date: "2021-04-15",
    industry: "Finance",
    profileImage: "/images/clients/interswitch.png",
  },
  {
    type: "client",
    slug: "keizen-games",
    name: "Keizen Games",
    date: "2026-01-15",
    industry: "Entertainment",
    profileImage: "/images/clients/keizen-games.png",
  },
  {
    type: "client",
    slug: "orijin",
    name: "Orijin",
    date: "2019-09-15",
    industry: "Food & beverages",
    profileImage: "/images/clients/orijin.png",
  },
  {
    type: "client",
    slug: "pringles",
    name: "Pringles",
    date: "2018-07-15",
    industry: "Food & beverages",
    profileImage: "/images/clients/pringles.png",
  },
  {
    type: "client",
    slug: "proforce-nigeria",
    name: "Proforce Nigeria",
    date: "2026-03-15",
    industry: "Defence & manufacturing",
    profileImage: "/images/clients/proforce-nigeria.png",
  },
  {
    type: "client",
    slug: "unilever",
    name: "Unilever",
    date: "2026-02-15",
    industry: "Consumer goods",
    profileImage: "/images/clients/unilever.png",
  },
  {
    type: "client",
    slug: "visa",
    name: "Visa",
    date: "2016-08-05",
    industry: "Finance",
    profileImage: "/images/clients/visa.png",
  },
].sort((a, b) => a.name.localeCompare(b.name));

export function getClient(slug: string): Client | undefined {
  return CLIENTS.find((client) => client.slug === slug);
}

/** The projects that belong to this client. */
export function getClientProjects(slug: string): Project[] {
  return PROJECTS.filter((project) => project.clientId === slug);
}

/**
 * The workspace content for a client. It lives on the client's project
 * (`project.workspace`); clients/projects without curated content get a blank
 * template so nothing leaks in from another client.
 */
export function getClientWorkspace(clientSlug: string, clientName?: string): ClientWorkspace {
  const projects = getClientProjects(clientSlug);
  const withWorkspace = projects.find((project) => project.workspace);
  if (withWorkspace?.workspace) return withWorkspace.workspace;

  const project = projects[0];
  const name = clientName ?? getClient(clientSlug)?.name ?? clientSlug;
  const website = project?.externalLinks?.find((link) => link.label === "Website")?.href ?? "";
  return makeEmptyWorkspace({ clientName: name, category: project?.category ?? "", website });
}

export function clientHref(slug: string): string {
  return `/dashboard/clients/${slug}/overview`;
}
