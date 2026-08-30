import type { Metadata } from "next";
import Link from "next/link";
import { JOBS, jobHref } from "@/lib/jobs";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Careers" };

const OPEN_JOBS = JOBS.filter((job) => job.status === "open");
const SORTED_JOBS = [...JOBS].sort((a, b) => Number(b.status === "open") - Number(a.status === "open"));

const GRID =
  "grid grid-cols-[minmax(280px,1.45fr)_minmax(180px,1fr)_minmax(90px,0.55fr)_minmax(100px,0.65fr)_88px] gap-6 max-[1050px]:grid-cols-[minmax(220px,1.35fr)_minmax(150px,1fr)_minmax(80px,0.55fr)_minmax(100px,0.7fr)_80px] max-[1050px]:gap-4";

const MOBILE_LABEL =
  "hidden mb-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground max-[720px]:block";

export default function CareersPage() {
  return (
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-[100px] pt-[clamp(36px,5vw,64px)]">
      <div className="mb-[clamp(44px,7vw,84px)]">
        <h1 className="m-0 text-[clamp(40px,5vw,68px)] uppercase leading-[0.9] tracking-[-0.05em]">
          Careers
        </h1>
      </div>

      <p className="mb-4 mt-0 text-[12px] font-extrabold uppercase tracking-[0.14em] text-primary">
        {plural(OPEN_JOBS.length, "open role")}
      </p>

      <div
        aria-hidden="true"
        className={`${GRID} border-b-2 border-foreground py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground max-[720px]:hidden`}
      >
        <span>Role</span>
        <span>Department</span>
        <span>Location</span>
        <span>Work mode</span>
        <span>Status</span>
      </div>

      <section aria-label="Career positions">
        {SORTED_JOBS.length ? (
          SORTED_JOBS.map((job) => {
            const row = (
              <>
                <h2 className="m-0 text-[clamp(24px,2.8vw,40px)] uppercase leading-none tracking-[-0.04em] max-[720px]:col-span-full">
                  {job.title}
                </h2>
                <div className="text-[clamp(15px,1.3vw,18px)] leading-[1.3]">
                  <span className={MOBILE_LABEL}>Department</span>
                  {job.department}
                </div>
                <div className="text-[clamp(15px,1.3vw,18px)] leading-[1.3]">
                  <span className={MOBILE_LABEL}>Location</span>
                  {job.location}
                </div>
                <div className="text-[clamp(15px,1.3vw,18px)] leading-[1.3]">
                  <span className={MOBILE_LABEL}>Work mode</span>
                  {job.workMode}
                </div>
                <span className={`justify-self-start px-[9px] py-[5px] text-[10px] font-extrabold uppercase tracking-[0.12em] max-[720px]:self-end ${job.status === "open" ? "bg-[#1b9e55] text-white" : "bg-muted text-muted-foreground"}`}>
                  {job.status}
                </span>
              </>
            );
            const className = `${GRID} items-center border-b border-border py-6 max-[720px]:grid-cols-2 max-[720px]:gap-x-5 max-[720px]:gap-y-[18px] ${job.status === "open" ? "group text-foreground no-underline transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-primary" : "text-muted-foreground opacity-55"}`;

            return job.status === "open" ? (
              <Link key={job.slug} href={jobHref(job.slug)} id={job.slug} className={className}>
                {row}
              </Link>
            ) : (
              <div key={job.slug} id={job.slug} aria-disabled="true" className={className}>
                {row}
              </div>
            );
          })
        ) : (
          <p className="border-b border-border border-t-2 border-t-foreground py-7 text-[18px]">
            There are no open positions right now.
          </p>
        )}
      </section>
    </main>
  );
}
