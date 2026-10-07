import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminBlogDirectory } from "@/components/admin-blog-directory";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
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
      actions={<Link href="/admin/blog/new" className={LIST_ACTION_CLASS}><Plus aria-hidden="true" className="h-3.5 w-3.5" />New post</Link>}
    >
      <AdminBlogDirectory posts={posts} />
    </DashboardListPage>
  );
}
