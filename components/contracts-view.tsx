"use client";

import * as React from "react";
import Link from "next/link";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { firebaseDb } from "@/lib/firebase/client";
import { EmptyState } from "@/components/dashboard/ui";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestoreContractTemplates } from "@/lib/firebase/client-content";
import { CONTRACT_COLLECTION, formatDate, getContractUpdatedAt, sortContracts, type Contract } from "@/lib/contracts";

/**
 * Who's looking at this creator's agreements: staff draft and manage them,
 * the creator only signs. Editing and deleting an agreement is admin-only;
 * a manager can send and view agreements but not change or remove them.
 */
export type ContractViewer = { uid: string; name: string | null; isStaff: boolean; isAdmin: boolean };

function StatusBadge({ signed }: { signed: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${signed ? "bg-foreground text-background" : "bg-primary/10 text-primary"}`}
    >
      {signed ? "Signed" : "Awaiting signature"}
    </span>
  );
}

function SignDialog({ contract, defaultName, onSigned }: { contract: Contract; defaultName: string; onSigned: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(defaultName);
  const [agreed, setAgreed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSign = name.trim().length > 0 && agreed && !busy;

  const sign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSign) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, CONTRACT_COLLECTION, contract.id), {
        status: "signed",
        signedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        signedName: name.trim(),
      });
      onSigned();
      setOpen(false);
    } catch (cause) {
      console.error("Unable to sign agreement", cause);
      setError("Couldn’t record your signature. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        Review and sign
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{contract.title}</DialogTitle>
            <DialogDescription>Read the agreement, then type your full name to sign.</DialogDescription>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-[13px] leading-[1.6]">
            {contract.body}
          </div>

          <form onSubmit={sign} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="sign-name" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Full name</label>
              <Input id="sign-name" value={name} onChange={(event) => setName(event.target.value)} disabled={busy} placeholder="Type your full name" required />
            </div>
            <label className="flex items-start gap-2 text-[13px] text-foreground">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                disabled={busy}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              I have read this agreement and agree to its terms.
            </label>
            {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}
            <DialogFooter>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="h-9 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={!canSign} className="h-9 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Signing…" : "Sign agreement"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SendAgreementDialog({
  assignKey,
  creatorName,
  viewer,
  onSent,
}: {
  assignKey: string;
  creatorName: string;
  viewer: ContractViewer;
  onSent: () => void;
}) {
  const { templates, error: templatesError } = useFirestoreContractTemplates();
  const [open, setOpen] = React.useState(false);
  const [templateId, setTemplateId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedTemplate = templates.find((template) => template.id === templateId);
  const canSend = Boolean(selectedTemplate) && !busy;

  const send = async () => {
    if (!canSend || !selectedTemplate) return;
    setBusy(true);
    setError(null);
    try {
      const createdAt = new Date().toISOString();
      await addDoc(collection(firebaseDb, CONTRACT_COLLECTION), {
        title: selectedTemplate.title,
        body: selectedTemplate.body,
        assignedTo: assignKey,
        assignedToName: creatorName,
        createdBy: viewer.uid,
        createdByName: viewer.name,
        status: "pending",
        createdAt,
        updatedAt: createdAt,
        signedAt: null,
        signedName: null,
      });
      setTemplateId("");
      setOpen(false);
      onSent();
    } catch (cause) {
      console.error("Unable to send agreement", cause);
      setError("Couldn’t send that agreement. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        New agreement
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send an agreement</DialogTitle>
            <DialogDescription>Pick a template to send to {creatorName}.</DialogDescription>
          </DialogHeader>

          {templatesError ? (
            <p className="m-0 text-[13px] font-medium text-destructive">{templatesError}</p>
          ) : templates.length ? (
            <div className="space-y-3">
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Choose a template" /></SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate ? (
                <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-[13px] leading-[1.6]">
                  {selectedTemplate.body}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="m-0 text-[13px] text-muted-foreground">
              No agreement templates yet.{" "}
              {viewer.isAdmin ? (
                <Link href="/admin/contract-templates/new" className="font-semibold text-foreground underline underline-offset-2 hover:no-underline">
                  Create one
                </Link>
              ) : (
                "Ask an admin to create one."
              )}
            </p>
          )}

          {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}

          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} disabled={busy} className="h-9 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground disabled:opacity-50">Cancel</button>
            <button type="button" onClick={send} disabled={!canSend} className="h-9 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Sending…" : "Send agreement"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Agreements for one creator, shown on their profile page. Staff draft and manage them; the creator only signs. */
export function CreatorContractsPanel({ creatorUid, creatorSlug, creatorName, viewer }: { creatorUid: string | null | undefined; creatorSlug: string; creatorName: string; viewer: ContractViewer }) {
  // Agreements are still keyed by a real uid once the creator has signed in;
  // until then, fall back to their slug so staff can send one right away.
  const assignKey = creatorUid || creatorSlug;

  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async (uid: string) => {
    const snapshot = await getDocs(query(collection(firebaseDb, CONTRACT_COLLECTION), where("assignedTo", "==", uid)));
    const rows = snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<Contract, "id">) }));
    setContracts(sortContracts(rows));
  }, []);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    load(assignKey)
      .catch((cause) => {
        console.error("Unable to load agreements from Firestore", cause);
        if (active) setError("Unable to load agreements.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [assignKey, load]);

  const reload = () => void load(assignKey);

  const removeContract = async (contract: Contract) => {
    if (!window.confirm("Delete this agreement? This can’t be undone.")) return;
    setBusyId(contract.id);
    setError(null);
    try {
      await deleteDoc(doc(firebaseDb, CONTRACT_COLLECTION, contract.id));
      reload();
    } catch (cause) {
      console.error("Unable to delete agreement", cause);
      setError("Couldn’t delete that agreement. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading agreements" className="space-y-2">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px] text-primary">{error}</p> : null}

      {viewer.isStaff ? (
        <div className="flex justify-end">
          <SendAgreementDialog assignKey={assignKey} creatorName={creatorName} viewer={viewer} onSent={reload} />
        </div>
      ) : null}

      {contracts.length === 0 ? (
        <EmptyState
          title={viewer.isStaff ? "No agreements yet" : "Nothing to sign yet"}
          description={viewer.isStaff ? `Send an NDA or other agreement to ${creatorName}.` : "Agreements your team sends you will show up here."}
        />
      ) : viewer.isStaff ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-[560px] w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-4 py-3">Agreement</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Signed</th>
                <th className="px-4 py-3">Modified</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="border-b border-border last:border-b-0 align-top">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/dashboard/contracts/${contract.id}`} className="hover:text-primary">
                      {contract.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge signed={contract.status === "signed"} /></td>
                  <td className="px-4 py-3">
                    {contract.status === "signed" && contract.signedAt ? (
                      <span>{contract.signedName} · {formatDate(contract.signedAt)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(getContractUpdatedAt(contract))}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/dashboard/contracts/${contract.id}`}
                        aria-label={`View ${contract.title}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-foreground hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      {viewer.isAdmin ? (
                        <>
                          <Link
                            href={`/dashboard/contracts/${contract.id}/edit`}
                            aria-label={`Edit ${contract.title}`}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            aria-label={`Delete ${contract.title}`}
                            disabled={busyId === contract.id}
                            onClick={() => void removeContract(contract)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-destructive hover:text-destructive disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => (
            <div key={contract.id} className="rounded-xl border border-border p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 text-[15px] font-semibold">{contract.title}</p>
                  <p className="mb-0 mt-1 text-[12px] text-muted-foreground">
                    {contract.status === "signed" && contract.signedAt
                      ? `Signed ${formatDate(contract.signedAt)} as ${contract.signedName}`
                      : `Sent ${formatDate(contract.createdAt)}${contract.createdByName ? ` by ${contract.createdByName}` : ""}`}
                  </p>
                </div>
                <StatusBadge signed={contract.status === "signed"} />
              </div>
              {contract.status === "pending" ? (
                <div className="mt-4">
                  <SignDialog contract={contract} defaultName={viewer.name ?? ""} onSigned={reload} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
