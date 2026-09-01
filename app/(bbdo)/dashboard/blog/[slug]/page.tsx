import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPost } from "@/lib/blog";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
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
  const post = getBlogPost(slug);
  if (!post) notFound();

  const relatedPosts = BLOG_POSTS.filter((entry) => entry.slug !== post.slug).slice(0, 3);

  return (
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-24 pt-[clamp(30px,4vw,56px)]">
      <Link
        href="/dashboard/blog"
        className="mb-[clamp(34px,5vw,60px)] inline-flex min-h-[44px] items-center text-[12px] font-extrabold uppercase tracking-[0.1em] text-foreground no-underline before:mr-[9px] before:h-2.5 before:w-[18px] before:bg-primary before:content-[''] before:[clip-path:polygon(35%_0,35%_40%,100%_40%,100%_60%,35%_60%,35%_100%,0_50%)] hover:text-primary focus-visible:outline-none"
      >
        All blog entries
      </Link>

      <article>
        <header className="grid grid-cols-[minmax(0,1.3fr)_minmax(220px,0.7fr)] items-end gap-[clamp(32px,7vw,110px)] border-b-2 border-foreground pb-[clamp(36px,6vw,72px)] max-[760px]:grid-cols-1">
          <div>
            <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">
              <span>{post.category}</span>
              <span className="text-muted-foreground">{formatBlogDate(post.publishedAt)}</span>
            </div>
            <h1 className="m-0 max-w-[18ch] text-[clamp(36px,5vw,64px)] uppercase leading-[0.92] tracking-[-0.05em]">
              {post.title}
            </h1>
          </div>
          <p className="m-0 max-w-[34ch] text-[clamp(20px,2.2vw,29px)] leading-[1.32] text-muted-foreground">
            {post.excerpt}
          </p>
        </header>

        <div className="grid grid-cols-[minmax(150px,0.55fr)_minmax(0,1.45fr)] gap-[clamp(28px,6vw,88px)] border-b border-foreground py-[clamp(42px,7vw,82px)] max-[760px]:grid-cols-1 max-[760px]:gap-5">
          <h2 className="m-0 text-[clamp(22px,2.4vw,34px)] uppercase leading-none tracking-[-0.025em] text-primary">
            The short version
          </h2>
          <div>
            <p className="m-0 max-w-[68ch] text-[clamp(22px,2.5vw,34px)] leading-[1.35]">
              {post.excerpt}
            </p>
            <div className="mt-[clamp(36px,5vw,56px)] flex flex-wrap items-center justify-between gap-5 border-t border-border pt-5">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                Source: {post.sourceName}
              </span>
              {post.sourceUrl ? (
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center bg-primary px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white no-underline hover:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  Read the full article ↗
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      <section className="mt-[clamp(54px,8vw,104px)]" aria-labelledby="related-heading">
        <div className="flex items-baseline justify-between gap-5 border-b border-foreground pb-4">
          <h2 id="related-heading" className="m-0 text-[clamp(28px,4vw,54px)] uppercase leading-none tracking-[-0.05em]">
            Keep reading
          </h2>
          <Link href="/dashboard/blog" className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-foreground underline underline-offset-4 hover:text-primary focus-visible:text-primary">
            All entries
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-x-[clamp(20px,4vw,56px)] max-[760px]:grid-cols-1">
          {relatedPosts.map((entry) => (
            <Link
              key={entry.slug}
              href={`/dashboard/blog/${entry.slug}`}
              className="group border-b border-border py-6 text-foreground no-underline max-[760px]:py-5"
            >
              <span className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-primary">
                {entry.category}
              </span>
              <h3 className="mb-0 mt-3 text-[clamp(22px,2.4vw,32px)] uppercase leading-[0.95] tracking-[-0.035em] group-hover:text-primary">
                {entry.title}
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
