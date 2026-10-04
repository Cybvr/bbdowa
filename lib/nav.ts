export type NavLink = { label: string; href: string };

export type DashboardNavLink = NavLink & { requiresAuth?: boolean };

export const MARKETING_NAV: NavLink[] = [
  { label: "The Work", href: "/#work" },
  { label: "About", href: "/about" },
  { label: "Clients", href: "/clients" },
  { label: "The Plug", href: "/the-plug" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export const MARKETING_FOOTER_LINKS: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Work", href: "/#work" },
  { label: "The Plug", href: "/the-plug" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export type NavItem =
  | { kind: "link"; label: string; href: string; requiresAuth?: boolean; requiresStaff?: boolean; requiresAdmin?: boolean; hideInSidebar?: boolean }
  | { kind: "menu"; label: string; match: string | string[]; items: DashboardNavLink[]; requiresAuth?: boolean };

export const NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "My profile", href: "/dashboard/me", requiresAuth: true, hideInSidebar: true },
  { kind: "link", label: "Home", href: "/dashboard" },
  { kind: "link", label: "Jobs", href: "/dashboard/jobs", requiresAuth: true },
  { kind: "link", label: "My Jobs", href: "/dashboard/my-jobs", requiresAuth: true },
  { kind: "link", label: "Tracker", href: "/dashboard/tracker", requiresAuth: true },
  { kind: "link", label: "Payments", href: "/dashboard/payments", requiresAuth: true },
  { kind: "link", label: "Njeri", href: "/dashboard/njeri" },
  { kind: "link", label: "Messages", href: "/dashboard/messages", requiresAuth: true },
  {
    kind: "menu",
    label: "The Studio",
    requiresAuth: true,
    match: [
      "/dashboard/clients",
      "/dashboard/discover",
      "/dashboard/workflows",
      "/dashboard/brand",
      "/dashboard/resources",
      "/dashboard/people",
    ],
    items: [
      { label: "Discover", href: "/dashboard/discover" },
      { label: "Clients", href: "/dashboard/clients" },
      { label: "Workflows", href: "/dashboard/workflows" },
      { label: "Brand assets", href: "/dashboard/brand" },
      { label: "Resources", href: "/dashboard/resources" },
      { label: "Team", href: "/dashboard/people" },
    ],
  },
  { kind: "link", label: "Admin", href: "/admin", requiresAuth: true, requiresStaff: true, hideInSidebar: true },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Overview", href: "/admin" },
  { kind: "link", label: "Users", href: "/admin/users", requiresAdmin: true },
  { kind: "link", label: "Jobs", href: "/admin/jobs" },
  { kind: "link", label: "Documents", href: "/admin/documents" },
  { kind: "link", label: "Tasks", href: "/admin/tasks" },
  { kind: "link", label: "Dashboard", href: "/dashboard" },
];
