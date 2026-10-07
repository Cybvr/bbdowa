import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getBlogPosts } from "@/lib/firebase/content";
import { formatBlogDate } from "@/lib/blog-dates";
import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Agency announcements, work and ideas from around BBDO West Africa.",
};

type Props = { searchParams: Promise<{ category?: string }> };
const BLOG_FILTERS: { value?: BlogCategory; label: string }[] = [
  { label: "All posts" },
  ...BLOG_CATEGORIES.filter((value) => value !== "Challenges").map((value) => ({ value, label: value })),
];

export default async function BlogPage({ searchParams }: Props) {
  const { category: requestedCategory } = await searchParams;
  if (requestedCategory === "Challenges") notFound();
  const category = BLOG_CATEGORIES.find((value) => value === requestedCategory);
  const posts = (await getBlogPosts())
    .filter((post) => post.category !== "Challenges" && (!category || post.category === category))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="bg-primary px-[clamp(20px,5vw,72px)] pb-[clamp(48px,8vw,112px)] pt-[clamp(52px,8vw,112px)] text-white">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-white/75">Blog</p>
          <h1 className="mt-10 max-w-[10ch] text-[clamp(64px,15vw,208px)] uppercase leading-[0.82] tracking-[-0.06em]">
            {category ? `${category}.` : "The latest."}
          </h1>
        </section>

        <section className="px-[clamp(20px,5vw,72px)] py-[clamp(56px,9vw,128px)]">
          <nav aria-label="Blog categories" className="mb-10 flex flex-wrap gap-x-6 gap-y-3 border-b border-border">
            {BLOG_FILTERS.map((option) => (
              <Link
                key={option.value ?? "all"}
                href={option.value ? `/blog?category=${encodeURIComponent(option.value)}` : "/blog"}
                aria-current={category === option.value ? "page" : undefined}
                className={`border-b-2 pb-3 text-[14px] font-medium no-underline transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${category === option.value ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              >
                {option.label}
              </Link>
            ))}
          </nav>
          {posts.length > 0 ? (
            <ul className="m-0 list-none border-t border-foreground p-0">
              {posts.map((post) => (
                <li key={post.slug} className="border-b border-foreground">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group grid grid-cols-[minmax(0,160px)_minmax(0,1fr)_auto] items-baseline gap-x-[clamp(20px,4vw,56px)] gap-y-2 py-6 text-foreground no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary max-[760px]:grid-cols-1"
                  >
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {post.category} · {formatBlogDate(post.publishedAt)}
                    </span>
                    <span className="text-[clamp(22px,2.6vw,34px)] uppercase leading-[0.95] tracking-[-0.03em] group-hover:text-primary">
                      {post.title}
                    </span>
                    <span aria-hidden="true" className="text-[20px] group-hover:text-primary max-[760px]:hidden">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[18px]">{category ? `No ${category.toLowerCase()} posts yet.` : "No posts yet."}</p>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
