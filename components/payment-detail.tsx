"use client";

import * as React from "react";
import Link from "next/link";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/dashboard/ui";
import { MobileHeaderActions, MobileHeaderTitle } from "@/components/dashboard/mobile-header";
import { EditPaymentDialog } from "@/components/edit-payment-dialog";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { longDate } from "@/lib/format";
import { JOB_STATUS_LABELS, jobHref, jobTitle, normalizeJob, type Job } from "@/lib/jobs";
import { PAYMENTS_COLLECTION, formatAmount, type Payment } from "@/lib/payments";
import { notify } from "@/lib/email/notify";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-1.5 text-body">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 break-words font-medium">{children}</dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
      <h2 className="m-0 text-item-title font-semibold">{title}</h2>
      <dl className="m-0 mt-3">{children}</dl>
    </section>
  );
}

/** One payment: what it is, when it's due, and the job it belongs to. Staff can edit it. */
export function PaymentDetail({ paymentId }: { paymentId: string }) {
  const { user, role, loading: authLoading } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const [payment, setPayment] = React.useState<Payment | null>(null);
  const [job, setJob] = React.useState<Job | null>(null);
  const [state, setState] = React.useState<"loading" | "ready" | "missing">("loading");
  const [editing, setEditing] = React.useState<Payment | null>(null);

  React.useEffect(() => {
    if (authLoading || !user) return;
    return onSnapshot(
      doc(firebaseDb, PAYMENTS_COLLECTION, paymentId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setState("missing");
          return;
        }
        setPayment({ id: snapshot.id, ...snapshot.data() } as Payment);
        setState("ready");
      },
      () => setState("missing"),
    );
  }, [authLoading, paymentId, user]);

  const jobId = payment?.jobId ?? null;
  React.useEffect(() => {
    if (!jobId) {
      setJob(null);
      return;
    }
    let active = true;
    jobsCollection()
      .then((name) => getDoc(doc(firebaseDb, name, jobId)))
      .then((snapshot) => { if (active) setJob(snapshot.exists() ? normalizeJob(snapshot.data() as Record<string, unknown>, snapshot.id) : null); })
      .catch(() => { if (active) setJob(null); });
    return () => { active = false; };
  }, [jobId]);

  const toggleStatus = async () => {
    if (!payment) return;
    await updateDoc(
      doc(firebaseDb, PAYMENTS_COLLECTION, payment.id),
      payment.status === "paid" ? { status: "pending", paidAt: null } : { status: "paid", paidAt: new Date().toISOString() },
    );
    if (payment.status !== "paid") void notify({ event: "payment.paid", id: payment.id });
  };

  if (authLoading || (user && state === "loading")) {
    return <main className="flex-1 bg-muted px-4 pb-24 pt-6 sm:px-8"><p className="text-sm text-muted-foreground">Loading payment…</p></main>;
  }
  if (!user || state === "missing" || !payment) {
    return (
      <main className="flex-1 bg-muted px-4 pb-24 pt-6 sm:px-8">
        <Link href="/dashboard/payments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Payments</Link>
        <p className="mt-6 text-sm text-muted-foreground">This payment doesn’t exist or you don’t have access to it.</p>
      </main>
    );
  }

  const title = payment.description || "Payment";
  const period = job?.startDate || job?.endDate ? `${job?.startDate ? longDate(job.startDate) : "—"} to ${job?.endDate ? longDate(job.endDate) : "—"}` : "—";
  const editButton = isStaff ? (
    <button type="button" onClick={() => setEditing(payment)} className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground hover:border-foreground">
      Edit
    </button>
  ) : null;

  return (
    <main className="min-h-[calc(100dvh-60px)] flex-1 bg-muted px-4 pb-24 pt-6 sm:px-8">
      <MobileHeaderTitle title={title} />
      {editButton ? <MobileHeaderActions>{editButton}</MobileHeaderActions> : null}
      <div className="mx-auto grid w-full max-w-3xl gap-3">
        <Link href="/dashboard/payments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Payments</Link>

        <div className="flex items-start justify-between gap-3 max-nav:hidden">
          <h1 className="m-0 min-w-0 text-page-title font-semibold lg:text-page-title-lg">{title}</h1>
          {editButton}
        </div>

        <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
          <p className="m-0 text-sm text-muted-foreground">Amount</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 text-page-title font-semibold tabular-nums">{formatAmount(payment.amount, payment.currency)}</p>
            <Badge tone={payment.status === "paid" ? "neutral" : "active"}>{payment.status === "paid" ? "Paid" : "Pending"}</Badge>
          </div>
          {isStaff ? (
            <button type="button" onClick={() => void toggleStatus()} className="mt-3 text-xs font-semibold text-primary hover:underline">
              {payment.status === "paid" ? "Mark pending" : "Mark paid"}
            </button>
          ) : null}
        </section>

        <Card title="Payment details">
          <Row label="Payment ID"><span className="font-mono text-sm">{payment.id}</span></Row>
          <Row label="Payee">{payment.payeeName || "—"}</Row>
          <Row label="For">{payment.description || "—"}</Row>
          <Row label="Status">{payment.status === "paid" ? "Paid" : "Pending"}</Row>
          <Row label="Due date">{payment.dueDate ? longDate(payment.dueDate) : "Not set"}</Row>
          <Row label="Paid on">{payment.paidAt ? longDate(payment.paidAt.slice(0, 10)) : "—"}</Row>
          <Row label="Created">{payment.createdAt ? longDate(payment.createdAt.slice(0, 10)) : "—"}</Row>
        </Card>

        <Card title="Job">
          {job ? (
            <>
              <Row label="Job"><Link href={jobHref(job.slug, false, !isStaff)} className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">{jobTitle(job)}</Link></Row>
              <Row label="Client">{job.clientName || "—"}</Row>
              <Row label="Job period">{period}</Row>
              <Row label="Job status">{JOB_STATUS_LABELS[job.status]}</Row>
              <Row label="Category">{job.category || "—"}</Row>
              <Row label="Fee">{job.fee || "—"}</Row>
            </>
          ) : (
            <Row label="Job">{payment.jobName || "Not linked to a job"}</Row>
          )}
        </Card>
      </div>

      {isStaff ? <EditPaymentDialog payment={editing} onOpenChange={(open) => { if (!open) setEditing(null); }} onSaved={() => undefined} /> : null}
    </main>
  );
}
