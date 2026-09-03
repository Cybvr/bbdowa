import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog";
import {
  PROJECTS,
  projectHref,
  projectLiveDateLabel,
  projectsDueFrom,
  projectsLiveNow,
  projectsWithTrackedTarget,
} from "@/lib/projects";

export default function HomePage() {
  const latestPosts = BLOG_POSTS.slice(0, 3);
  const liveNow = projectsLiveNow(PROJECTS);
  const dueSoon = projectsDueFrom(PROJECTS, new Date());
  const trackedTargets = projectsWithTrackedTarget(PROJECTS);

  return (
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-20 pt-[clamp(30px,4vw,56px)]">
      <div className="mb-[clamp(44px,7vw,84px)] border-b border-foreground pb-5">
        <h1 className="m-0 text-[clamp(32px,4vw,58px)] uppercase leading-[0.95] tracking-[-0.045em]">
          Home
        </h1>
      </div>

      <section aria-labelledby="akwaaba-heading" className="border-t-2 border-foreground py-5">
        <h2 id="akwaaba-heading" className="m-0 text-[12px] uppercase tracking-[0.14em] text-primary">
          Akwaaba
        </h2>
        <p className="mb-0 mt-6 max-w-[30ch] text-[clamp(24px,3vw,40px)] uppercase leading-[1] tracking-[-0.035em]">
          Welcome to Bantaba, our shared home for agency information and working knowledge.
        </p>
        <p className="mb-0 mt-5 max-w-[56ch] text-[17px] leading-[1.4]">
          A bantaba is the traditional gathering place, often a large meeting tree, where community
          members congregate for dialogue, storytelling and collective decision-making. This is
          ours.
        </p>
      </section>

      <section
        className="grid grid-cols-3 border-t-2 border-foreground py-[clamp(24px,4vw,44px)] max-[720px]:grid-cols-1"
        aria-labelledby="wins-heading"
      >
        <h2 id="wins-heading" className="sr-only">
          This month
        </h2>
        <div className="flex flex-col gap-[7px] pr-[clamp(18px,3vw,36px)] max-[720px]:border-b max-[720px]:border-border max-[720px]:py-4">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">Live now</span>
          <strong className="text-[clamp(30px,3.6vw,48px)] leading-none tracking-[-0.03em]">{liveNow.length}</strong>
          <span className="text-[13px] leading-[1.35] text-muted-foreground">
            {liveNow.length > 0 ? liveNow.map((project) => project.name).join(", ") : "No campaigns are live yet"}
          </span>
        </div>
        <div className="flex flex-col gap-[7px] border-l border-border px-[clamp(18px,3vw,36px)] max-[720px]:border-l-0 max-[720px]:border-b max-[720px]:border-b-border max-[720px]:py-4">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">Due next</span>
          {dueSoon.length > 0 ? (
            <ul className="m-0 list-none p-0">
              {dueSoon.map((project) => (
                <li key={project.slug} className="text-[15px] leading-[1.4]">
                  <Link
                    href={projectHref(project.slug)}
                    className="text-foreground no-underline hover:text-primary focus-visible:text-primary"
                  >
                    {project.name}
                  </Link>{" "}
                  <span className="text-muted-foreground">{projectLiveDateLabel(project)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-[13px] leading-[1.35] text-muted-foreground">Nothing scheduled yet</span>
          )}
        </div>
        <div className="flex flex-col gap-[7px] border-l border-border pl-[clamp(18px,3vw,36px)] max-[720px]:border-l-0 max-[720px]:py-4">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">Targets tracked</span>
          <strong className="text-[clamp(30px,3.6vw,48px)] leading-none tracking-[-0.03em]">
            {trackedTargets.length}/{PROJECTS.length}
          </strong>
          <Link
            href="/dashboard/projects"
            className="text-[13px] text-foreground underline underline-offset-4 hover:text-primary focus-visible:text-primary"
          >
            View projects
          </Link>
        </div>
      </section>

      <section
        className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(260px,1fr)] gap-x-[clamp(24px,4vw,64px)] py-[clamp(24px,4vw,56px)] max-[820px]:grid-cols-1 max-[820px]:gap-y-0"
        aria-labelledby="home-introduction"
      >
        <h2 id="home-introduction" className="sr-only">
          BBDO West Africa
        </h2>

        <article className="border-t-2 border-foreground py-5 max-[820px]:pb-8">
          <h3 className="m-0 text-[12px] uppercase tracking-[0.14em] text-primary">Mission</h3>
          <p className="mb-0 mt-6 max-w-[24ch] text-[clamp(24px,3vw,40px)] uppercase leading-[1] tracking-[-0.035em]">
            Compelling commercial content that drives brand value and grows our clients&apos;
            businesses.
          </p>
        </article>

        <article className="border-t-2 border-foreground py-5 max-[820px]:pb-8">
          <h3 className="m-0 text-[12px] uppercase tracking-[0.14em] text-primary">Vision</h3>
          <p className="mb-0 mt-6 max-w-[27ch] text-[clamp(19px,2vw,28px)] leading-[1.32]">
            To become the most preferred shapers of choice across the African continent. From
            Lagos, we develop culturally relevant, insightful and effective campaigns across the
            West African sub-region, in the BBDO tradition of The Work, The Work, The Work.
          </p>
        </article>

        <aside className="border-t-2 border-foreground py-5" aria-labelledby="latest-news">
          <div className="flex items-baseline justify-between gap-4">
            <h3 id="latest-news" className="m-0 text-[12px] uppercase tracking-[0.14em] text-primary">
              Latest updates
            </h3>
            <Link
              href="/dashboard/blog"
              className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-foreground underline underline-offset-4 hover:text-primary focus-visible:text-primary"
            >
              All updates
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
