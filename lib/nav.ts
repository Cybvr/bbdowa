export type NavLink = { label: string; href: string };

export type DashboardNavLink = NavLink & {
  requiresAuth?: boolean;
  requiresStaff?: boolean;
  requiresAdmin?: boolean;
};

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
  { kind: "link", label: "Jobs", href: "/dashboard/jobs", requiresAuth: true, hideInSidebar: true },
  { kind: "link", label: "My Jobs", href: "/dashboard/my-jobs", requiresAuth: true },
  { kind: "link", label: "My applications", href: "/dashboard/applications", requiresAuth: true },
  { kind: "link", label: "Tracker", href: "/dashboard/tracker", requiresAuth: true },
  { kind: "link", label: "Payments", href: "/dashboard/payments", requiresAuth: true },
  { kind: "link", label: "Njeri", href: "/dashboard/njeri", requiresAuth: true, hideInSidebar: true },
  { kind: "link", label: "Messages", href: "/dashboard/messages", requiresAuth: true, hideInSidebar: true },
  { kind: "link", label: "Notifications", href: "/dashboard/notifications", requiresAuth: true, hideInSidebar: true },
  {
    kind: "menu",
    label: "The Studio",
    requiresAuth: true,
    match: [
      "/dashboard/discover",
      "/dashboard/appraisals",
    ],
    items: [
      { label: "Discover", href: "/dashboard/discover" },
      { label: "Appraisals", href: "/dashboard/appraisals" },
    ],
  },
  { kind: "link", label: "Admin", href: "/admin", requiresAuth: true, requiresStaff: true },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Overview", href: "/admin" },
  {
    kind: "menu",
    label: "Operations",
    match: ["/admin/jobs", "/admin/clients", "/admin/invoices", "/admin/documents"],
    items: [
      { label: "Jobs", href: "/admin/jobs" },
      { label: "Clients", href: "/admin/clients" },
      { label: "Invoices", href: "/admin/invoices" },
      { label: "Documents", href: "/admin/documents" },
    ],
  },
  {
    kind: "menu",
    label: "People",
    match: ["/admin/users", "/admin/appraisals"],
    items: [
      { label: "Users", href: "/admin/users", requiresAdmin: true },
      { label: "Appraisals", href: "/admin/appraisals" },
    ],
  },
  {
    kind: "menu",
    label: "Workflow",
    match: ["/admin/tasks", "/admin/tracker"],
    items: [
      { label: "Tasks", href: "/admin/tasks" },
      { label: "Tracker", href: "/admin/tracker" },
    ],
  },
  {
    kind: "menu",
    label: "Communication",
    match: ["/admin/blog", "/admin/messages", "/admin/notifications"],
    items: [
      { label: "Blog", href: "/admin/blog" },
      { label: "Send message", href: "/admin/messages" },
      { label: "Notifications", href: "/admin/notifications", requiresAdmin: true },
    ],
  },
  { kind: "link", label: "Dashboard", href: "/dashboard" },
];
