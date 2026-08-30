import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "News, work and ideas from around BBDO West Africa.",
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
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-24 pt-[clamp(30px,4vw,56px)]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-foreground pb-5">
        <h1 className="m-0 text-[clamp(36px,5vw,64px)] uppercase leading-[0.92] tracking-[-0.05em]">
          Blog
        </h1>
        <p className="m-0 max-w-[28ch] text-right text-[13px] font-extrabold uppercase leading-[1.25] tracking-[0.14em] text-muted-foreground max-[620px]:text-left">
          News, work and thinking from BBDO West Africa
        </p>
      </div>

      <section className="mt-[clamp(34px,6vw,76px)]" aria-labelledby="featured-post">
        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] bg-primary text-white max-[760px]:grid-cols-1">
          <div className="flex min-h-[330px] flex-col justify-between border-b border-white/35 p-[clamp(24px,4vw,56px)] max-[760px]:min-h-[280px] max-[760px]:border-r-0">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/75">
              <span>{featured.category}</span>
              <span>{formatBlogDate(featured.publishedAt)}</span>
            </div>
            <h2
              id="featured-post"
              className="m-0 max-w-[18ch] text-[clamp(28px,4vw,46px)] uppercase leading-[0.95] tracking-[-0.04em]"
            >
              {featured.title}
            </h2>
          </div>
          <div className="flex flex-col justify-between border-l border-white/35 p-[clamp(24px,4vw,56px)] max-[760px]:border-l-0">
            <p className="m-0 max-w-[38ch] text-[clamp(18px,2vw,25px)] leading-[1.35] text-white/90">
              {featured.excerpt}
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-white/35 pt-5 text-[11px] font-extrabold uppercase tracking-[0.12em]">
              <span>{featured.sourceName}</span>
              <Link
                href={`/dashboard/blog/${featured.slug}`}
                className="text-white underline underline-offset-4 hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Read the excerpt ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-[clamp(64px,9vw,120px)]" aria-labelledby="archive-heading">
        <div className="flex items-baseline justify-between gap-5 border-b-2 border-foreground pb-4">
          <h2 id="archive-heading" className="m-0 text-[clamp(28px,4vw,54px)] uppercase leading-none tracking-[-0.05em]">
            More to read
          </h2>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            {posts.length} entries
          </span>
        </div>

        <div>
          {posts.map((post, index) => (
            <article
              key={post.slug}
              className="grid grid-cols-[72px_minmax(150px,0.45fr)_minmax(0,1fr)_auto] items-start gap-x-[clamp(18px,3vw,44px)] border-b border-border py-[clamp(22px,3vw,34px)] max-[760px]:grid-cols-[44px_minmax(0,1fr)] max-[760px]:gap-x-4"
            >
              <span className="pt-1 font-mono text-[12px] font-semibold text-primary">0{index + 2}</span>
              <div className="max-[760px]:col-start-2">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-muted-foreground">
                  {post.category}
                </span>
                <p className="mb-0 mt-2 text-[12px] font-extrabold uppercase leading-[1.3] tracking-[0.1em] text-muted-foreground">
                  {formatBlogDate(post.publishedAt)}
                </p>
              </div>
              <div className="max-[760px]:col-span-2 max-[760px]:col-start-2">
                <h3 className="m-0 max-w-[25ch] text-[clamp(24px,3vw,42px)] uppercase leading-[0.95] tracking-[-0.04em]">
                  {post.title}
                </h3>
                <p className="mb-0 mt-4 max-w-[58ch] text-[17px] leading-[1.42] text-muted-foreground">
                  {post.excerpt}
                </p>
              </div>
              <Link
                href={`/dashboard/blog/${post.slug}`}
                className="mt-1 whitespace-nowrap text-[11px] font-extrabold uppercase tracking-[0.12em] text-foreground underline underline-offset-4 hover:text-primary focus-visible:text-primary max-[760px]:col-start-2 max-[760px]:mt-5"
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
