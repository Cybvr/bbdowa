import type { Metadata } from "next";
import { JOBS } from "@/lib/jobs";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Careers" };

const GRID =
  "grid grid-cols-[minmax(280px,1.55fr)_minmax(190px,1fr)_minmax(100px,0.55fr)_88px] gap-6 max-[900px]:grid-cols-[minmax(220px,1.5fr)_minmax(160px,1fr)_90px_80px] max-[900px]:gap-4";

const MOBILE_LABEL =
  "hidden mb-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ash max-[720px]:block";

export default function CareersPage() {
  return (
    <main className="flex-1 px-[clamp(24px,6vw,96px)] pb-[100px] pt-[clamp(44px,7vw,96px)]">
      <div className="mb-[clamp(44px,7vw,84px)] flex items-end justify-between gap-8 max-[720px]:flex-col max-[720px]:items-start">
        <h1 className="m-0 text-[clamp(64px,13vw,180px)] uppercase leading-[0.82] tracking-[-0.07em]">
          Careers
        </h1>
        <p className="mb-2 mt-0 max-w-[27ch] text-[clamp(18px,2vw,26px)] leading-[1.2]">
          Open roles across our Lagos studio.
        </p>
      </div>

      <p className="mb-4 mt-0 text-[12px] font-extrabold uppercase tracking-[0.14em] text-brand">
        {plural(JOBS.length, "opening")}
      </p>

      <div
        aria-hidden="true"
        className={`${GRID} border-b-2 border-ink py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ash max-[720px]:hidden`}
      >
        <span>Role</span>
        <span>Department</span>
        <span>Location</span>
        <span>Status</span>
      </div>

      <section aria-label="Open positions">
        {JOBS.length ? (
          JOBS.map((job) => (
            <article
              key={job.slug}
              id={job.slug}
              className={`${GRID} items-center border-b border-hairline py-6 max-[720px]:grid-cols-2 max-[720px]:gap-x-5 max-[720px]:gap-y-[18px]`}
            >
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
              <span className="justify-self-start bg-brand px-[9px] py-[5px] text-[10px] font-extrabold uppercase tracking-[0.12em] text-white max-[720px]:self-end">
                {job.status}
              </span>
            </article>
          ))
        ) : (
          <p className="border-b border-hairline border-t-2 border-t-ink py-7 text-[18px]">
            There are no open positions right now.
          </p>
        )}
      </section>
    </main>
  );
}
