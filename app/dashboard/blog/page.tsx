import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/firebase/content";
import { UpdatesDirectory } from "@/components/updates-directory";
import { PageHeader } from "@/components/dashboard/ui";

export const metadata: Metadata = {
  title: "Updates",
  description: "Agency announcements, work and ideas from around BBDO West Africa.",
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Updates" />
      <UpdatesDirectory posts={posts} />
    </main>
  );
}
