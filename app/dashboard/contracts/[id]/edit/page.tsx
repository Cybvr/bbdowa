"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { TextField, TextareaField } from "@/components/detail-editor";
import { ContractMetadata } from "@/components/contract-metadata";
import { CONTRACT_COLLECTION, type Contract } from "@/lib/contracts";

/** Admin-only edit of an agreement's title and text. Recipients and status are left untouched. */
export default function EditContractPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: authUser, isAdmin, loading: authLoading } = useAuth();

  const [contract, setContract] = React.useState<Contract | null>(null);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading || !authUser || !isAdmin) {
      setLoading(false);
      return;
    }
    let active = true;
    getDoc(doc(firebaseDb, CONTRACT_COLLECTION, id))
      .then((snapshot) => {
        if (!active) return;
        if (!snapshot.exists()) {
          setError("Agreement not found.");
          return;
        }
        const data = { id: snapshot.id, ...(snapshot.data() as Omit<Contract, "id">) };
        setContract(data);
        setTitle(data.title);
        setBody(data.body);
      })
      .catch((cause) => {
        console.error("Unable to load agreement", cause);
        if (active) setError("Unable to load that agreement.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, authUser, isAdmin, id]);

  const canSave = title.trim().length > 0 && body.trim().length > 0 && !busy;

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || !contract) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, CONTRACT_COLLECTION, contract.id), {
        title: title.trim(),
        body: body.trim(),
        updatedAt: new Date().toISOString(),
      });
      router.push(`/dashboard/contracts/${contract.id}`);
    } catch (cause) {
      console.error("Unable to save agreement", cause);
      setError("Couldn’t save that agreement. Try again.");
      setBusy(false);
    }
  };

  if (authLoading || loading) return <PageLoadingSkeleton titleWidth="w-40" />;

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="Edit agreement" />
        <p className="mt-6 text-sm text-muted-foreground">Only admins can edit agreements.</p>
      </main>
    );
  }

  if (error || !contract) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="Edit agreement" />
        <p className="mt-6 text-sm text-destructive">{error ?? "Agreement not found."}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-4">
      <PageHeader title="Edit agreement" description="Update the document content while keeping its record history visible below." />

      <form onSubmit={save} className="mt-6 space-y-6">
        <section className="space-y-4 rounded-xl border border-border p-5 sm:p-6" aria-labelledby="edit-contract-document-heading">
          <div>
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Document</p>
            <h2 id="edit-contract-document-heading" className="m-0 mt-1 text-[17px] font-semibold">Contract content</h2>
            <p className="mb-0 mt-1 text-[13px] leading-relaxed text-muted-foreground">Changes here update the agreement itself. The record details below are kept separately.</p>
          </div>
          <TextField label="Title" value={title} onChange={setTitle} placeholder="Mutual NDA" />
          <TextareaField label="Agreement text" value={body} onChange={setBody} rows={16} placeholder="Paste or write the full agreement text…" />
        </section>

        <ContractMetadata contract={{ ...contract, title, body }} />

        {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
            disabled={busy}
            className="h-10 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
