import Link from "next/link";
import { openingHref } from "@/lib/openings";
import { getOpenings } from "@/lib/firebase/content";
import { plural } from "@/lib/format";
import { Badge } from "@/components/dashboard/ui";

const GRID =
  "grid grid-cols-[minmax(220px,1.4fr)_minmax(150px,1fr)_minmax(90px,0.55fr)_minmax(100px,0.65fr)_88px] gap-6 max-[1050px]:gap-4";

const MOBILE_LABEL = "hidden mb-1 text-[11px] font-medium text-muted-foreground max-[720px]:block";

export async function CareersSection() {
  const jobs = await getOpenings();
  const openJobs = jobs.filter((job) => job.status === "open");
  const sortedJobs = [...jobs].sort((a, b) => Number(b.status === "open") - Number(a.status === "open"));

  return (
    <div>
      <p className="m-0 text-[13px] font-medium text-muted-foreground">{plural(openJobs.length, "open role")}</p>

      <div
        aria-hidden="true"
        className={`${GRID} mt-4 border-b border-border py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground max-[720px]:hidden`}
      >
        <span>Role</span>
        <span>Department</span>
        <span>Location</span>
        <span>Work mode</span>
        <span>Status</span>
      </div>

      <section aria-label="Career positions">
        {sortedJobs.length ? (
          sortedJobs.map((job) => {
            const row = (
              <>
                <h2 className="m-0 text-[18px] font-semibold leading-tight tracking-tight max-[720px]:col-span-full">
                  {job.title}
                </h2>
                <div className="text-[14px] leading-[1.3]">
                  <span className={MOBILE_LABEL}>Department</span>
                  {job.department}
                </div>
                <div className="text-[14px] leading-[1.3]">
                  <span className={MOBILE_LABEL}>Location</span>
                  {job.location}
                </div>
                <div className="text-[14px] leading-[1.3]">
                  <span className={MOBILE_LABEL}>Work mode</span>
                  {job.workMode}
                </div>
                <span className="justify-self-start max-[720px]:self-end">
                  <Badge tone={job.status === "open" ? "active" : "neutral"}>{job.status}</Badge>
                </span>
              </>
            );
            const className = `${GRID} items-center rounded-lg border-b border-border py-5 max-[720px]:grid-cols-2 max-[720px]:gap-x-5 max-[720px]:gap-y-[18px] ${
              job.status === "open"
                ? "group text-foreground no-underline transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                : "text-muted-foreground opacity-55"
            }`;

            return job.status === "open" ? (
              <Link key={job.slug} href={openingHref(job.slug)} id={job.slug} className={className}>
                {row}
              </Link>
            ) : (
              <div key={job.slug} id={job.slug} aria-disabled="true" className={className}>
                {row}
              </div>
            );
          })
        ) : (
          <p className="border-b border-border py-6 text-[16px] text-muted-foreground">
            There are no open positions right now.
          </p>
        )}
      </section>
    </div>
  );
}
