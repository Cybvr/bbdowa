"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Clock, CreditCard, FileSignature, ListChecks, Receipt, UserPlus } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { MobileHeaderTitle } from "@/components/dashboard/mobile-header";
import { JobMigrationPanel } from "@/components/job-migration-panel";
import { firebaseDb } from "@/lib/firebase/client";
import { readJobsFromFirestore, useFirestoreDocuments, useFirestoreTasks, useFirestoreUsers } from "@/lib/firebase/client-content";
import { isOverdue, isTaskOpen } from "@/lib/creator-tasks";
import { plural } from "@/lib/format";
import { INVOICES_COLLECTION, invoiceTotals, isInvoiceOverdue, type Invoice } from "@/lib/invoices";
import type { Job } from "@/lib/jobs";
import { PAYMENTS_COLLECTION, formatTotals, type Payment } from "@/lib/payments";
import { ACTIVITY_COLLECTION, elapsedMs, formatDuration, isPaused, startOfToday, startOfWeek, type ActivityEntry } from "@/lib/time-tracking";
import { isCreatorUser } from "@/lib/users";

const CARD = "rounded-2xl border border-border bg-background p-5";

function greeting(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** One row in "things need you": icon, what, a short line, and where to act. */
function NeedRow({ icon, tone, title, detail, href, action }: { icon: React.ReactNode; tone: string; title: string; detail: string; href: string; action?: string }) {
  return (
    <li className="border-t border-border first:border-t-0">
      <Link href={href} className="flex items-center gap-3 py-3 text-foreground no-underline">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold">{title}</span>
          <span className="block truncate text-sm text-muted-foreground">{detail}</span>
        </span>
        {action ? (
          <span className="shrink-0 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">{action}</span>
        ) : (
          <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
      </Link>
    </li>
  );
}

function SectionTitle({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="mb-3 mt-8 flex items-center justify-between gap-3">
      <h2 className="m-0 text-item-title font-semibold">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-primary no-underline hover:underline">{label}</Link>
    </div>
  );
}

/** A thin progress bar: `value` of `total`, filled in the given colour. */
function Meter({ value, total, color }: { value: number; total: number; color: string }) {
  const width = total ? Math.max(value ? 4 : 0, Math.round((value / total) * 100)) : 0;
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${value} of ${total}`}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

/** Admin home: what needs attention first, then money, jobs, people and work. */
export default function AdminPage() {
  const { role, user } = useAuth();
  const { users } = useFirestoreUsers();
  const { documents } = useFirestoreDocuments();
  const { tasks } = useFirestoreTasks();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [entries, setEntries] = React.useState<ActivityEntry[]>([]);

  React.useEffect(() => {
    if (role !== "admin" && role !== "manager") return;
    readJobsFromFirestore().then(setJobs).catch((cause) => console.error("Unable to load jobs", cause));
    getDocs(collection(firebaseDb, PAYMENTS_COLLECTION))
      .then((snapshot) => setPayments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Payment)))
      .catch((cause) => console.error("Unable to load payments", cause));
    getDocs(collection(firebaseDb, INVOICES_COLLECTION))
      .then((snapshot) => setInvoices(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Invoice)))
      .catch((cause) => console.error("Unable to load invoices", cause));
    getDocs(collection(firebaseDb, ACTIVITY_COLLECTION))
      .then((snapshot) => setEntries(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ActivityEntry)))
      .catch((cause) => console.error("Unable to load time", cause));
  }, [role]);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const peopleHref = role === "admin" ? "/admin/users" : "/dashboard/help?tab=team";
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  // People: anyone in the directory who hasn't signed in yet hasn't joined.
  const people = users.filter((person) => person.role !== "client");
  const joined = people.filter((person) => person.uid).length;
  const creators = people.filter(isCreatorUser).length;

  const activeJobs = jobs.filter((job) => job.status === "active").length;
  const doneJobs = jobs.filter((job) => job.status === "completed").length;
  const archivedJobs = jobs.filter((job) => job.status === "archived").length;

  const openTasks = tasks.filter(isTaskOpen);
  const overdueTasks = openTasks.filter(isOverdue).length;
  const doneTasks = tasks.length - openTasks.length;

  const unpaid = payments.filter((payment) => payment.status === "pending");
  const month = new Date().toISOString().slice(0, 7);
  const year = String(new Date().getFullYear());
  const paidThisMonth = payments.filter((payment) => payment.status === "paid" && payment.paidAt?.startsWith(month));
  const paidThisYear = payments.filter((payment) => payment.status === "paid" && payment.paidAt?.startsWith(year));

  const invoicesDue = invoices.filter((invoice) => invoice.status === "sent");
  const invoicesOverdue = invoicesDue.filter((invoice) => isInvoiceOverdue(invoice)).length;
  const toSign = documents.filter((document) => document.status === "pending_signature").length;

  const weekStart = startOfWeek();
  const thisWeek = entries.filter((entry) => Date.parse(entry.startedAt) >= weekStart);
  const weekMs = thisWeek.reduce((total, entry) => total + elapsedMs(entry), 0);
  const peopleTracking = new Set(thisWeek.map((entry) => entry.uid)).size;
  const todayMs = entries
    .filter((entry) => Date.parse(entry.startedAt) >= startOfToday())
    .reduce((total, entry) => total + elapsedMs(entry), 0);
  const runningNow = entries.filter((entry) => !entry.endedAt && !isPaused(entry));
  const longRunning = runningNow.filter((entry) => elapsedMs(entry) >= 3 * 3_600_000);
  const nameOf = (uid: string, fallback: string | null) => {
    const person = users.find((candidate) => candidate.uid === uid);
    return person?.preferredName || person?.name || fallback || "Unknown";
  };
  const weekByPerson = [...thisWeek.reduce((totals, entry) => {
    const current = totals.get(entry.uid) ?? { uid: entry.uid, name: nameOf(entry.uid, entry.name), ms: 0 };
    current.ms += elapsedMs(entry);
    return totals.set(entry.uid, current);
  }, new Map<string, { uid: string; name: string; ms: number }>()).values()].sort((a, b) => b.ms - a.ms);
  const topWeekMs = weekByPerson[0]?.ms ?? 0;

  const needs = [
    unpaid.length ? { key: "pay", icon: <CreditCard className="h-5 w-5 text-primary" />, tone: "bg-primary/10", title: `${formatTotals(unpaid)} unpaid`, detail: `${plural(unpaid.length, "payment")} waiting`, href: "/dashboard/payments", action: "Pay" } : null,
    invoicesDue.length ? { key: "invoices", icon: <Receipt className="h-5 w-5 text-sky-700" />, tone: "bg-sky-100", title: `${invoiceTotals(invoicesDue)} to collect`, detail: `${plural(invoicesDue.length, "invoice")} due${invoicesOverdue ? `, ${invoicesOverdue} overdue` : ""}`, href: "/admin/invoices" } : null,
    people.length - joined > 0 ? { key: "join", icon: <UserPlus className="h-5 w-5 text-amber-700" />, tone: "bg-amber-100", title: `${people.length - joined} people haven’t joined`, detail: `Only ${joined} of ${people.length} ${joined === 1 ? "has" : "have"} signed up`, href: peopleHref } : null,
    openTasks.length ? { key: "tasks", icon: <ListChecks className="h-5 w-5 text-emerald-700" />, tone: "bg-emerald-100", title: `${plural(openTasks.length, "task")} open`, detail: `${doneTasks} already done`, href: "/admin/tasks" } : null,
    longRunning.length ? { key: "timers", icon: <Clock className="h-5 w-5 text-orange-700" />, tone: "bg-orange-100", title: `${plural(longRunning.length, "timer")} running 3h+`, detail: "May have been left on", href: "/admin/tracker" } : null,
    toSign ? { key: "sign", icon: <FileSignature className="h-5 w-5 text-violet-700" />, tone: "bg-violet-100", title: `${plural(toSign, "document")} to sign`, detail: "Waiting on people", href: "/admin/documents" } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const overdueCount = overdueTasks + invoicesOverdue;

  return (
    <main className="min-h-[calc(100dvh-60px)] flex-1 bg-muted px-4 pb-24 pt-4 sm:px-8 nav:pt-8">
      <MobileHeaderTitle title={`${greeting()}, ${firstName}`} />
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-4">
          <h1 className="m-0 text-page-title font-bold max-nav:hidden lg:text-page-title-lg">{greeting()}, {firstName}</h1>
          <p className="m-0 mt-1 text-body text-muted-foreground">{today}</p>
        </header>

        {/* What needs attention */}
        <section className={CARD}>
          <h2 className="m-0 text-page-title font-bold">{needs.length ? `${needs.length} ${needs.length === 1 ? "thing needs" : "things need"} you` : "All clear"}</h2>
          <p className="m-0 mt-1 text-sm text-muted-foreground">{overdueCount ? `${plural(overdueCount, "thing")} overdue.` : "Nothing is overdue."}</p>
          {needs.length ? <ul className="m-0 mt-3 list-none p-0">{needs.map(({ key, ...row }) => <NeedRow key={key} {...row} />)}</ul> : null}
        </section>

        <SectionTitle title="Money" href="/dashboard/payments" label="See payments" />
        <section className={CARD}>
          <p className="m-0 text-sm text-muted-foreground">Still to be paid</p>
          <p className="m-0 mt-1 text-hero-stat font-bold tabular-nums text-primary">{formatTotals(unpaid)}</p>
          <p className="m-0 mt-1 text-sm text-muted-foreground">{plural(unpaid.length, "payment")}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div><p className="m-0 text-sm text-muted-foreground">This month</p><p className="m-0 mt-1 text-item-title font-bold tabular-nums">{formatTotals(paidThisMonth)}</p></div>
            <div><p className="m-0 text-sm text-muted-foreground">So far in {year}</p><p className="m-0 mt-1 text-item-title font-bold tabular-nums">{formatTotals(paidThisYear)}</p></div>
          </div>
        </section>

        <SectionTitle title="Jobs" href="/admin/jobs" label="See all" />
        <section className={CARD}>
          <p className="m-0 text-sm text-muted-foreground">Active now</p>
          <p className="m-0 mt-1 text-hero-stat font-bold tabular-nums">{activeJobs}</p>
          {jobs.length ? (
            <div className="mt-4 flex h-2.5 gap-1 overflow-hidden rounded-full" role="img" aria-label={`${activeJobs} active, ${doneJobs} done, ${archivedJobs} archived`}>
              {activeJobs ? <div className="rounded-full bg-primary" style={{ flex: activeJobs }} /> : null}
              {doneJobs ? <div className="rounded-full bg-emerald-600" style={{ flex: doneJobs }} /> : null}
              {archivedJobs ? <div className="rounded-full bg-muted-foreground/40" style={{ flex: archivedJobs }} /> : null}
            </div>
          ) : null}
          <dl className="m-0 mt-4 grid grid-cols-3 gap-3">
            {([["Active", activeJobs, "bg-primary"], ["Done", doneJobs, "bg-emerald-600"], ["Archived", archivedJobs, "bg-muted-foreground/40"]] as const).map(([label, value, dot]) => (
              <div key={label}>
                <dt className="flex items-center gap-1.5 text-sm text-muted-foreground"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${dot}`} />{label}</dt>
                <dd className="m-0 mt-1 text-item-title font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link href={peopleHref} className={`${CARD} text-foreground no-underline`}>
            <p className="m-0 text-sm text-muted-foreground">People</p>
            <p className="m-0 mt-1 text-hero-stat font-bold tabular-nums">{people.length}</p>
            <p className="m-0 mt-1 text-sm text-muted-foreground">{creators} creators</p>
            <Meter value={joined} total={people.length} color="bg-primary" />
            <p className="m-0 mt-2 text-sm text-muted-foreground">{joined} {joined === 1 ? "has" : "have"} joined</p>
          </Link>
          <Link href="/admin/tasks" className={`${CARD} text-foreground no-underline`}>
            <p className="m-0 text-sm text-muted-foreground">Tasks</p>
            <p className="m-0 mt-1 text-hero-stat font-bold tabular-nums">{doneTasks} / {tasks.length}</p>
            <p className="m-0 mt-1 text-sm text-muted-foreground">done</p>
            <Meter value={doneTasks} total={tasks.length} color="bg-emerald-600" />
            <p className="m-0 mt-2 text-sm text-muted-foreground">{openTasks.length} still open</p>
          </Link>
          <Link href="/admin/invoices" className={`${CARD} text-foreground no-underline`}>
            <p className="m-0 text-sm text-muted-foreground">Invoices due</p>
            <p className="m-0 mt-1 break-words text-item-title font-bold tabular-nums">{invoiceTotals(invoicesDue)}</p>
            <p className="m-0 mt-1 text-sm text-muted-foreground">{plural(invoicesDue.length, "invoice")}{invoicesOverdue ? `, ${invoicesOverdue} overdue` : ""}</p>
          </Link>
          <Link href="/admin/tracker" className={`${CARD} text-foreground no-underline`}>
            <p className="m-0 text-sm text-muted-foreground">Time this week</p>
            <p className="m-0 mt-1 text-item-title font-bold tabular-nums">{formatDuration(weekMs)}</p>
            <p className="m-0 mt-1 text-sm text-muted-foreground">{peopleTracking} {peopleTracking === 1 ? "person" : "people"} tracking</p>
          </Link>
        </div>

        <SectionTitle title="Tracker" href="/admin/tracker" label="See all" />
        <section className={CARD}>
          <p className="m-0 text-sm text-muted-foreground">Tracked this week</p>
          <p className="m-0 mt-1 text-hero-stat font-bold tabular-nums">{formatDuration(weekMs)}</p>
          <dl className="m-0 mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
            <div><dt className="text-sm text-muted-foreground">Today</dt><dd className="m-0 mt-1 text-item-title font-bold tabular-nums">{formatDuration(todayMs)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Running now</dt><dd className="m-0 mt-1 text-item-title font-bold tabular-nums">{runningNow.length}</dd></div>
            <div><dt className="text-sm text-muted-foreground">People</dt><dd className="m-0 mt-1 text-item-title font-bold tabular-nums">{peopleTracking}</dd></div>
          </dl>
          {weekByPerson.length ? (
            <ul className="m-0 mt-4 list-none space-y-3 border-t border-border p-0 pt-4">
              {weekByPerson.slice(0, 5).map((person) => (
                <li key={person.uid}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-semibold">{person.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{formatDuration(person.ms)}</span>
                  </div>
                  <Meter value={person.ms} total={topWeekMs} color="bg-primary" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 mt-4 border-t border-border pt-4 text-sm text-muted-foreground">No time tracked yet this week.</p>
          )}
          {runningNow.length ? (
            <div className="mt-4 border-t border-border pt-4">
              <p className="m-0 text-sm font-semibold">Running now</p>
              <ul className="m-0 mt-2 list-none space-y-2 p-0">
                {runningNow.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate"><span className="font-semibold">{nameOf(entry.uid, entry.name)}</span><span className="text-muted-foreground"> · {entry.activity}</span></span>
                    <span className={`shrink-0 tabular-nums ${longRunning.includes(entry) ? "text-primary" : "text-muted-foreground"}`}>{formatDuration(elapsedMs(entry))}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <div className="mt-8">
          <JobMigrationPanel />
        </div>
      </div>
    </main>
  );
}
