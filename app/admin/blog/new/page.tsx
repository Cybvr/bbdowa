import type { Metadata } from "next";
import { BlogEditor } from "@/components/blog-editor";

export const metadata: Metadata = { title: "New blog post" };

export default function NewBlogPostPage() {
  return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8"><BlogEditor /></main>;
}
