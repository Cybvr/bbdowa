import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS, getProject } from "@/lib/projects";
import { getUserByName, userHref } from "@/lib/users";
import { BackLink } from "@/components/back-link";
import { Badge, MetaGrid, MetaItem, SectionHeading } from "@/components/dashboard/ui";
import Link from "next/link";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found" };
  return { title: project.name, description: project.summary };
}

const SECTION = "border-b border-border py-6";
const BODY = "m-0 max-w-[70ch] text-[15px] leading-[1.55]";

export default async function ProjectDetailPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const provisional = project.placeholder ? "text-muted-foreground" : "";
  const leadUser = getUserByName(project.lead);

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <BackLink href="/dashboard/projects" className="mb-5">
        All projects
      </BackLink>

      <section
        className="grid grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)] items-start gap-8 lg:gap-12 max-[720px]:grid-cols-1"
        aria-labelledby="project-name"
      >
        <div className="relative aspect-[4/3] max-w-[440px] overflow-hidden rounded-xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.image} alt={project.imageAlt} className="block h-full w-full object-cover" />
        </div>
        <div>
          <Badge tone={project.status === "live" ? "active" : "neutral"}>{project.status}</Badge>
          <h1 id="project-name" className="m-0 mt-3 max-w-[20ch] text-[28px] font-bold leading-tight tracking-tight sm:text-[36px]">
            {project.name}
          </h1>
          <p className="mb-0 mt-3 max-w-[60ch] text-[16px] leading-[1.45] text-muted-foreground">
            {project.summary}
          </p>
        </div>
      </section>

      {project.media.length > 0 && (
        <section className="mt-10 border-t border-border pt-6" aria-labelledby="project-media">
          <SectionHeading
            id="project-media"
            action={
              <span className="text-[12px] text-muted-foreground">
                {project.media.length} {project.media.length === 1 ? "asset" : "assets"}
              </span>
            }
          >
            Project media
          </SectionHeading>
          <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
            {project.media.map((media) =>
              media.kind === "video" ? (
                <video
                  key={media.src}
                  className="block aspect-video h-full w-full rounded-xl bg-muted object-cover"
                  controls
                  preload="metadata"
                  poster={media.poster}
                  aria-label={media.alt}
                >
                  <source src={media.src} type="video/mp4" />
                  Your browser does not support this video.
                </video>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={media.src}
                  src={media.src}
                  alt={media.alt}
                  className="block aspect-video h-full w-full rounded-xl bg-muted object-cover"
                />
              ),
            )}
          </div>
        </section>
      )}

      <section className="mt-10" aria-label="Project information">
        <MetaGrid>
          <MetaItem label="Client">{project.client}</MetaItem>
          <MetaItem label="Category">{project.category}</MetaItem>
          <MetaItem label="Project lead">
            <span className={project.lead ? "" : "text-muted-foreground"}>
              {leadUser ? (
                <Link
                  href={userHref(leadUser)}
                  className="text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary"
                >
                  {project.lead}
                </Link>
              ) : (
                project.lead || "To be confirmed"
              )}
            </span>
          </MetaItem>
          <MetaItem label="Fee">
            <span className={project.fee === "To be confirmed" ? "text-muted-foreground" : ""}>{project.fee}</span>
          </MetaItem>
          <MetaItem label="Target">
            <span className={project.target === "To be confirmed" ? "text-muted-foreground" : ""}>{project.target}</span>
          </MetaItem>
          <MetaItem label="Result so far">
            <span className={project.result === "To be confirmed" ? "text-muted-foreground" : ""}>{project.result}</span>
          </MetaItem>
        </MetaGrid>
      </section>

      <section className="mt-12" aria-label="Project case study">
        <article className={SECTION}>
          <SectionHeading>Challenge</SectionHeading>
          <p className={`${BODY} ${provisional}`}>{project.challenge}</p>
        </article>
        <article className={SECTION}>
          <SectionHeading>Insight</SectionHeading>
          <p className={`${BODY} ${provisional}`}>{project.insight}</p>
        </article>
        <article className={SECTION}>
          <SectionHeading>Strategy</SectionHeading>
          <p className={`${BODY} ${provisional}`}>{project.strategy}</p>
        </article>
        <article className={SECTION}>
          <SectionHeading>Platform</SectionHeading>
          <ul className="m-0 flex flex-wrap gap-2 p-0 list-none">
            {project.platform.map((channel) => (
              <li
                key={channel}
                className="rounded-md border border-border px-2.5 py-1 text-[13px] font-medium"
              >
                {channel}
              </li>
            ))}
          </ul>
        </article>
        <article className={SECTION}>
          <SectionHeading>Execution</SectionHeading>
          <p className={`${BODY} ${provisional}`}>{project.execution}</p>
        </article>
        <article className={`${SECTION} border-b-0`}>
          <SectionHeading>Outcome</SectionHeading>
          <p className={`${BODY} ${provisional}`}>{project.outcome}</p>
        </article>
      </section>
    </main>
  );
}
