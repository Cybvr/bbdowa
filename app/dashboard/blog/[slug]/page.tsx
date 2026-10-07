import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BlogActions } from "@/components/blog-actions";
import { BlogMedia } from "@/components/blog-media";
import { PageHeader } from "@/components/dashboard/ui";
import { RichTextContent } from "@/components/rich-text-editor";
import { formatBlogDate } from "@/lib/blog-dates";
import { getBlogMediaType } from "@/lib/blog";
import { getBlogPostBySlug } from "@/lib/firebase/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  return { title: post?.title ?? "Post not found", description: post?.excerpt };
}

export default async function BlogEntryPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8">
      <Link href="/dashboard/blog" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />All blog posts
      </Link>
      <div className="max-w-4xl">
        <PageHeader title={post.title} />
        <p className="mb-0 mt-3 text-sm text-muted-foreground">
          <Link href={`/dashboard/blog?category=${encodeURIComponent(post.category)}`} className="text-foreground underline-offset-4 hover:underline">{post.category}</Link>
          {" · "}{formatBlogDate(post.publishedAt)}
        </p>
        <BlogActions post={post} />
        {post.image ? (
          <BlogMedia
            src={post.image}
            type={getBlogMediaType(post)}
            alt={`${post.title} cover`}
            className="mt-8 max-h-[560px] w-full"
            mediaClassName="max-h-[560px] w-full object-cover"
            controls={getBlogMediaType(post) === "video"}
          />
        ) : null}
        <article className="mt-8 max-w-[70ch] text-[16px] leading-[1.7] text-foreground">
          <RichTextContent value={post.content || post.excerpt} />
        </article>
      </div>
    </main>
  );
}
