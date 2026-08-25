import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS, getProject } from "@/lib/projects";

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

const SECTION = "grid grid-cols-[minmax(150px,0.55fr)_minmax(0,1.45fr)] gap-[clamp(28px,6vw,88px)] border-b border-ink py-[clamp(36px,6vw,72px)] max-[760px]:grid-cols-1 max-[760px]:gap-5";
const SECTION_HEADING =
  "m-0 text-[clamp(22px,2.4vw,34px)] uppercase leading-none tracking-[-0.025em] text-brand";
const BODY = "m-0 max-w-[70ch] text-[clamp(20px,2.1vw,29px)] leading-[1.42]";
const META_LABEL = "text-[11px] font-extrabold uppercase tracking-[0.14em] text-ash";
const META_VALUE = "text-[clamp(18px,1.8vw,24px)] leading-[1.2]";

export default async function ProjectDetailPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const provisional = project.placeholder ? "text-ash" : "";

  return (
    <main className="flex-1 px-[clamp(24px,6vw,96px)] pb-24 pt-[clamp(34px,5vw,68px)]">
      <Link
        href="/projects"
        className="mb-[26px] inline-flex min-h-[44px] items-center text-[12px] font-extrabold uppercase tracking-[0.1em] text-ink no-underline before:mr-[9px] before:h-2.5 before:w-[18px] before:bg-brand before:content-[''] before:[clip-path:polygon(35%_0,35%_40%,100%_40%,100%_60%,35%_60%,35%_100%,0_50%)] hover:text-brand focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-brand"
      >
        All projects
      </Link>

      <section
        className="grid grid-cols-[minmax(260px,0.82fr)_minmax(0,1.35fr)] items-end gap-[clamp(34px,6vw,88px)] max-[760px]:grid-cols-1 max-[760px]:items-start"
        aria-labelledby="project-name"
      >
        <div className="relative aspect-[4/3] max-w-[560px] overflow-hidden rounded-lg bg-ink max-[760px]:w-[min(100%,460px)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt={project.imageAlt}
            className="block h-full w-full object-cover"
          />
        </div>
        <div className="pb-1">
          <span
            className={`mb-5 inline-block px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white ${
              project.status === "live" ? "bg-brand" : "bg-ink"
            }`}
          >
            {project.status}
          </span>
          <h1
            id="project-name"
            className="m-0 max-w-[11ch] text-[clamp(48px,7.5vw,96px)] uppercase leading-[0.86] tracking-[-0.04em]"
          >
            {project.name}
          </h1>
          <p className="mb-0 mt-[26px] max-w-[60ch] text-[clamp(18px,2vw,25px)] leading-[1.38] text-ash">
            {project.summary}
          </p>
        </div>
      </section>

      {project.media.length > 0 && (
        <section className="mt-[clamp(42px,6vw,72px)] border-t-2 border-ink pt-6" aria-labelledby="project-media">
          <div className="mb-5 flex items-baseline justify-between gap-5">
            <h2 id="project-media" className="m-0 text-[12px] uppercase tracking-[0.14em] text-brand">
              Project media
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ash">
              {project.media.length} {project.media.length === 1 ? "asset" : "assets"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
            {project.media.map((media) =>
              media.kind === "video" ? (
                <video
                  key={media.src}
                  className="block aspect-video h-full w-full rounded-lg bg-ink object-cover"
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
                  className="block aspect-video h-full w-full rounded-lg bg-ink object-cover"
                />
              ),
            )}
          </div>
        </section>
      )}

      <section
        className="mt-[clamp(42px,6vw,72px)] grid grid-cols-3 border-b border-ink border-t-2 border-t-ink max-[760px]:grid-cols-1"
        aria-label="Project information"
      >
        <div className="flex min-h-[118px] flex-col justify-center gap-[7px] py-[22px] pl-0 pr-[clamp(18px,3vw,36px)] max-[760px]:min-h-[96px] max-[760px]:px-0 max-[760px]:py-5">
          <span className={META_LABEL}>Client</span>
          <strong className={META_VALUE}>{project.client}</strong>
        </div>
        <div className="flex min-h-[118px] flex-col justify-center gap-[7px] border-l border-hairline px-[clamp(18px,3vw,36px)] py-[22px] max-[760px]:min-h-[96px] max-[760px]:border-l-0 max-[760px]:border-t max-[760px]:border-t-hairline max-[760px]:px-0 max-[760px]:py-5">
          <span className={META_LABEL}>Category</span>
          <strong className={META_VALUE}>{project.category}</strong>
        </div>
        <div className="flex min-h-[118px] flex-col justify-center gap-[7px] border-l border-hairline px-[clamp(18px,3vw,36px)] py-[22px] max-[760px]:min-h-[96px] max-[760px]:border-l-0 max-[760px]:border-t max-[760px]:border-t-hairline max-[760px]:px-0 max-[760px]:py-5">
          <span className={META_LABEL}>Project lead</span>
          <strong className={`${META_VALUE} ${project.lead ? "" : "text-ash"}`}>
            {project.lead || "To be confirmed"}
          </strong>
        </div>
      </section>

      <section
        className="mt-[clamp(64px,9vw,120px)] border-t-2 border-ink"
        aria-label="Project case study"
      >
        <article className={SECTION}>
          <h2 className={SECTION_HEADING}>Challenge</h2>
          <p className={`${BODY} ${provisional}`}>{project.challenge}</p>
        </article>
        <article className={SECTION}>
          <h2 className={SECTION_HEADING}>Insight</h2>
          <p className={`${BODY} ${provisional}`}>{project.insight}</p>
        </article>
        <article className={SECTION}>
          <h2 className={SECTION_HEADING}>Strategy</h2>
          <p className={`${BODY} ${provisional}`}>{project.strategy}</p>
        </article>
        <article className={SECTION}>
          <h2 className={SECTION_HEADING}>Platform</h2>
          <ul className="m-0 flex flex-wrap gap-2 p-0 list-none">
            {project.platform.map((channel) => (
              <li
                key={channel}
                className="border border-ink px-3 py-[9px] text-[12px] font-extrabold uppercase tracking-[0.08em]"
              >
                {channel}
              </li>
            ))}
          </ul>
        </article>
        <article className={SECTION}>
          <h2 className={SECTION_HEADING}>Execution</h2>
          <p className={`${BODY} ${provisional}`}>{project.execution}</p>
        </article>
        <article className={SECTION}>
          <h2 className={SECTION_HEADING}>Outcome</h2>
          <p className={`${BODY} ${provisional}`}>{project.outcome}</p>
        </article>
      </section>
    </main>
  );
}
