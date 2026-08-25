import { PRODUCTS, productHref } from "./products";

export type NavLink = { label: string; href: string };

export type NavItem =
  | { kind: "link"; label: string; href: string }
  | { kind: "menu"; label: string; match: string | string[]; items: NavLink[] };

export const NAV_ITEMS: NavItem[] = [
  { kind: "link", label: "About", href: "/about" },
  { kind: "link", label: "People", href: "/people" },
  { kind: "link", label: "Careers", href: "/careers" },
  { kind: "link", label: "Projects", href: "/projects" },
  {
    kind: "menu",
    label: "Products",
    match: "/products",
    items: [
      { label: "All Products", href: "/products" },
      ...PRODUCTS.map((product) => ({ label: product.name, href: productHref(product.slug) })),
    ],
  },
  {
    kind: "menu",
    label: "Workflows",
    match: "/workflows",
    items: [
      { label: "Agency", href: "/workflows/agency" },
      { label: "Pitch", href: "/workflows/pitch" },
    ],
  },
  {
    kind: "menu",
    label: "Resources",
    match: ["/resources", "/blog"],
    items: [
      { label: "Resources", href: "/resources" },
      { label: "Blog", href: "/blog" },
    ],
  },
];
