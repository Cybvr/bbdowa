import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogEditor } from "@/components/blog-editor";
import { getBlogPostBySlug } from "@/lib/firebase/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  return { title: post ? `Edit ${post.title}` : "Post not found" };
}

export default async function EditBlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8"><BlogEditor post={post} /></main>;
}
