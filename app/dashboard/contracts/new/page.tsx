"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { addDoc, collection } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { TextField, TextareaField } from "@/components/detail-editor";
import { Input } from "@/components/ui/input";
import { CONTRACT_COLLECTION } from "@/lib/contracts";
import { isCreatorUser, type User } from "@/lib/users";

type CreatorWithUid = User & { uid: string };

/** Full-page agreement composer. Staff draft one agreement and send it to any number of creators at once. */
export default function NewContractPage() {
  return (
    <React.Suspense fallback={<PageLoadingSkeleton titleWidth="w-40" />}>
      <NewContractForm />
    </React.Suspense>
  );
}

function NewContractForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetUid = searchParams.get("creator");

  const { user: authUser, role, loading: authLoading } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const { users, loading: usersLoading, error: usersError } = useFirestoreUsers();

  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [selectedUids, setSelectedUids] = React.useState<string[]>([]);
  const [presetApplied, setPresetApplied] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sentTo, setSentTo] = React.useState<{ uid: string; name: string; slug: string }[] | null>(null);

  const creators = React.useMemo(
    () =>
      users
        .filter((user): user is CreatorWithUid => Boolean(user.uid) && isCreatorUser(user))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  React.useEffect(() => {
    if (presetApplied || !presetUid || !creators.length) return;
    if (creators.some((creator) => creator.uid === presetUid)) {
      setSelectedUids((current) => (current.includes(presetUid) ? current : [...current, presetUid]));
    }
    setPresetApplied(true);
  }, [presetApplied, presetUid, creators]);

  const visibleCreators = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return creators;
    return creators.filter((creator) =>
      [creator.name, creator.category].filter(Boolean).some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [creators, query]);

  const toggleCreator = (uid: string) => {
    setSelectedUids((current) => (current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid]));
  };

  const canSend = title.trim().length > 0 && body.trim().length > 0 && selectedUids.length > 0 && !busy;

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend || !authUser) return;
    setBusy(true);
    setError(null);
    try {
      const recipients = creators.filter((creator) => selectedUids.includes(creator.uid));
      const createdAt = new Date().toISOString();
      await Promise.all(
        recipients.map((creator) =>
          addDoc(collection(firebaseDb, CONTRACT_COLLECTION), {
            title: title.trim(),
            body: body.trim(),
            assignedTo: creator.uid,
            assignedToName: creator.name,
            createdBy: authUser.uid,
            createdByName: authUser.name ?? authUser.email,
            status: "pending",
            createdAt,
            updatedAt: createdAt,
            signedAt: null,
            signedName: null,
          }),
        ),
      );
      setSentTo(recipients.map((creator) => ({ uid: creator.uid, name: creator.name, slug: creator.slug })));
      setTitle("");
      setBody("");
      setSelectedUids([]);
    } catch (cause) {
      console.error("Unable to send agreement", cause);
      setError("Couldn’t send that agreement. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || usersLoading) return <PageLoadingSkeleton titleWidth="w-40" />;

  if (!isStaff) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-8">
        <PageHeader title="New agreement" />
        <p className="mt-6 text-sm text-muted-foreground">Only staff can send agreements.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-8">
      <PageHeader title="New agreement" description="Draft an NDA or other agreement, then share it with one or more creators to sign." />

      {sentTo ? (
        <div className="mt-6 space-y-4 rounded-xl border border-border p-5">
          <p className="m-0 text-[14px] font-semibold">Sent to {sentTo.map((creator) => creator.name).join(", ")}.</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="h-9 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Send another
            </button>
            {sentTo.length === 1 ? (
              <Link
                href={`/dashboard/creators/${sentTo[0].slug}`}
                className="inline-flex h-9 items-center rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground"
              >
                View creator profile
              </Link>
            ) : (
              <Link
                href="/dashboard/creators"
                className="inline-flex h-9 items-center rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground"
              >
                Back to creators
              </Link>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={send} className="mt-6 space-y-6">
          <section className="space-y-4 rounded-xl border border-border p-5 sm:p-6" aria-labelledby="new-contract-document-heading">
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Document</p>
              <h2 id="new-contract-document-heading" className="m-0 mt-1 text-[17px] font-semibold">Contract content</h2>
              <p className="mb-0 mt-1 text-[13px] leading-relaxed text-muted-foreground">This is the agreement the recipient will read and sign.</p>
            </div>
            <TextField label="Title" value={title} onChange={setTitle} placeholder="Mutual NDA" />
            <TextareaField label="Agreement text" value={body} onChange={setBody} rows={14} placeholder="Paste or write the full agreement text…" />
          </section>

          <section className="space-y-4 rounded-xl border border-border p-5 sm:p-6" aria-labelledby="new-contract-record-heading">
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Record</p>
              <h2 id="new-contract-record-heading" className="m-0 mt-1 text-[17px] font-semibold">Recipients and tracking</h2>
              <p className="mb-0 mt-1 text-[13px] leading-relaxed text-muted-foreground">Dates and signature details are added automatically as this agreement moves through its lifecycle.</p>
            </div>

          <div className="space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Share with{selectedUids.length > 0 ? ` (${selectedUids.length} selected)` : ""}
            </span>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search creators" aria-label="Search creators" />
            <div className="max-h-[min(50vh,380px)] overflow-y-auto rounded-lg border border-border">
              {usersError ? (
                <p className="m-0 px-4 py-8 text-center text-sm text-destructive">{usersError}</p>
              ) : visibleCreators.length ? (
                visibleCreators.map((creator) => {
                  const checked = selectedUids.includes(creator.uid);
                  return (
                    <label
                      key={creator.uid}
                      className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-muted/60"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCreator(creator.uid)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{creator.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{creator.category || "—"}</span>
                      </span>
                    </label>
                  );
                })
              ) : (
                <p className="m-0 px-4 py-8 text-center text-sm text-muted-foreground">No creators found.</p>
              )}
            </div>
            </div>
          </section>

          {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Sending…" : `Send to ${selectedUids.length} ${selectedUids.length === 1 ? "creator" : "creators"}`}
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
      )}
    </main>
  );
}
