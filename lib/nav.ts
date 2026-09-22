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

/**
 * A pure creator (not also staff) doesn't need the "Creators" directory —
 * they only ever look at their own profile, so swap the nav item for that
 * instead of sending them to browse everyone else.
 */
export function resolveNavItemsForRole(items: NavItem[], role: string | null | undefined): NavItem[] {
  if (role !== "creator") return items;
  return items.map((item) =>
    item.kind === "link" && item.label === "Creators"
      ? { ...item, label: "My profile", href: "/dashboard/settings" }
      : item,
  );
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Overview", href: "/admin" },
  { kind: "link", label: "Users", href: "/admin/users" },
];
