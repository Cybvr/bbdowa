export const BLOG_CATEGORIES = ["News", "People", "Work", "Industry", "Challenges"] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogMediaType = "image" | "video";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  publishedAt: string;
  category: BlogCategory;
  sourceName?: string;
  image?: string | null;
  /** The cover asset type. Older posts omit this and are treated as images. */
  mediaType?: BlogMediaType;
  sourceUrl?: string;
  updatedAt?: string;
};

export function getBlogMediaType(post: Pick<BlogPost, "mediaType">): BlogMediaType {
  return post.mediaType === "video" ? "video" : "image";
}
