"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { PageHeader, StatItem, StatRow } from "@/components/dashboard/ui";
import { JobMigrationPanel } from "@/components/job-migration-panel";
import { firebaseDb } from "@/lib/firebase/client";
import { readJobsFromFirestore, useFirestoreDocuments, useFirestoreTasks, useFirestoreUsers } from "@/lib/firebase/client-content";
import { isOverdue } from "@/lib/creator-tasks";
import { plural } from "@/lib/format";
import type { Job } from "@/lib/jobs";
import { PAYMENTS_COLLECTION, formatTotals, type Payment } from "@/lib/payments";
import { ACTIVITY_COLLECTION, elapsedMs, formatDuration, startOfWeek, type ActivityEntry } from "@/lib/time-tracking";
import { isCreatorUser, isTeamUser } from "@/lib/users";

function StatSection({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="m-0 text-item-title font-semibold">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
          View all<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <StatRow>{children}</StatRow>
    </section>
  );
}

/** Admin home: the numbers that matter across people, jobs, work, money and documents. */
export default function AdminPage() {
  const { role } = useAuth();
  const { users } = useFirestoreUsers();
  const { documents } = useFirestoreDocuments();
  const { tasks } = useFirestoreTasks();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [entries, setEntries] = React.useState<ActivityEntry[]>([]);

  React.useEffect(() => {
    if (role !== "admin") return;
    readJobsFromFirestore().then(setJobs).catch((cause) => console.error("Unable to load jobs", cause));
    getDocs(collection(firebaseDb, PAYMENTS_COLLECTION))
      .then((snapshot) => setPayments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Payment)))
      .catch((cause) => console.error("Unable to load payments", cause));
    getDocs(collection(firebaseDb, ACTIVITY_COLLECTION))
      .then((snapshot) => setEntries(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ActivityEntry)))
      .catch((cause) => console.error("Unable to load time", cause));
  }, [role]);

  const creators = users.filter(isCreatorUser).length;
  const staff = users.filter(isTeamUser).length;
  const pendingUsers = users.filter((person) => person.role === "pending").length;
  const signedIn = users.filter((person) => person.uid);
  const onboarded = signedIn.filter((person) => person.onboardingCompletedAt).length;

  const activeJobs = jobs.filter((job) => job.status === "active").length;
  const completedJobs = jobs.filter((job) => job.status === "completed").length;
  const archivedJobs = jobs.filter((job) => job.status === "archived").length;

  const openTasks = tasks.filter((task) => task.status !== "done");
  const overdueTasks = openTasks.filter(isOverdue).length;
  const doneTasks = tasks.length - openTasks.length;

  const pendingPayments = payments.filter((payment) => payment.status === "pending");
  const month = new Date().toISOString().slice(0, 7);
  const year = String(new Date().getFullYear());
  const paidThisMonth = payments.filter((payment) => payment.status === "paid" && payment.paidAt?.startsWith(month));
  const paidThisYear = payments.filter((payment) => payment.status === "paid" && payment.paidAt?.startsWith(year));

  const weekStart = startOfWeek();
  const thisWeek = entries.filter((entry) => Date.parse(entry.startedAt) >= weekStart);
  const weekMs = thisWeek.reduce((total, entry) => total + elapsedMs(entry), 0);
  const peopleTracking = new Set(thisWeek.map((entry) => entry.uid)).size;
  const runningNow = entries.filter((entry) => !entry.endedAt && !entry.pausedAt).length;

  const awaitingSignature = documents.filter((document) => document.status === "pending_signature").length;
  const signed = documents.filter((document) => document.status === "signed").length;
  const drafts = documents.filter((document) => document.status === "draft").length;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Admin" description="How the agency is doing at a glance." />

      <div className="mt-6 space-y-8">
        <StatSection title="People" href="/admin/users">
          <StatItem label="Users" value={users.length} detail={`${creators} creators · ${staff} staff`} />
          <StatItem label="Onboarded" value={`${onboarded} of ${signedIn.length}`} detail="of people signed in" />
          <StatItem label="Pending" value={pendingUsers} detail="waiting for a role" />
        </StatSection>

        <StatSection title="Jobs" href="/admin/jobs">
          <StatItem label="Active" value={activeJobs} />
          <StatItem label="Completed" value={completedJobs} />
          <StatItem label="Archived" value={archivedJobs} />
        </StatSection>

        <StatSection title="Tasks" href="/admin/tasks">
          <StatItem label="Open" value={openTasks.length} />
          <StatItem label="Overdue" value={overdueTasks} />
          <StatItem label="Done" value={doneTasks} />
        </StatSection>

        <StatSection title="Payments" href="/dashboard/payments">
          <StatItem label="Outstanding" value={formatTotals(pendingPayments)} detail={plural(pendingPayments.length, "payment")} />
          <StatItem label="Paid this month" value={formatTotals(paidThisMonth)} detail={plural(paidThisMonth.length, "payment")} />
          <StatItem label={`Paid in ${year}`} value={formatTotals(paidThisYear)} detail={plural(paidThisYear.length, "payment")} />
        </StatSection>

        <StatSection title="Time tracked" href="/admin/jobs">
          <StatItem label="This week" value={formatDuration(weekMs)} />
          <StatItem label="People tracking" value={peopleTracking} detail="this week" />
          <StatItem label="Running now" value={runningNow} />
        </StatSection>

        <StatSection title="Documents" href="/admin/documents">
          <StatItem label="Awaiting signature" value={awaitingSignature} />
          <StatItem label="Signed" value={signed} />
          <StatItem label="Drafts" value={drafts} />
        </StatSection>

        <JobMigrationPanel />
      </div>
    </main>
  );
}
