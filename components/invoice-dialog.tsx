"use client";

import * as React from "react";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { firebaseDb } from "@/lib/firebase/client";
import { readJobsFromFirestore, useClientOptions } from "@/lib/firebase/client-content";
import { INVOICES_COLLECTION, nextInvoiceNumber, type Invoice, type InvoiceStatus } from "@/lib/invoices";
import { jobTitle, type Job } from "@/lib/jobs";
import type { PaymentCurrency } from "@/lib/payments";
import { confirmDialog } from "@/components/confirm-dialog";

const FIELD = "block space-y-1.5 text-sm font-medium";
const SELECT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const today = () => new Date().toISOString().slice(0, 10);

/** Create a new invoice, or edit/delete one when `invoice` is given. Staff only. */
export function InvoiceDialog({
  open,
  onOpenChange,
  invoice,
  existing,
  defaultClientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  /** All invoices, to work out the next number. */
  existing: Invoice[];
  defaultClientId?: string;
}) {
  const { user } = useAuth();
  const clientOptions = useClientOptions(undefined, { outsideOnly: true });
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [clientId, setClientId] = React.useState("");
  const [jobId, setJobId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<PaymentCurrency>("NGN");
  const [issueDate, setIssueDate] = React.useState(today());
  const [dueDate, setDueDate] = React.useState("");
  const [status, setStatus] = React.useState<InvoiceStatus>("draft");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    readJobsFromFirestore().then(setJobs).catch(() => setJobs([]));
  }, []);

  React.useEffect(() => {
    if (!open) return;
    setClientId(invoice?.clientId ?? defaultClientId ?? "");
    setJobId(invoice?.jobId ?? "");
    setDescription(invoice?.description ?? "");
    setAmount(invoice ? String(invoice.amount) : "");
    setCurrency(invoice?.currency ?? "NGN");
    setIssueDate(invoice?.issueDate ?? today());
    setDueDate(invoice?.dueDate ?? "");
    setStatus(invoice?.status ?? "draft");
    setError(null);
  }, [open, invoice, defaultClientId]);

  const clientJobs = jobs.filter((job) => job.clientId === clientId);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const value = Number(amount);
    if (!clientId) return setError("Pick the company.");
    if (!description.trim()) return setError("Say what the invoice is for.");
    if (!Number.isFinite(value) || value <= 0) return setError("Enter an amount above zero.");
    setSaving(true);
    setError(null);
    const job = clientJobs.find((item) => item.slug === jobId);
    const fields = {
      clientId,
      clientName: clientOptions.find((option) => option.value === clientId)?.label ?? invoice?.clientName ?? clientId,
      jobId: job?.slug ?? null,
      jobName: job ? jobTitle(job) : null,
      description: description.trim(),
      amount: value,
      currency,
      issueDate: issueDate || today(),
      dueDate: dueDate || null,
      status,
      paidAt: status === "paid" ? invoice?.paidAt ?? new Date().toISOString() : null,
    };
    try {
      if (invoice) {
        await updateDoc(doc(firebaseDb, INVOICES_COLLECTION, invoice.id), fields);
      } else {
        await addDoc(collection(firebaseDb, INVOICES_COLLECTION), {
          ...fields,
          number: nextInvoiceNumber(existing),
          createdBy: user?.uid ?? "",
          createdAt: new Date().toISOString(),
        });
      }
      onOpenChange(false);
    } catch (cause) {
      console.error("Unable to save invoice", cause);
      setError("Couldn’t save this invoice.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!invoice || saving || !await confirmDialog(`Delete invoice ${invoice.number}? This can't be undone.`)) return;
    setSaving(true);
    try {
      await deleteDoc(doc(firebaseDb, INVOICES_COLLECTION, invoice.id));
      onOpenChange(false);
    } catch (cause) {
      console.error("Unable to delete invoice", cause);
      setError("Couldn’t delete this invoice.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? `Edit ${invoice.number}` : "New invoice"}</DialogTitle>
          <DialogDescription>Drafts stay with us. Set it to Due to show it to the client.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <label className={FIELD}>Company
            <select value={clientId} onChange={(event) => { setClientId(event.target.value); setJobId(""); }} className={SELECT} required>
              <option value="">Choose a company</option>
              {clientOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className={FIELD}>Job (optional)
            <select value={jobId} onChange={(event) => setJobId(event.target.value)} className={SELECT} disabled={!clientId}>
              <option value="">No specific job</option>
              {clientJobs.map((job) => <option key={job.slug} value={job.slug}>{jobTitle(job)}</option>)}
            </select>
          </label>
          <label className={FIELD}>What it is for<Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. October retainer" required /></label>
          <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
            <label className={FIELD}>Amount<Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
            <label className={FIELD}>Currency<select value={currency} onChange={(event) => setCurrency(event.target.value as PaymentCurrency)} className={SELECT}><option value="NGN">NGN</option><option value="USD">USD</option></select></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={FIELD}>Issue date<Input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} /></label>
            <label className={FIELD}>Due date<Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
          </div>
          <label className={FIELD}>Status
            <select value={status} onChange={(event) => setStatus(event.target.value as InvoiceStatus)} className={SELECT}>
              <option value="draft">Draft</option>
              <option value="sent">Due</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <div className="flex items-center justify-between gap-3">
            {invoice ? <button type="button" onClick={() => void remove()} disabled={saving} className="h-9 rounded-md px-2 text-sm font-semibold text-destructive hover:underline disabled:opacity-50">Delete</button> : <span />}
            <button type="submit" disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : invoice ? "Save" : "Create invoice"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
