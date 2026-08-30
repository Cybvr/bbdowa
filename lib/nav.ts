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
  { label: "Projects", href: "/dashboard/projects" },
  { label: "Careers", href: "/dashboard/careers" },
  { label: "Blog", href: "/dashboard/blog" },
  { label: "Dashboard", href: "/dashboard" },
];

export type NavItem =
  | { kind: "link"; label: string; href: string }
  | { kind: "menu"; label: string; match: string | string[]; items: NavLink[] };

export const NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "Home", href: "/dashboard" },
  { kind: "link", label: "People", href: "/dashboard/people" },
  { kind: "link", label: "Projects", href: "/dashboard/projects" },
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
  { kind: "link", label: "Careers", href: "/dashboard/careers" },
  {
    kind: "menu",
    label: "Resources",
    match: ["/dashboard/resources", "/dashboard/blog"],
    items: [
      { label: "Resources", href: "/dashboard/resources" },
      { label: "Blog", href: "/dashboard/blog" },
    ],
  },
  { kind: "link", label: "About", href: "/dashboard/about" },
];
