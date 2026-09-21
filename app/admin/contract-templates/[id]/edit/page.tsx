"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { TextField, TextareaField } from "@/components/detail-editor";
import { CONTRACT_TEMPLATE_COLLECTION, type ContractTemplate } from "@/lib/contract-templates";

export default function EditContractTemplatePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { isAdmin, loading: authLoading } = useAuth();

  const [template, setTemplate] = React.useState<ContractTemplate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState<null | "save" | "delete">(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading || !isAdmin) return;
    let active = true;
    getDoc(doc(firebaseDb, CONTRACT_TEMPLATE_COLLECTION, params.id))
      .then((snapshot) => {
        if (!active) return;
        if (!snapshot.exists()) {
          setError("That template no longer exists.");
          setLoading(false);
          return;
        }
        const data = { id: snapshot.id, ...(snapshot.data() as Omit<ContractTemplate, "id">) };
        setTemplate(data);
        setTitle(data.title);
        setBody(data.body);
        setLoading(false);
      })
      .catch((cause) => {
        console.error("Unable to load template", cause);
        if (active) {
          setError("Unable to load that template.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [authLoading, isAdmin, params.id]);

  const canSave = title.trim().length > 0 && body.trim().length > 0 && busy === null;

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || !template) return;
    setBusy("save");
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, CONTRACT_TEMPLATE_COLLECTION, template.id), {
        title: title.trim(),
        body: body.trim(),
        updatedAt: serverTimestamp(),
      });
      router.push("/admin/contract-templates");
    } catch (cause) {
      console.error("Unable to save template", cause);
      setError("Couldn’t save that template. Try again.");
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!template) return;
    if (!window.confirm("Delete this template? This can’t be undone.")) return;
    setBusy("delete");
    setError(null);
    try {
      await deleteDoc(doc(firebaseDb, CONTRACT_TEMPLATE_COLLECTION, template.id));
      router.push("/admin/contract-templates");
    } catch (cause) {
      console.error("Unable to delete template", cause);
      setError("Couldn’t delete that template. Try again.");
      setBusy(null);
    }
  };

  if (authLoading || loading) return <PageLoadingSkeleton titleWidth="w-40" />;

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="Edit template" />
        <p className="mt-6 text-sm text-muted-foreground">An admin account is required to manage agreement templates.</p>
      </main>
    );
  }

  if (!template) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="Edit template" />
        <p className="mt-6 text-sm text-destructive">{error ?? "That template no longer exists."}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-4">
      <PageHeader title="Edit template" description="Reusable agreement text staff can pick from when sending a contract." />

      <form onSubmit={save} className="mt-6 space-y-6">
        <section className="space-y-4 rounded-xl border border-border p-5 sm:p-6">
          <TextField label="Title" value={title} onChange={setTitle} />
          <TextareaField label="Agreement text" value={body} onChange={setBody} rows={16} />
        </section>

        {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!canSave}
              className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "save" ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={busy !== null}
              className="h-10 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={busy !== null}
            className="h-10 rounded-md border border-destructive/30 px-4 text-[13px] font-semibold text-destructive transition hover:border-destructive disabled:opacity-50"
          >
            {busy === "delete" ? "Deleting…" : "Delete template"}
          </button>
        </div>
      </form>
    </main>
  );
}
