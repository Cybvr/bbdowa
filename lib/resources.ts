export type Resource = {
  type: "resource";
  slug: string;
  label: string;
  meta: string;
  group: string;
  image: string | null;
  href?: string;
};
