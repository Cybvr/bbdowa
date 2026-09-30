import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/firebase/content";
import { formatBlogDate } from "@/lib/blog-dates";

type Params = { params: Promise<{ slug: string }> };

const LINK = "text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const related = (await getBlogPosts()).filter((entry) => entry.slug !== post.slug).slice(0, 3);

  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="bg-primary px-[clamp(20px,5vw,72px)] pb-[clamp(48px,8vw,112px)] pt-[clamp(52px,8vw,112px)] text-white">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-white/75">
            <Link href="/blog" className="text-white no-underline hover:underline">Blog</Link> · {post.category} · {formatBlogDate(post.publishedAt)}
          </p>
          <h1 className="mt-10 max-w-[18ch] text-[clamp(40px,7vw,104px)] uppercase leading-[0.88] tracking-[-0.05em]">
            {post.title}
          </h1>
        </section>

        <section className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-x-[clamp(28px,8vw,128px)] gap-y-12 px-[clamp(20px,5vw,72px)] py-[clamp(56px,9vw,128px)] max-[820px]:grid-cols-1">
          {post.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image} alt="" className="block h-auto w-full object-cover" />
          ) : (
            <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Source: {post.sourceName}</p>
          )}
          <div className="max-w-[58ch] text-[18px] leading-[1.55]">
            <p className="mt-0">{post.excerpt}</p>
            {post.sourceUrl ? (
              <p className="mt-10">
                <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
                  Read the full article on {post.sourceName} ↗
                </a>
              </p>
            ) : null}
          </div>
        </section>

        {related.length > 0 ? (
          <section className="px-[clamp(20px,5vw,72px)] pb-[clamp(56px,9vw,128px)]" aria-labelledby="related-heading">
            <h2 id="related-heading" className="m-0 font-mono text-[11px] font-normal uppercase tracking-[0.16em] text-muted-foreground">Keep reading</h2>
            <ul className="m-0 mt-6 list-none border-t border-foreground p-0">
              {related.map((entry) => (
                <li key={entry.slug} className="border-b border-foreground py-5">
                  <Link href={`/blog/${entry.slug}`} className={LINK}>{entry.title} ↗</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      <Footer />
    </>
  );
}
