export type BlogCategory = "News" | "People" | "Work" | "Industry";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: BlogCategory;
  sourceName: string;
  image?: string | null;
  sourceUrl?: string;
};
