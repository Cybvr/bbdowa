import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/firebase/content";
import { BackLink } from "@/components/back-link";
import { Panel, SectionHeading } from "@/components/dashboard/ui";
import { BlogActions } from "@/components/blog-actions";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Blog entry not found" };
  return { title: post.title, description: post.excerpt };
}

function formatBlogDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!month) return String(year);

  const date = new Date(Date.UTC(year, month - 1, day || 1));
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    ...(day ? { day: "numeric" as const } : {}),
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function BlogEntryPage({ params }: Params) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = (await getBlogPosts()).filter((entry) => entry.slug !== post.slug).slice(0, 3);

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <BackLink href="/dashboard/blog">All updates</BackLink>
        <BlogActions post={post} />
      </div>

      <article>
        <header className="border-b border-border pb-6">
          <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-medium">
            <span className="text-primary">{post.category}</span>
            <span className="text-muted-foreground">{formatBlogDate(post.publishedAt)}</span>
          </div>
          <h1 className="m-0 max-w-[24ch] text-[26px] font-bold leading-tight tracking-tight sm:text-[34px]">
            {post.title}
          </h1>
        </header>

        <Panel className="mt-8">
          <p className="m-0 max-w-[68ch] text-[17px] leading-[1.5]">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
            <span className="text-[12px] font-medium text-muted-foreground">Source: {post.sourceName}</span>
            {post.sourceUrl ? (
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center rounded-lg bg-primary px-4 text-[13px] font-semibold text-white no-underline hover:bg-primary/90 focus-visible:outline-none"
              >
                Read the full article ↗
              </a>
            ) : null}
          </div>
        </Panel>
      </article>

      <section className="mt-12" aria-labelledby="related-heading">
        <SectionHeading
          id="related-heading"
          action={
            <Link href="/dashboard/blog" className="text-[13px] font-semibold text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary">
              All entries
            </Link>
          }
        >
          Keep reading
        </SectionHeading>
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-3">
          {relatedPosts.map((entry) => (
            <Link
              key={entry.slug}
              href={`/dashboard/blog/${entry.slug}`}
              className="group border-t border-border py-4 text-foreground no-underline"
            >
              <span className="text-[12px] font-medium text-primary">{entry.category}</span>
              <h3 className="mb-0 mt-2 text-[17px] font-semibold leading-tight tracking-tight group-hover:text-primary">
                {entry.title}
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
