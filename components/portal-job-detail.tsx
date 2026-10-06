"use client";

import * as React from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import { usePortalClient } from "@/components/portal-shell";
import { JobDetailContent } from "@/components/job-detail";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { normalizeJob, type Job } from "@/lib/jobs";

/** Resolve the client's job, then render the shared job detail and tab layout. */
export function PortalJobDetail({ jobId }: { jobId: string }) {
  const portal = usePortalClient();
  const [job, setJob] = React.useState<Job | null | undefined>(undefined);

  React.useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    jobsCollection()
      .then((name) => {
        if (!active) return;
        unsubscribe = onSnapshot(
          doc(firebaseDb, name, jobId),
          (snapshot) => setJob(snapshot.exists() ? normalizeJob(snapshot.data() as Record<string, unknown>, snapshot.id) : null),
          () => setJob(null),
        );
      })
      .catch(() => { if (active) setJob(null); });
    return () => { active = false; unsubscribe(); };
  }, [jobId]);

  const back = <Link href="/portal/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Jobs</Link>;
  if (job === undefined) return <div>{back}<p className="mt-6 text-sm text-muted-foreground">Loading…</p></div>;
  // Only this company's jobs, even if someone guesses another job's link.
  if (!job || job.clientId !== portal?.clientId) return <div>{back}<p className="mt-6 text-sm text-muted-foreground">This job doesn’t exist or isn’t yours.</p></div>;

  return (
    <div className="min-w-0">
      {back}
      <JobDetailContent key={job.slug} job={job} embedded portalMode />
    </div>
  );
}
