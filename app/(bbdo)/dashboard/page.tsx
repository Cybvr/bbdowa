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
import {
  NAV_ICON_SET,
  type NavIconComponent,
} from "@/components/nav-icons";

type ActionTile = {
  label: string;
  href: string;
  description: string;
  Icon: NavIconComponent;
};

const ACTIONS: ActionTile[] = [
  { label: "Projects", href: "/dashboard/projects", description: "Live campaigns and targets", Icon: NAV_ICON_SET.Projects },
  { label: "Products", href: "/dashboard/products", description: "Client brands and lines", Icon: NAV_ICON_SET.Products },
  { label: "Workflows", href: "/dashboard/workflows/agency", description: "Agency and pitch playbooks", Icon: NAV_ICON_SET.Workflows },
  { label: "Assets", href: "/dashboard/brand", description: "Brand kit and resources", Icon: NAV_ICON_SET.Assets },
  { label: "Directory", href: "/dashboard/people", description: "Team and creators", Icon: NAV_ICON_SET.Directory },
  { label: "Updates", href: "/dashboard/blog", description: "Latest agency news", Icon: NAV_ICON_SET.Updates },
  { label: "Careers", href: "/dashboard/careers", description: "Open roles and referrals", Icon: NAV_ICON_SET.Careers },
  { label: "About", href: "/dashboard/about", description: "Who we are and how we work", Icon: NAV_ICON_SET.About },
];

export default function HomePage() {
  const latestPosts = BLOG_POSTS.slice(0, 3);
  const liveNow = projectsLiveNow(PROJECTS);
  const dueSoon = projectsDueFrom(PROJECTS, new Date());
  const trackedTargets = projectsWithTrackedTarget(PROJECTS);

  return (
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-20 pt-[clamp(30px,4vw,56px)]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-foreground pb-5">
        <h1 className="m-0 text-[clamp(32px,4vw,58px)] uppercase leading-[0.95] tracking-[-0.045em]">
          Home
        </h1>
        <p className="m-0 max-w-[44ch] text-[14px] leading-[1.4] text-muted-foreground">
          Bantaba, our shared home for agency knowledge.{" "}
          <Link
            href="/dashboard/about"
            className="text-foreground underline underline-offset-4 hover:text-primary focus-visible:text-primary"
          >
            About us
          </Link>
        </p>
      </div>

      <section
        className="grid grid-cols-3 gap-4 border-t-2 border-foreground py-[clamp(24px,4vw,44px)] max-[720px]:grid-cols-1"
        aria-labelledby="wins-heading"
      >
        <h2 id="wins-heading" className="sr-only">
          This month
        </h2>
        <Link
          href="/dashboard/projects"
          className="group flex flex-col gap-[7px] border-2 border-foreground bg-white p-[clamp(16px,2vw,22px)] text-foreground no-underline transition-colors hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
        >
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">Live now</span>
          <strong className="text-[clamp(30px,3.6vw,48px)] leading-none tracking-[-0.03em]">{liveNow.length}</strong>
          <span className="text-[13px] leading-[1.35] text-muted-foreground group-hover:text-background/70 group-focus-visible:text-background/70">
            {liveNow.length > 0 ? liveNow.map((project) => project.name).join(", ") : "No campaigns are live yet"}
          </span>
        </Link>
        <div className="flex flex-col gap-[7px] border-2 border-foreground bg-white p-[clamp(16px,2vw,22px)]">
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
        <Link
          href="/dashboard/projects"
          className="group flex flex-col gap-[7px] border-2 border-foreground bg-white p-[clamp(16px,2vw,22px)] text-foreground no-underline transition-colors hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
        >
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">Targets tracked</span>
          <strong className="text-[clamp(30px,3.6vw,48px)] leading-none tracking-[-0.03em]">
            {trackedTargets.length}/{PROJECTS.length}
          </strong>
          <span className="text-[13px] text-muted-foreground underline underline-offset-4 group-hover:text-background/70 group-focus-visible:text-background/70">
            View projects
          </span>
        </Link>
      </section>

      <section className="border-t-2 border-foreground py-[clamp(24px,4vw,44px)]" aria-labelledby="jump-in">
        <h2 id="jump-in" className="m-0 mb-6 text-[12px] uppercase tracking-[0.14em] text-primary">
          Jump in
        </h2>
        <ul className="m-0 grid list-none grid-cols-4 gap-4 p-0 max-[900px]:grid-cols-3 max-[620px]:grid-cols-2">
          {ACTIONS.map(({ label, href, description, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-3 border-2 border-foreground bg-white p-[clamp(16px,2vw,22px)] text-foreground no-underline transition-colors hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
              >
                <Icon className="h-8 w-8 shrink-0" />
                <span className="mt-2 text-[16px] font-extrabold uppercase tracking-[0.04em] leading-none">
                  {label}
                </span>
                <span className="text-[12px] leading-[1.35] text-muted-foreground group-hover:text-background/70 group-focus-visible:text-background/70">
                  {description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t-2 border-foreground py-[clamp(24px,4vw,44px)]" aria-labelledby="latest-news">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="latest-news" className="m-0 text-[12px] uppercase tracking-[0.14em] text-primary">
            Latest updates
          </h2>
          <Link
            href="/dashboard/blog"
            className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-foreground underline underline-offset-4 hover:text-primary focus-visible:text-primary"
          >
            All updates
          </Link>
        </div>
        <ul className="m-0 mt-4 grid list-none grid-cols-3 gap-x-[clamp(20px,3vw,44px)] border-t border-border p-0 max-[720px]:grid-cols-1">
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
      </section>
    </main>
  );
}
