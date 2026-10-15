"use client";

import * as React from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { DashboardCard } from "@/components/dashboard-card";
import { ItemCard, ItemCardList } from "@/components/dashboard/item-card";
import { CreatorThumbnail } from "@/components/creator-thumbnail";
import { usePortalClient } from "@/components/portal-shell";
import { PostJobButton } from "@/components/portal-job-brief";
import { readJobsFromFirestore, useFirestoreUsers } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import { teamSizeLabel } from "@/lib/clients";
import { longDate } from "@/lib/format";
import { INVOICES_COLLECTION, INVOICE_STATUS_LABELS, type Invoice } from "@/lib/invoices";
import { byLastModified, jobRecentDate, jobTitle, type Job } from "@/lib/jobs";
import { formatAmount } from "@/lib/payments";
import { matchesJobTeamKey } from "@/lib/users";

/** Portal home follows the dashboard home: work on the left, company context on the right. */
export function PortalHome() {
  const { user } = useAuth();
  const portal = usePortalClient();
  const { users, loading: peopleLoading, error: peopleError } = useFirestoreUsers();
  const [jobs, setJobs] = React.useState<Job[] | null>(null);
  const [invoices, setInvoices] = React.useState<Invoice[] | null>(null);
  const [invoicesError, setInvoicesError] = React.useState(false);
  const clientId = portal?.clientId;

  React.useEffect(() => {
    if (!clientId) return;
    let active = true;
    readJobsFromFirestore()
      .then((all) => { if (active) setJobs(all.filter((job) => job.clientId === clientId).sort(byLastModified)); })
      .catch(() => { if (active) setJobs([]); });
    return () => { active = false; };
  }, [clientId]);

  React.useEffect(() => {
    if (!clientId) return;
    setInvoicesError(false);
    return onSnapshot(
      query(collection(firebaseDb, INVOICES_COLLECTION), where("clientId", "==", clientId), where("status", "in", ["sent", "paid"])),
      (snapshot) => setInvoices(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Invoice).sort((a, b) => b.issueDate.localeCompare(a.issueDate))),
      (cause) => {
        console.error("Unable to load invoices", cause);
        setInvoicesError(true);
      },
    );
  }, [clientId]);

  const name = user?.name?.trim().split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "there";
  const activeJobs = (jobs ?? []).filter((job) => job.status === "active");
  const company = portal?.client;
  const leadContact = users.find((person) => company?.leadContactUserId && person.role !== "client" && !person.roles?.includes("client") && matchesJobTeamKey(person, company.leadContactUserId));
  const accountManager = users.find((person) => company?.accountManagerUserId && person.role !== "client" && !person.roles?.includes("client") && matchesJobTeamKey(person, company.accountManagerUserId));
  const personLabel = (key: string | null | undefined, personName?: string) => peopleLoading ? "Loading…" : peopleError ? "Unavailable" : personName || (key ? "Assigned person unavailable" : "To be assigned");
  const canEditCompany = Boolean(company && user && company.ownerUid === user.uid);
  const facts = [
    { label: "Company", value: company?.name || "—" },
    { label: "Industry", value: company?.industry || "—" },
    { label: "Team size", value: teamSizeLabel(company?.teamSize) || "—" },
  ];

  return (
    <div>
      <header className="border-b border-border pb-5">
        <h1 className="m-0 text-page-title font-bold leading-tight tracking-tight sm:text-page-title-lg">Welcome back, {name}</h1>
        <p className="mb-0 mt-2 text-body text-muted-foreground">Here’s what’s happening with your work at BBDO West Africa.</p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:gap-10">
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-8">
          <section aria-labelledby="portal-jobs-heading" className="order-1 min-w-0">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 id="portal-jobs-heading" className="m-0 text-item-title font-semibold">Your jobs</h2>
              <Link href="/portal/jobs" className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">View all</Link>
            </div>
            {jobs === null ? (
              <p className="py-5 text-sm text-muted-foreground">Loading your jobs…</p>
            ) : (
              <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
                {activeJobs.slice(0, 4).map((job) => (
                  <li key={job.slug}>
                    <DashboardCard className="h-full">
                      <Link href={`/portal/jobs/${encodeURIComponent(job.slug)}`} className="group flex h-full flex-col p-4 text-foreground no-underline transition hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                        <span className="text-[13px] font-medium text-muted-foreground">Active</span>
                        <h3 className="m-0 mt-1 line-clamp-2 text-[16px] font-semibold leading-tight group-hover:text-primary">{jobTitle(job)}</h3>
                        {job.category ? <span className="mt-2 line-clamp-1 text-xs text-muted-foreground">{job.category}</span> : null}
                        <span className="mt-2 text-[11px] text-muted-foreground">Updated {longDate(jobRecentDate(job))}</span>
                      </Link>
                    </DashboardCard>
                  </li>
                ))}
                <li className={activeJobs.length ? "" : "sm:col-span-2"}>
                  <PostJobButton variant="card" empty={!activeJobs.length} />
                </li>
              </ul>
            )}
          </section>

          <section aria-labelledby="portal-payments-heading" className="order-3 min-w-0">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 id="portal-payments-heading" className="m-0 text-item-title font-semibold">Payments</h2>
              <Link href="/portal/payments" className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">View all</Link>
            </div>
            {invoicesError ? (
              <p className="py-5 text-sm text-muted-foreground">Payments are unavailable right now. Try the Payments page again shortly.</p>
            ) : invoices === null ? (
              <p className="py-5 text-sm text-muted-foreground">Loading payments…</p>
            ) : invoices.length ? (
              <ItemCardList>
                {invoices.slice(0, 4).map((invoice) => (
                  <ItemCard
                    key={invoice.id}
                    href={`/portal/payments/${encodeURIComponent(invoice.id)}`}
                    title={invoice.description}
                    subtitle={`${invoice.number} · ${INVOICE_STATUS_LABELS[invoice.status]}`}
                    trailing={<span className="text-sm font-semibold tabular-nums">{formatAmount(invoice.amount, invoice.currency)}</span>}
                  />
                ))}
              </ItemCardList>
            ) : (
              <p className="py-5 text-sm text-muted-foreground">No invoices yet. Invoices for your jobs will show here.</p>
            )}
          </section>
        </div>

        <aside aria-labelledby="portal-company-heading" className="order-2 min-w-0 lg:self-start lg:border-l lg:border-border lg:pl-7">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 id="portal-company-heading" className="m-0 text-item-title font-semibold">Your company</h2>
            <Link href="/portal/company" className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{canEditCompany ? "Edit company" : "Company"}</Link>
          </div>
          <dl className="m-0 mt-5 divide-y divide-border border-t border-border">
            {facts.map((fact) => (
              <div key={fact.label} className="flex min-h-12 items-center justify-between gap-4 py-3">
                <dt className="shrink-0 text-sm text-muted-foreground">{fact.label}</dt>
                <dd className="m-0 min-w-0 break-words text-right text-sm font-medium text-foreground">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 border-t border-border pt-5">
            <h3 className="m-0 text-sm font-semibold text-foreground">Your contacts</h3>
            <div className="mt-3 flex items-center gap-3 py-2">
              <CreatorThumbnail imageSrc={leadContact?.profileImage} avatarSeed={leadContact?.name || "Lead contact"} className="h-9 w-9 shrink-0" />
              <div className="min-w-0">
                <p className="m-0 text-xs text-muted-foreground">Lead contact</p>
                <p className="m-0 mt-0.5 truncate text-sm font-medium">{personLabel(company?.leadContactUserId, leadContact?.name)}</p>
                {leadContact?.title ? <p className="m-0 mt-0.5 truncate text-xs text-muted-foreground">{leadContact.title}</p> : null}
                {leadContact?.email ? <p className="m-0 mt-0.5 truncate text-xs text-muted-foreground">{leadContact.email}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <CreatorThumbnail imageSrc={accountManager?.profileImage} avatarSeed={accountManager?.name || "Account manager"} className="h-9 w-9 shrink-0" />
              <div className="min-w-0">
                <p className="m-0 text-xs text-muted-foreground">Client service / account manager</p>
                <p className="m-0 mt-0.5 truncate text-sm font-medium">{personLabel(company?.accountManagerUserId, accountManager?.name)}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
