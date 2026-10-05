import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Layers, MapPin } from "lucide-react";
import { DashboardCard, DashboardCardActions } from "@/components/dashboard-card";
import { jobHref, jobRecentDate, jobTitle, type Job } from "@/lib/jobs";
import { longDate } from "@/lib/format";

export function JobCard({
  job,
  admin = false,
  myJobs = false,
  actions,
}: {
  job: Job;
  admin?: boolean;
  myJobs?: boolean;
  actions?: ReactNode;
}) {
  return (
    <DashboardCard className="h-full" actions={actions}>
      <Link
        href={jobHref(job.slug, admin, myJobs)}
        className="group flex h-full flex-col p-4 text-foreground no-underline transition hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span className="line-clamp-1 text-[13px] font-medium text-muted-foreground">{job.clientName}</span>
        <h3 className="m-0 mt-1 line-clamp-2 text-[16px] font-semibold leading-tight group-hover:text-primary">
          {jobTitle(job)}
        </h3>
        {job.specialization || job.category || job.workSetup ? (
          <p className="m-0 mt-2 flex line-clamp-1 items-center gap-1 text-[12px] text-muted-foreground">
            {job.workSetup ? <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> : null}
            <span>{[job.specialization || job.category, job.workSetup, job.estimatedLength].filter(Boolean).join(" · ")}</span>
          </p>
        ) : null}
        {job.requiredSkills?.length ? <SkillChips skills={job.requiredSkills} /> : null}
        <p className="m-0 mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {longDate(jobRecentDate(job))}
        </p>
      </Link>
    </DashboardCard>
  );
}

/** Up to three skills as pills with a small brand-colour icon, plus a "+N" for the rest. */
function SkillChips({ skills, max = 3 }: { skills: string[]; max?: number }) {
  const shown = skills.slice(0, max);
  const more = skills.length - shown.length;
  return (
    <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0" aria-label="Skills">
      {shown.map((skill) => (
        <li key={skill} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted py-1 pl-1 pr-2.5 text-[12px] font-medium text-foreground">
          <span aria-hidden="true" className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Layers className="h-2.5 w-2.5" strokeWidth={2.5} />
          </span>
          <span className="truncate">{skill}</span>
        </li>
      ))}
      {more > 0 ? <li className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground">+{more}</li> : null}
    </ul>
  );
}

export function AdminJobCardActions({ job }: { job: Job }) {
  return <DashboardCardActions collection="jobs" slug={job.slug} titleField="title" title={jobTitle(job)} />;
}
