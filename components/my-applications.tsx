"use client";

import * as React from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { Badge, EmptyState, PageHeader } from "@/components/dashboard/ui";
import { firebaseDb } from "@/lib/firebase/client";
import { longDate } from "@/lib/format";
import {
  APPLICANT_STATUS_LABELS,
  JOB_APPLICATIONS_COLLECTION,
  JOB_POSTINGS_COLLECTION,
  postingHref,
  type JobApplication,
} from "@/lib/job-postings";

type Row = JobApplication & { headline: string };

export function MyApplications() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [rows, setRows] = React.useState<Row[] | null>(null);

  React.useEffect(() => {
    if (!uid) return;
    let active = true;
    (async () => {
      const snapshot = await getDocs(query(collection(firebaseDb, JOB_APPLICATIONS_COLLECTION), where("uid", "==", uid)));
      const applications = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as JobApplication);
      const headlines = await Promise.all(applications.map((application) => getDoc(doc(firebaseDb, JOB_POSTINGS_COLLECTION, application.postingId))
        .then((posting) => (posting.data()?.headline as string | undefined)?.trim() || "Open job")
        .catch(() => "Open job")));
      const next = applications.map((application, index) => ({ ...application, headline: headlines[index] }));
      next.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      if (active) setRows(next);
    })().catch(() => { if (active) setRows([]); });
    return () => { active = false; };
  }, [uid]);

  return <div className="grid gap-6">
    <PageHeader title="My applications" />
    {!rows ? <p className="m-0 text-sm text-muted-foreground">Loading…</p>
      : !rows.length ? <EmptyState title="No applications yet" description="Jobs you apply for show up here, with where each one stands." />
      : <ul className="m-0 grid list-none divide-y divide-border rounded-xl border border-border p-0">
        {rows.map((row) => <li key={row.id}>
          <Link href={postingHref(row.postingId)} className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-muted/50">
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-semibold">{row.headline}</p>
              {row.createdAt ? <p className="m-0 mt-0.5 text-xs text-muted-foreground">Sent {longDate(row.createdAt.slice(0, 10))}</p> : null}
            </div>
            <Badge tone={row.status === "declined" ? "neutral" : row.status === "hired" ? "inverse" : "active"}>{APPLICANT_STATUS_LABELS[row.status]}</Badge>
          </Link>
        </li>)}
      </ul>}
  </div>;
}
