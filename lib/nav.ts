export type NavLink = { label: string; href: string };

export const MARKETING_NAV: NavLink[] = [
  { label: "The Work", href: "/#work" },
  { label: "About", href: "/about" },
  { label: "Clients", href: "/clients" },
  { label: "The Plug", href: "/the-plug" },
  { label: "Contact", href: "/contact" },
];

export const MARKETING_DASHBOARD_LINK: NavLink = {
  label: "Dashboard",
  href: "/dashboard",
};

export const MARKETING_FOOTER_LINKS: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "People", href: "/dashboard/people" },
  { label: "Campaigns", href: "/dashboard/campaigns" },
  { label: "Careers", href: "/dashboard/careers" },
  { label: "Blog", href: "/dashboard/blog" },
  { label: "Dashboard", href: "/dashboard" },
];

export type NavItem =
  | { kind: "link"; label: string; href: string }
  | { kind: "menu"; label: string; match: string | string[]; items: NavLink[] };

export const NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Home", href: "/dashboard" },
  { kind: "link", label: "Clients", href: "/dashboard/clients" },
  { kind: "link", label: "Campaigns", href: "/dashboard/campaigns" },
  { kind: "link", label: "Products", href: "/dashboard/products" },
  {
    kind: "menu",
    label: "Workflows",
    match: "/dashboard/workflows",
    items: [
      { label: "Agency", href: "/dashboard/workflows/agency" },
      { label: "Pitch", href: "/dashboard/workflows/pitch" },
    ],
  },
  {
    kind: "menu",
    label: "Assets",
    match: ["/dashboard/brand", "/dashboard/resources"],
    items: [
      { label: "Brand assets", href: "/dashboard/brand" },
      { label: "Resources", href: "/dashboard/resources" },
    ],
  },
  {
    kind: "menu",
    label: "Directory",
    match: ["/dashboard/people", "/dashboard/creators"],
    items: [
      { label: "Team", href: "/dashboard/people" },
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
