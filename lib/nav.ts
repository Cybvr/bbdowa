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
  | { kind: "link"; label: string; href: string; requiresAuth?: boolean; requiresAdmin?: boolean }
  | { kind: "menu"; label: string; match: string | string[]; items: DashboardNavLink[]; requiresAuth?: boolean };

export const NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Home", href: "/dashboard" },
  { kind: "link", label: "Campaigns", href: "/dashboard/campaigns", requiresAuth: true },
  { kind: "link", label: "Clients", href: "/dashboard/clients", requiresAuth: true },
  { kind: "link", label: "Creators", href: "/dashboard/creators" },
  { kind: "link", label: "Team", href: "/dashboard/people", requiresAuth: true },
  { kind: "link", label: "Tracker", href: "/dashboard/tracker", requiresAuth: true },
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
  { kind: "link", label: "Admin", href: "/admin", requiresAuth: true, requiresAdmin: true },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Overview", href: "/admin" },
  { kind: "link", label: "Users", href: "/admin/users" },
];
