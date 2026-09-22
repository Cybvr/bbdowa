"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { TextField, TextareaField } from "@/components/detail-editor";
import { CONTRACT_TEMPLATE_COLLECTION } from "@/lib/contract-templates";

export default function NewContractTemplatePage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSave = title.trim().length > 0 && body.trim().length > 0 && !busy;

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || !user) return;
    setBusy(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(firebaseDb, CONTRACT_TEMPLATE_COLLECTION), {
        title: title.trim(),
        body: body.trim(),
        createdBy: user.uid,
        createdByName: user.name ?? user.email,
        createdAt: now,
        updatedAt: now,
      });
      router.push("/admin/contract-templates");
    } catch (cause) {
      console.error("Unable to create template", cause);
      setError("Couldn’t create that template. Try again.");
      setBusy(false);
    }
  };

  if (authLoading) return <PageLoadingSkeleton titleWidth="w-40" />;

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="New document" />
        <p className="mt-6 text-sm text-muted-foreground">An admin account is required to manage documents.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
      <PageHeader title="New document" description="Create an agreement document staff can assign to creators." />

      <form onSubmit={save} className="mt-6 space-y-6">
        <section className="space-y-4 rounded-xl border border-border p-5 sm:p-6">
          <TextField label="Title" value={title} onChange={setTitle} placeholder="Mutual NDA" />
          <TextareaField label="Agreement text" value={body} onChange={setBody} rows={16} placeholder="Paste or write the full agreement text…" />
        </section>

        {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create document"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
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
