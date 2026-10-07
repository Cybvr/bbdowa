export const BLOG_CATEGORIES = ["News", "People", "Work", "Industry", "Challenges"] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  publishedAt: string;
  category: BlogCategory;
  sourceName?: string;
  image?: string | null;
  sourceUrl?: string;
};
