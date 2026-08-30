import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog";

export default function HomePage() {
  const latestPosts = BLOG_POSTS.slice(0, 3);

  return (
    <main className="flex-1">
      <section className="flex min-h-[clamp(150px,22vw,280px)] w-full items-end bg-primary px-[clamp(24px,6vw,96px)] pb-[clamp(24px,4vw,48px)] pt-[clamp(28px,4vw,56px)] text-white">
        <h1 className="m-0 text-[clamp(30px,4vw,52px)] font-semibold leading-none tracking-[-0.045em]">
          Welcome,
        </h1>
      </section>

      <section
        className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(260px,1fr)] gap-x-[clamp(24px,4vw,64px)] px-[clamp(24px,6vw,96px)] py-[clamp(48px,7vw,96px)] max-[820px]:grid-cols-1 max-[820px]:gap-y-0"
        aria-labelledby="home-introduction"
      >
        <h2 id="home-introduction" className="sr-only">
          BBDO West Africa
        </h2>

        <article className="border-t-2 border-foreground py-5 max-[820px]:pb-8">
          <h3 className="m-0 text-[12px] uppercase tracking-[0.14em] text-primary">Mission</h3>
          <p className="mb-0 mt-6 max-w-[20ch] text-[clamp(24px,3vw,40px)] uppercase leading-[1] tracking-[-0.035em]">
            We make work that moves business, culture and people.
          </p>
        </article>

        <article className="border-t-2 border-foreground py-5 max-[820px]:pb-8">
          <h3 className="m-0 text-[12px] uppercase tracking-[0.14em] text-primary">Vision</h3>
          <p className="mb-0 mt-6 max-w-[27ch] text-[clamp(19px,2vw,28px)] leading-[1.32]">
            A Lagos studio connected to the BBDO network, bringing strategy, creative, production
            and social together for brands across the region.
          </p>
        </article>

        <aside className="border-t-2 border-foreground py-5" aria-labelledby="latest-news">
          <div className="flex items-baseline justify-between gap-4">
            <h3 id="latest-news" className="m-0 text-[12px] uppercase tracking-[0.14em] text-primary">
              Latest news
            </h3>
            <Link
              href="/dashboard/blog"
              className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-foreground underline underline-offset-4 hover:text-primary focus-visible:text-primary"
            >
              All posts
            </Link>
          </div>
          <ul className="m-0 mt-4 list-none border-t border-border p-0">
            {latestPosts.map((post) => (
              <li key={post.slug} className="border-b border-border py-4">
                <Link
                  href={`/dashboard/blog/${post.slug}`}
                  className="group flex items-start justify-between gap-5 text-foreground no-underline"
                >
                  <span className="max-w-[28ch] text-[16px] font-semibold leading-[1.18] group-hover:text-primary">
                    {post.title}
                  </span>
                  <span className="shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground">{post.publishedAt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
