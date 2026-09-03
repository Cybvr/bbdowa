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
import { PageHeader, Panel, SectionHeading, StatItem, StatRow, TextLink } from "@/components/dashboard/ui";

export default function HomePage() {
  const latestPosts = BLOG_POSTS.slice(0, 3);
  const liveNow = projectsLiveNow(PROJECTS);
  const dueSoon = projectsDueFrom(PROJECTS, new Date());
  const trackedTargets = projectsWithTrackedTarget(PROJECTS);

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Home" description="Bantaba — our shared home for agency information and working knowledge." />

      <section className="mt-8" aria-labelledby="wins-heading">
        <SectionHeading id="wins-heading">This month</SectionHeading>
        <StatRow>
          <StatItem
            label="Live now"
            value={liveNow.length}
            detail={liveNow.length > 0 ? liveNow.map((project) => project.name).join(", ") : "No campaigns are live yet"}
          />
          <StatItem
            label="Due next"
            value={dueSoon.length}
            detail={
              dueSoon.length > 0 ? (
                <ul className="m-0 list-none space-y-1 p-0">
                  {dueSoon.map((project) => (
                    <li key={project.slug}>
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
                "Nothing scheduled yet"
              )
            }
          />
          <StatItem
            label="Targets tracked"
            value={`${trackedTargets.length}/${PROJECTS.length}`}
            detail={<TextLink href="/dashboard/projects">View projects</TextLink>}
          />
        </StatRow>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3" aria-labelledby="home-introduction">
        <h2 id="home-introduction" className="sr-only">
          BBDO West Africa
        </h2>

        <Panel>
          <SectionHeading>Mission</SectionHeading>
          <p className="m-0 text-[17px] leading-[1.4]">
            Compelling commercial content that drives brand value and grows our clients&apos; businesses.
          </p>
        </Panel>

        <Panel>
          <SectionHeading>Vision</SectionHeading>
          <p className="m-0 text-[15px] leading-[1.5] text-muted-foreground">
            To become the most preferred shapers of choice across the African continent. From Lagos,
            we develop culturally relevant, insightful and effective campaigns across the West African
            sub-region, in the BBDO tradition of The Work, The Work, The Work.
          </p>
        </Panel>

        <Panel>
          <SectionHeading action={<TextLink href="/dashboard/blog">All updates</TextLink>}>
            Latest updates
          </SectionHeading>
          <ul className="m-0 list-none space-y-3 p-0">
            {latestPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/dashboard/blog/${post.slug}`}
                  className="group flex items-start justify-between gap-5 text-foreground no-underline"
                >
                  <span className="text-[14px] font-semibold leading-[1.3] group-hover:text-primary">
                    {post.title}
                  </span>
                  <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground">{post.publishedAt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </main>
  );
}
