"use client";

import * as React from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CONTRACT_COLLECTION, formatDate, sortContracts, type Contract } from "@/lib/contracts";

/** Who's looking at this creator's agreements: staff draft and manage them, the creator only signs. */
export type ContractViewer = { uid: string; name: string | null; isStaff: boolean };

function StatusBadge({ signed }: { signed: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${signed ? "bg-foreground text-background" : "bg-primary/10 text-primary"}`}
    >
      {signed ? "Signed" : "Awaiting signature"}
    </span>
  );
}

function NewContractDialog({ creatorUid, creatorName, createdBy, createdByName, onCreated }: {
  creatorUid: string;
  creatorName: string;
  createdBy: string;
  createdByName: string | null;
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setBody("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const canSave = title.trim().length > 0 && body.trim().length > 0 && !busy;

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      await addDoc(collection(firebaseDb, CONTRACT_COLLECTION), {
        title: title.trim(),
        body: body.trim(),
        assignedTo: creatorUid,
        assignedToName: creatorName,
        createdBy,
        createdByName,
        status: "pending",
        createdAt: new Date().toISOString(),
        signedAt: null,
        signedName: null,
      });
      onCreated();
      setOpen(false);
      reset();
    } catch (cause) {
      console.error("Unable to create agreement", cause);
      setError("Couldn’t create that agreement. Try again.");
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

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New agreement</DialogTitle>
            <DialogDescription>Send an NDA or other agreement to {creatorName} to sign.</DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="contract-title" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Title</label>
              <Input id="contract-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={busy} placeholder="Mutual NDA" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contract-body" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Agreement text</label>
              <Textarea id="contract-body" value={body} onChange={(event) => setBody(event.target.value)} disabled={busy} placeholder="Paste the full agreement text…" rows={10} required />
            </div>
            {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}
            <DialogFooter>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="h-9 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={!canSave} className="h-9 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Sending…" : "Send agreement"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
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

/** Agreements for one creator, shown on their profile page. Staff draft and manage them; the creator only signs. */
export function CreatorContractsPanel({ creatorUid, creatorName, viewer }: { creatorUid: string | null | undefined; creatorName: string; viewer: ContractViewer }) {
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
    if (!creatorUid) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    load(creatorUid)
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
  }, [creatorUid, load]);

  const reload = () => {
    if (creatorUid) void load(creatorUid);
  };

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

  if (!creatorUid) {
    return viewer.isStaff ? (
      <EmptyState title="No account yet" description={`${creatorName} hasn’t signed in yet, so agreements can’t be sent until they do.`} />
    ) : null;
  }

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
          <NewContractDialog creatorUid={creatorUid} creatorName={creatorName} createdBy={viewer.uid} createdByName={viewer.name} onCreated={reload} />
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
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="border-b border-border last:border-b-0 align-top">
                  <td className="px-4 py-3 font-semibold">{contract.title}</td>
                  <td className="px-4 py-3"><StatusBadge signed={contract.status === "signed"} /></td>
                  <td className="px-4 py-3">
                    {contract.status === "signed" && contract.signedAt ? (
                      <span>{contract.signedName} · {formatDate(contract.signedAt)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Actions for ${contract.title}`}
                          disabled={busyId === contract.id}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-50"
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem variant="destructive" onSelect={() => void removeContract(contract)}>
                          <Trash2 className="h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
