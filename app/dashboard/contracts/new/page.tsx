"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { addDoc, collection } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useFirestoreContractTemplates, useFirestoreUsers } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTRACT_COLLECTION } from "@/lib/contracts";
import { isCreatorUser } from "@/lib/users";

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

  const { user: authUser, role, isAdmin, loading: authLoading } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const { users, loading: usersLoading, error: usersError } = useFirestoreUsers();
  const { templates, loading: templatesLoading, error: templatesError } = useFirestoreContractTemplates();

  const [templateId, setTemplateId] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [selectedUids, setSelectedUids] = React.useState<string[]>([]);
  const [presetApplied, setPresetApplied] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sentTo, setSentTo] = React.useState<{ uid: string; name: string; slug: string }[] | null>(null);

  const creators = React.useMemo(
    () =>
      users
        .filter(isCreatorUser)
        // A creator who's never signed in has no uid yet — fall back to their
        // slug so staff can still send them an agreement right away.
        .map((user) => ({ ...user, assignKey: user.uid || user.slug }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  React.useEffect(() => {
    if (presetApplied || !presetUid || !creators.length) return;
    if (creators.some((creator) => creator.assignKey === presetUid)) {
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

  const selectedTemplate = templates.find((template) => template.id === templateId);
  const canSend = Boolean(selectedTemplate) && selectedUids.length > 0 && !busy;

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend || !authUser || !selectedTemplate) return;
    setBusy(true);
    setError(null);
    try {
      const recipients = creators.filter((creator) => selectedUids.includes(creator.assignKey));
      const createdAt = new Date().toISOString();
      await Promise.all(
        recipients.map((creator) =>
          addDoc(collection(firebaseDb, CONTRACT_COLLECTION), {
            title: selectedTemplate.title,
            body: selectedTemplate.body,
            assignedTo: creator.assignKey,
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
      setSentTo(recipients.map((creator) => ({ uid: creator.assignKey, name: creator.name, slug: creator.slug })));
      setTemplateId("");
      setSelectedUids([]);
    } catch (cause) {
      console.error("Unable to send agreement", cause);
      setError("Couldn’t send that agreement. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || usersLoading || templatesLoading) return <PageLoadingSkeleton titleWidth="w-40" />;

  if (!isStaff) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="New agreement" />
        <p className="mt-6 text-sm text-muted-foreground">Only staff can send agreements.</p>
      </main>
    );
  }

  return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-4">
      <PageHeader
        title="New agreement"
        description="Pick a template, then share it with one or more creators to sign."
        actions={isAdmin ? (
          <Link href="/admin/contract-templates" className="text-[13px] font-semibold text-foreground underline underline-offset-2 hover:no-underline">
            Manage templates
          </Link>
        ) : undefined}
      />

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

            {templatesError ? (
              <p className="m-0 text-[13px] font-medium text-destructive">{templatesError}</p>
            ) : templates.length ? (
              <>
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Template</span>
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Choose a template" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTemplate ? (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
                    {selectedTemplate.body}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="m-0 text-[13px] text-muted-foreground">
                No agreement templates yet.{" "}
                {isAdmin ? (
                  <Link href="/admin/contract-templates" className="font-semibold text-foreground underline underline-offset-2 hover:no-underline">
                    Create one
                  </Link>
                ) : (
                  "Ask an admin to create one."
                )}
              </p>
            )}
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
                  const checked = selectedUids.includes(creator.assignKey);
                  return (
                    <label
                      key={creator.assignKey}
                      className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-muted/60"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCreator(creator.assignKey)}
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
