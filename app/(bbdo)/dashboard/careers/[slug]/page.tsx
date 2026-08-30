import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { getJob, JOBS } from "@/lib/jobs";

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
    <main className="flex-1 px-[clamp(24px,6vw,96px)] pb-20 pt-[clamp(30px,4vw,56px)]">
      <BackLink href="/dashboard/careers">Back to careers</BackLink>

      <div className="mt-8 max-w-[1050px]">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b-2 border-foreground pb-6">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              {job.department}
            </span>
            <h1 className="mb-0 mt-4 max-w-[18ch] text-[clamp(34px,6vw,76px)] leading-[0.95] tracking-[-0.04em]">
              {job.title}
            </h1>
          </div>
          <span className={`px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white ${isOpen ? "bg-primary" : "bg-foreground"}`}>
            {job.status}
          </span>
        </div>

        <div className="mt-[clamp(28px,5vw,56px)] grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.42fr)]">
          <div>
            <p className="mb-0 max-w-[34ch] text-[clamp(24px,3vw,40px)] leading-[1.1] tracking-[-0.02em]">
              A {job.title.toLowerCase()} role in {job.department}, based in {job.location}.
            </p>
            <p className="mb-0 mt-8 max-w-[62ch] text-[17px] leading-[1.5] text-muted-foreground">
              The detailed brief for this role is being finalised. This page keeps the role, team and
              application status clear while the full responsibilities are confirmed.
            </p>
          </div>

          <aside className="border-t border-border pt-5">
            <dl className="m-0 grid gap-5">
              <div>
                <dt className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Department</dt>
                <dd className="mb-0 mt-1 text-[18px]">{job.department}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Location</dt>
                <dd className="mb-0 mt-1 text-[18px]">{job.location}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Work mode</dt>
                <dd className="mb-0 mt-1 text-[18px]">{job.workMode}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Status</dt>
                <dd className="mb-0 mt-1 text-[18px] capitalize">{job.status}</dd>
              </div>
            </dl>
            {isOpen ? (
              <Link
                href="/dashboard/careers/apply"
                className="mt-8 inline-flex min-h-[48px] items-center bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white no-underline hover:bg-foreground focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary"
              >
                Apply for this role
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
