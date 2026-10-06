"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditPaymentDialog } from "@/components/edit-payment-dialog";
import { addDoc, collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { LuPlus } from "react-icons/lu";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { Badge, EmptyState, PageHeader, StatItem, StatRow } from "@/components/dashboard/ui";
import { FilterBar, type FilterTab } from "@/components/dashboard/filter-bar";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { longDate, plural } from "@/lib/format";
import {
  PAYMENTS_COLLECTION,
  formatAmount,
  formatTotals,
  type Payment,
  type PaymentCurrency,
  type PaymentStatus,
} from "@/lib/payments";
import { JOB_TERMS_COLLECTION, type JobTerms } from "@/lib/job-terms";
import { jobHref } from "@/lib/jobs";

type JobOption = { slug: string; name: string; assignedTo: string | null };

type Payee = { uid: string; name: string };

const STATUS_TABS: FilterTab<"all" | PaymentStatus>[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
];

const FIELD = "flex flex-col gap-1.5 text-[13px] font-medium";
const SELECT = "h-11 w-full border-0 border-b border-input bg-transparent px-3 text-[15px] focus-visible:outline-none sm:h-9 sm:text-sm";

export function PaymentsView() {
  const { user, role } = useAuth();
  const router = useRouter();
  const uid = user?.uid ?? null;
  const isStaff = role === "admin" || role === "manager";

  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [status, setStatus] = React.useState<"all" | PaymentStatus>("all");
  const [search, setSearch] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<Payment | null>(null);

  React.useEffect(() => {
    if (!uid) return;
    // Staff see every payment, everyone else only the ones made to them.
    const source = isStaff
      ? collection(firebaseDb, PAYMENTS_COLLECTION)
      : query(collection(firebaseDb, PAYMENTS_COLLECTION), where("payeeUid", "==", uid));
    return onSnapshot(
      source,
      (snapshot) => {
        const rows = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as Payment);
        setPayments(rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setLoaded(true);
      },
      (error) => {
        console.error("Unable to load payments", error);
        setLoaded(true);
      },
    );
  }, [uid, isStaff]);

  const term = search.trim().toLowerCase();
  const visible = payments.filter(
    (payment) =>
      (status === "all" || payment.status === status) &&
      (!term || [payment.payeeName, payment.description, payment.jobName ?? ""].join(" ").toLowerCase().includes(term)),
  );

  const pending = payments.filter((payment) => payment.status === "pending");
  const year = String(new Date().getFullYear());
  const paidThisYear = payments.filter((payment) => payment.status === "paid" && payment.paidAt?.startsWith(year));

  const toggleStatus = async (payment: Payment) => {
    await updateDoc(
      doc(firebaseDb, PAYMENTS_COLLECTION, payment.id),
      payment.status === "paid" ? { status: "pending", paidAt: null } : { status: "paid", paidAt: new Date().toISOString() },
    );
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-2 sm:px-8">
      <PageHeader
        title="Payments"
        actions={
          isStaff ? (
            <button type="button" onClick={() => setAdding(true)} className={LIST_ACTION_CLASS}>
              <LuPlus aria-hidden="true" className="h-3.5 w-3.5" />
              Add payment
            </button>
          ) : null
        }
      />

      <div className="mt-4">
        <StatRow>
          <StatItem label="Outstanding" value={formatTotals(pending)} detail={plural(pending.length, "payment")} />
          <StatItem label={`Paid in ${year}`} value={formatTotals(paidThisYear)} detail={plural(paidThisYear.length, "payment")} />
          <StatItem label="All payments" value={payments.length} />
        </StatRow>
      </div>

      <FilterBar
        panelId="payments-panel"
        tabs={STATUS_TABS}
        activeTab={status}
        onTabChange={setStatus}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payments"
        resultCount={plural(visible.length, "payment")}
        className="mb-4 mt-6"
      />

      <section id="payments-panel" aria-label="Payments">
        {visible.length > 0 ? (
          <>
          {/* Phones get one card per payment; wider screens keep the table. */}
          <ul className="m-0 grid list-none gap-2 p-0 sm:hidden">
            {visible.map((payment) => (
              <li
                key={payment.id}
                onClick={(event) => { if (!(event.target as HTMLElement).closest("button, a")) router.push(`/dashboard/payments/${payment.id}`); }}
                className="cursor-pointer rounded-xl border border-border bg-background p-4 transition hover:border-foreground/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {isStaff ? <p className="m-0 truncate text-body font-semibold">{payment.payeeName}</p> : null}
                    <Link href={`/dashboard/payments/${payment.id}`} className={`m-0 block text-sm no-underline hover:text-primary ${isStaff ? "text-muted-foreground" : "font-semibold text-foreground"}`}>{payment.description}</Link>
                  </div>
                  <p className="m-0 shrink-0 text-body font-semibold tabular-nums">{formatAmount(payment.amount, payment.currency)}</p>
                </div>
                {payment.jobName ? <p className="m-0 mt-1 truncate text-xs text-muted-foreground">{payment.jobName}</p> : null}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">{payment.dueDate ? `Due ${longDate(payment.dueDate)}` : "No due date"}</span>
                  <Badge tone={payment.status === "paid" ? "neutral" : "active"}>
                    {payment.status === "paid" ? `Paid${payment.paidAt ? ` ${longDate(payment.paidAt.slice(0, 10))}` : ""}` : "Pending"}
                  </Badge>
                </div>
                {isStaff ? (
                  <div className="mt-3 flex gap-4">
                    <button type="button" onClick={() => void toggleStatus(payment)} className="text-xs font-semibold text-primary hover:underline">
                      {payment.status === "paid" ? "Mark pending" : "Mark paid"}
                    </button>
                    <button type="button" onClick={() => setEditing(payment)} className="text-xs font-semibold text-foreground hover:underline">Edit</button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto sm:block">
            <Table className="w-full border-collapse">
              <TableHeader>
                <TableRow>
                  {isStaff ? <TableHead>Payee</TableHead> : null}
                  <TableHead>For</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  {isStaff ? <TableHead><span className="sr-only">Actions</span></TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((payment) => (
                  <TableRow key={payment.id}>
                    {isStaff ? <TableCell className="px-4 py-4 font-semibold">{payment.payeeName}</TableCell> : null}
                    <TableCell className="px-4 py-4">
                      <Link href={`/dashboard/payments/${payment.id}`} className="block text-foreground hover:text-primary">{payment.description}</Link>
                      {payment.jobName ? (
                        <span className="text-[12px] text-muted-foreground">{payment.jobName}</span>
                      ) : null}
                      {payment.jobId ? <Link href={jobHref(payment.jobId)} className="mt-1 block text-xs text-primary hover:underline">View job</Link> : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums">
                      {formatAmount(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                      {payment.dueDate ? longDate(payment.dueDate) : "Not set"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-4">
                      <Badge tone={payment.status === "paid" ? "neutral" : "active"}>
                        {payment.status === "paid"
                          ? `Paid${payment.paidAt ? ` ${longDate(payment.paidAt.slice(0, 10))}` : ""}`
                          : "Pending"}
                      </Badge>
                    </TableCell>
                    {isStaff ? (
                      <TableCell className="px-4 py-4 text-right">
                        <span className="inline-flex gap-2">
                          <button type="button" onClick={() => void toggleStatus(payment)} className={LIST_ACTION_CLASS}>
                            {payment.status === "paid" ? "Mark pending" : "Mark paid"}
                          </button>
                          <button type="button" onClick={() => setEditing(payment)} className={LIST_ACTION_CLASS}>Edit</button>
                        </span>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </>
        ) : loaded ? (
          <EmptyState
            title={payments.length ? "No payments match" : "No payments yet"}
            description={
              payments.length
                ? "Try a different search term or status."
                : isStaff
                  ? "Add a payment to start tracking what is owed and what has been paid."
                  : "Payments owed to you will show up here."
            }
          />
        ) : null}
      </section>

      {isStaff && uid ? <AddPaymentDialog open={adding} onOpenChange={setAdding} createdBy={uid} /> : null}
      {isStaff ? <EditPaymentDialog payment={editing} onOpenChange={(open) => { if (!open) setEditing(null); }} onSaved={() => undefined} /> : null}
    </main>
  );
}

function AddPaymentDialog({
  open,
  onOpenChange,
  createdBy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createdBy: string;
}) {
  const [payees, setPayees] = React.useState<Payee[]>([]);
  const [jobs, setJobs] = React.useState<JobOption[]>([]);
  const [jobId, setJobId] = React.useState("");
  const [payeeUid, setPayeeUid] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<PaymentCurrency>("NGN");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || payees.length) return;
    void getDocs(collection(firebaseDb, "users")).then((snapshot) => {
      const seen = new Set<string>();
      const people: Payee[] = [];
      snapshot.docs.forEach((document) => {
        const data = document.data();
        if (typeof data.uid !== "string" || seen.has(data.uid)) return;
        seen.add(data.uid);
        people.push({ uid: data.uid, name: data.name || data.email || "Unnamed" });
      });
      setPayees(people.sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, [open, payees.length]);

  React.useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.all([jobsCollection().then((name) => getDocs(collection(firebaseDb, name))), getDocs(collection(firebaseDb, JOB_TERMS_COLLECTION))])
      .then(([jobSnapshot, termsSnapshot]) => {
        if (!active) return;
        const assignees = new Map(termsSnapshot.docs.map((item) => [item.id, (item.data() as JobTerms).assignedTo] as const));
        setJobs(jobSnapshot.docs
          .map((item) => ({ id: item.id, data: item.data() as { job?: string; name?: string; status?: string } }))
          .filter(({ data }) => data.status !== "completed")
          .map(({ id, data }) => ({ slug: id, name: data.job ?? data.name ?? id, assignedTo: assignees.get(id) ?? null }))
          .sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((cause) => console.error("Unable to load jobs for payment", cause));
    return () => { active = false; };
  }, [open]);

  const reset = () => {
    setPayeeUid("");
    setJobId("");
    setAmount("");
    setCurrency("NGN");
    setDescription("");
    setDueDate("");
    setError(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedJob = jobs.find((job) => job.slug === jobId);
    const payee = payees.find((entry) => entry.uid === payeeUid);
    const value = Number(amount.replace(/,/g, ""));
    if (!payee || !Number.isFinite(value) || value <= 0 || !description.trim()) {
      setError("Choose a payee, then enter an amount and what it is for.");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(firebaseDb, PAYMENTS_COLLECTION), {
        payeeUid: payee.uid,
        jobId: selectedJob?.slug ?? null,
        payeeName: payee.name,
        amount: value,
        currency,
        description: description.trim(),
        jobName: selectedJob?.name ?? null,
        status: "pending",
        dueDate: dueDate || null,
        paidAt: null,
        createdBy,
        createdAt: new Date().toISOString(),
      });
      reset();
      onOpenChange(false);
    } catch (cause) {
      console.error("Unable to add payment", cause);
      setError("Unable to save this payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add payment</DialogTitle>
          <DialogDescription>Record a payment owed to someone, then mark it paid once it has gone out.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="flex flex-col gap-4">
          {jobs.length ? <label className={FIELD}>Job (optional)<select value={jobId} onChange={(event) => { const selected = jobs.find((job) => job.slug === event.target.value); setJobId(event.target.value); if (selected?.assignedTo) setPayeeUid(selected.assignedTo); }} className={SELECT}><option value="">No job</option>{jobs.map((job) => <option key={job.slug} value={job.slug}>{job.name}</option>)}</select></label> : null}
          <label className={FIELD}>
            Payee
            <select value={payeeUid} onChange={(event) => setPayeeUid(event.target.value)} className={SELECT}>
              <option value="">Choose a person</option>
              {payees.map((payee) => (
                <option key={payee.uid} value={payee.uid}>
                  {payee.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
            <label className={FIELD}>
              Amount
              <Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" />
            </label>
            <label className={FIELD}>
              Currency
              <select value={currency} onChange={(event) => setCurrency(event.target.value as PaymentCurrency)} className={SELECT}>
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>
            </label>
          </div>
          <label className={FIELD}>
            What it is for
            <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Illustration for launch key visual" />
          </label>
          <label className={FIELD}>
            Due date
            <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
          {error ? <p className="m-0 text-[13px] text-primary">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className={LIST_ACTION_CLASS}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving" : "Add payment"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
