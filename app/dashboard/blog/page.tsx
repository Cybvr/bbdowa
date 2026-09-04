import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog";
import { PageHeader, Panel, SectionHeading } from "@/components/dashboard/ui";

export const metadata: Metadata = {
  title: "Updates",
  description: "Agency announcements, work and ideas from around BBDO West Africa.",
};

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

export default function BlogPage() {
  const [featured, ...posts] = BLOG_POSTS;

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Updates" description="News, work and thinking from BBDO West Africa." />

      <section className="mt-8" aria-labelledby="featured-post">
        <Panel className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-medium text-muted-foreground">
              <span className="text-primary">{featured.category}</span>
              <span>{formatBlogDate(featured.publishedAt)}</span>
            </div>
            <h2 id="featured-post" className="m-0 mt-3 max-w-[20ch] text-[24px] font-bold leading-tight tracking-tight sm:text-[28px]">
              {featured.title}
            </h2>
          </div>
          <div className="flex flex-col justify-between gap-4">
            <p className="m-0 text-[15px] leading-[1.45] text-muted-foreground">{featured.excerpt}</p>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 text-[12px] font-medium">
              <span className="text-muted-foreground">{featured.sourceName}</span>
              <Link
                href={`/dashboard/blog/${featured.slug}`}
                className="text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary"
              >
                Read the excerpt ↗
              </Link>
            </div>
          </div>
        </Panel>
      </section>

      <section className="mt-12" aria-labelledby="archive-heading">
        <SectionHeading
          id="archive-heading"
          action={<span className="text-[13px] text-muted-foreground">{posts.length} entries</span>}
        >
          More to read
        </SectionHeading>

        <div>
          {posts.map((post) => (
            <article
              key={post.slug}
              className="grid grid-cols-[minmax(120px,0.35fr)_minmax(0,1fr)_auto] items-start gap-x-6 border-b border-border py-5 max-[640px]:grid-cols-1 max-[640px]:gap-y-2"
            >
              <div>
                <span className="text-[12px] font-medium text-primary">{post.category}</span>
                <p className="mb-0 mt-1 text-[12px] text-muted-foreground">{formatBlogDate(post.publishedAt)}</p>
              </div>
              <div>
                <h3 className="m-0 text-[18px] font-semibold leading-tight tracking-tight">{post.title}</h3>
                <p className="mb-0 mt-2 max-w-[58ch] text-[14px] leading-[1.45] text-muted-foreground">
                  {post.excerpt}
                </p>
              </div>
              <Link
                href={`/dashboard/blog/${post.slug}`}
                className="mt-1 whitespace-nowrap text-[13px] font-semibold text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary max-[640px]:mt-2"
              >
                Open entry ↗
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
