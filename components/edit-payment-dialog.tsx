"use client";

import * as React from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { firebaseDb } from "@/lib/firebase/client";
import { PAYMENTS_COLLECTION, type Payment, type PaymentCurrency, type PaymentStatus } from "@/lib/payments";

const FIELD = "block space-y-1.5 text-sm font-medium";

/** Staff edit or delete a payment: amount, what it's for, due date and status. */
export function EditPaymentDialog({
  payment,
  onOpenChange,
  onSaved,
}: {
  payment: Payment | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState<PaymentCurrency>("NGN");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [status, setStatus] = React.useState<PaymentStatus>("pending");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!payment) return;
    setAmount(String(payment.amount));
    setCurrency(payment.currency);
    setDescription(payment.description);
    setDueDate(payment.dueDate ?? "");
    setStatus(payment.status);
    setError(null);
  }, [payment]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!payment || saving) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || !description.trim()) {
      setError("Enter an amount above zero and what it is for.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, PAYMENTS_COLLECTION, payment.id), {
        amount: value,
        currency,
        description: description.trim(),
        dueDate: dueDate || null,
        status,
        // Keep the original paid date if it was already paid.
        paidAt: status === "paid" ? payment.paidAt ?? new Date().toISOString() : null,
      });
      onOpenChange(false);
      onSaved();
    } catch (cause) {
      console.error("Unable to update payment", cause);
      setError("Couldn’t save this payment.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!payment || saving || !window.confirm("Delete this payment? This can't be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await deleteDoc(doc(firebaseDb, PAYMENTS_COLLECTION, payment.id));
      onOpenChange(false);
      onSaved();
    } catch (cause) {
      console.error("Unable to delete payment", cause);
      setError("Couldn’t delete this payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(payment)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit payment</DialogTitle>
          <DialogDescription>{payment ? `To ${payment.payeeName}${payment.jobName ? ` for ${payment.jobName}` : ""}.` : ""}</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
            <label className={FIELD}>Amount<Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
            <label className={FIELD}>Currency<select value={currency} onChange={(event) => setCurrency(event.target.value as PaymentCurrency)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="NGN">NGN</option><option value="USD">USD</option></select></label>
          </div>
          <label className={FIELD}>What it is for<Input value={description} onChange={(event) => setDescription(event.target.value)} required /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className={FIELD}>Due date<Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
            <label className={FIELD}>Status<select value={status} onChange={(event) => setStatus(event.target.value as PaymentStatus)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="pending">Pending</option><option value="paid">Paid</option></select></label>
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => void remove()} disabled={saving} className="h-9 rounded-md px-2 text-sm font-semibold text-destructive hover:underline disabled:opacity-50">Delete</button>
            <button type="submit" disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
