import type { Metadata } from "next";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { UpdatesDirectory } from "@/components/updates-directory";
import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/blog";
import { getBlogPosts } from "@/lib/firebase/content";

export const metadata: Metadata = { title: "Blog" };

type Props = { searchParams: Promise<{ category?: string }> };

export default async function BlogPage({ searchParams }: Props) {
  const { category: requestedCategory } = await searchParams;
  const category: BlogCategory | "all" = BLOG_CATEGORIES.find((value) => value === requestedCategory) ?? "all";
  const posts = await getBlogPosts();

  return (
    <DashboardListPage title="Blog">
      <UpdatesDirectory key={category} posts={posts} initialCategory={category} />
    </DashboardListPage>
  );
}
