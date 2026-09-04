import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { getJob, JOBS } from "@/lib/jobs";
import { Badge, SectionHeading } from "@/components/dashboard/ui";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return JOBS.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const job = getJob(slug);
  return { title: job?.title ?? "Career role" };
}

export default async function CareerDetailPage({ params }: Params) {
  const { slug } = await params;
  const job = getJob(slug);
  if (!job) notFound();

  const isOpen = job.status === "open";

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <BackLink href="/dashboard/careers" className="mb-5">
        Back to careers
      </BackLink>

      <div className="max-w-[1050px]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="text-[13px] font-semibold text-primary">{job.department}</span>
            <h1 className="mb-0 mt-2 max-w-[18ch] text-[26px] font-bold leading-tight tracking-tight sm:text-[34px]">
              {job.title}
            </h1>
          </div>
          <Badge tone={isOpen ? "active" : "neutral"}>{job.status}</Badge>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.42fr)]">
          <div>
            <p className="mb-0 max-w-[62ch] text-[18px] leading-[1.4]">
              {job.summary ?? `A ${job.title.toLowerCase()} role in ${job.department}, based in ${job.location}.`}
            </p>
            {job.description ? (
              <section className="mt-10 max-w-[70ch]" aria-labelledby="job-description">
                <SectionHeading id="job-description">Job description</SectionHeading>
                <p className="mb-0 text-[15px] leading-[1.55] text-muted-foreground">{job.description}</p>
              </section>
            ) : (
              <p className="mb-0 mt-8 max-w-[62ch] text-[15px] leading-[1.55] text-muted-foreground">
                The detailed brief for this role is being finalised. This page keeps the role, team and
                application status clear while the full responsibilities are confirmed.
              </p>
            )}

            {job.qualifications && job.responsibilities ? (
              <div className="mt-10 grid gap-10 border-t border-border pt-8 md:grid-cols-2">
                <section aria-labelledby="qualifications">
                  <SectionHeading id="qualifications">Qualifications</SectionHeading>
                  <ul className="m-0 grid gap-2.5 pl-5 text-[15px] leading-[1.45]">
                    {job.qualifications.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>
                <section aria-labelledby="responsibilities">
                  <SectionHeading id="responsibilities">Responsibilities</SectionHeading>
                  <ul className="m-0 grid gap-2.5 pl-5 text-[15px] leading-[1.45]">
                    {job.responsibilities.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>
              </div>
            ) : null}

            {job.about ? (
              <section className="mt-10 border-t border-border pt-8" aria-labelledby="about-us">
                <SectionHeading id="about-us">About us</SectionHeading>
                <div className="grid gap-3 text-[15px] leading-[1.55] text-muted-foreground">
                  {job.about.map((paragraph) => <p key={paragraph} className="m-0">{paragraph}</p>)}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="border-t border-border pt-5">
            <dl className="m-0 grid gap-5">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Department</dt>
                <dd className="mb-0 mt-1 text-[16px]">{job.department}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Location</dt>
                <dd className="mb-0 mt-1 text-[16px]">{job.location}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Work mode</dt>
                <dd className="mb-0 mt-1 text-[16px]">{job.workMode}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</dt>
                <dd className="mb-0 mt-1 text-[16px] capitalize">{job.status}</dd>
              </div>
              {job.schedule ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Schedule</dt>
                  <dd className="mb-0 mt-1 text-[16px]">{job.schedule}</dd>
                </div>
              ) : null}
              {job.salary ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Salary</dt>
                  <dd className="mb-0 mt-1 text-[16px]">{job.salary}</dd>
                </div>
              ) : null}
            </dl>
            {isOpen ? (
              <Link
                href={`/dashboard/careers/apply?role=${job.slug}`}
                className="mt-8 inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-3 text-[13px] font-semibold text-white no-underline hover:bg-primary/90 focus-visible:outline-none"
              >
                Apply now
              </Link>
            ) : (
              <p className="mb-0 mt-8 border-t border-border pt-4 text-[14px] text-muted-foreground">
                Applications for this role are currently closed.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
