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
  | { kind: "link"; label: string; href: string; requiresAuth?: boolean; requiresAdmin?: boolean; hideInSidebar?: boolean }
  | { kind: "menu"; label: string; match: string | string[]; items: DashboardNavLink[]; requiresAuth?: boolean };

export const NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "My profile", href: "/dashboard/me", requiresAuth: true },
  { kind: "link", label: "Home", href: "/dashboard", hideInSidebar: true },
  { kind: "link", label: "Campaigns", href: "/dashboard/campaigns", requiresAuth: true },
  { kind: "link", label: "Clients", href: "/dashboard/clients", requiresAuth: true },
  { kind: "link", label: "Discover", href: "/dashboard/creators" },
  { kind: "link", label: "Tracker", href: "/dashboard/tracker", requiresAuth: true },
  { kind: "link", label: "Njeri", href: "/dashboard/njeri" },
  {
    kind: "menu",
    label: "Resources",
    requiresAuth: true,
    match: ["/dashboard/workflows", "/dashboard/brand", "/dashboard/resources", "/dashboard/about", "/dashboard/careers", "/dashboard/people"],
    items: [
      { label: "Agency workflow", href: "/dashboard/workflows/agency" },
      { label: "Pitch workflow", href: "/dashboard/workflows/pitch" },
      { label: "Brand assets", href: "/dashboard/brand" },
      { label: "Resources", href: "/dashboard/resources" },
      { label: "About", href: "/dashboard/about" },
      { label: "Careers", href: "/dashboard/careers" },
      { label: "Team", href: "/dashboard/people" },
    ],
  },
  { kind: "link", label: "Updates", href: "/dashboard/blog" },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Overview", href: "/admin" },
  { kind: "link", label: "Users", href: "/admin/users" },
  { kind: "link", label: "Contracts", href: "/admin/contracts" },
  { kind: "link", label: "Documents", href: "/admin/contract-templates" },
];
