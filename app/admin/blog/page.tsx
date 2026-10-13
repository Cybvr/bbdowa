import type { Metadata } from "next";
import { AdminBlogDirectory } from "@/components/admin-blog-directory";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { getBlogPosts } from "@/lib/firebase/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Create and manage agency blog posts.",
};

export default async function AdminBlogPage() {
  const posts = await getBlogPosts();

  return (
    <DashboardListPage
      title="Blog"
    >
      <AdminBlogDirectory posts={posts} />
    </DashboardListPage>
  );
}
