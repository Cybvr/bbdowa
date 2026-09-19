export type NavLink = { label: string; href: string };

export type DashboardNavLink = NavLink & { requiresAuth?: boolean };

export const MARKETING_NAV: NavLink[] = [
  { label: "The Work", href: "/#work" },
  { label: "About", href: "/about" },
  { label: "Clients", href: "/clients" },
  { label: "The Plug", href: "/the-plug" },
  { label: "Contact", href: "/contact" },
];

export const MARKETING_FOOTER_LINKS: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Work", href: "/#work" },
  { label: "The Plug", href: "/the-plug" },
  { label: "Contact", href: "/contact" },
];

export type NavItem =
  | { kind: "link"; label: string; href: string; requiresAuth?: boolean }
  | { kind: "menu"; label: string; match: string | string[]; items: DashboardNavLink[]; requiresAuth?: boolean };

export const NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Home", href: "/dashboard" },
  { kind: "link", label: "Time", href: "/dashboard/time", requiresAuth: true },
  { kind: "link", label: "Campaigns", href: "/dashboard/campaigns", requiresAuth: true },
  {
    kind: "menu",
    label: "Workflows",
    requiresAuth: true,
    match: "/dashboard/workflows",
    items: [
      { label: "Agency", href: "/dashboard/workflows/agency" },
      { label: "Pitch", href: "/dashboard/workflows/pitch" },
    ],
  },
  {
    kind: "menu",
    label: "Assets",
    requiresAuth: true,
    match: ["/dashboard/brand", "/dashboard/resources"],
    items: [
      { label: "Brand assets", href: "/dashboard/brand" },
      { label: "Resources", href: "/dashboard/resources" },
    ],
  },
  {
    kind: "menu",
    label: "Directory",
    match: ["/dashboard/clients", "/dashboard/people", "/dashboard/creators"],
    items: [
      { label: "Clients", href: "/dashboard/clients", requiresAuth: true },
      { label: "Team", href: "/dashboard/people", requiresAuth: true },
      { label: "Creators", href: "/dashboard/creators" },
    ],
  },
  { kind: "link", label: "Updates", href: "/dashboard/blog" },
  {
    kind: "menu",
    label: "Company",
    match: ["/dashboard/about", "/dashboard/careers"],
    items: [
      { label: "About", href: "/dashboard/about" },
      { label: "Careers", href: "/dashboard/careers" },
    ],
  },
];
