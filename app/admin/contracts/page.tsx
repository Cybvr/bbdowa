"use client";

import * as React from "react";
import Link from "next/link";
import { deleteDoc, doc } from "firebase/firestore";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { ContractStatusBadge } from "@/components/contract-metadata";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { firebaseDb } from "@/lib/firebase/client";
import { useFirestoreContracts } from "@/lib/firebase/client-content";
import { CONTRACT_COLLECTION, formatDate, getContractUpdatedAt } from "@/lib/contracts";

export default function AdminContractsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { contracts, loading, error } = useFirestoreContracts();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const removeContract = async (contractId: string, title: string) => {
    if (!window.confirm(`Delete “${title}”? This can’t be undone.`)) return;
    setBusyId(contractId);
    try {
      await deleteDoc(doc(firebaseDb, CONTRACT_COLLECTION, contractId));
      window.location.reload();
    } catch (cause) {
      console.error("Unable to delete agreement", cause);
      setBusyId(null);
    }
  };

  if (authLoading || loading) return <UsersTableSkeleton />;

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8">
        <PageHeader title="Contracts" />
        <p className="mt-8 text-sm text-muted-foreground">An admin account is required to manage contracts.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader
        title="Contracts"
        description="Create, review, update, and remove agreements sent to creators."
        meta={`${contracts.length} ${contracts.length === 1 ? "contract" : "contracts"}`}
        actions={
          <Link
            href="/dashboard/contracts/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            New contract
          </Link>
        }
      />

      <section className="mt-6">
        {error ? (
          <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px] text-primary">{error}</p>
        ) : contracts.length ? (
          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="min-w-[760px] w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-4 py-3">Contract</th>
                  <th className="px-4 py-3">Creator</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Modified</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} className="border-b border-border last:border-b-0 align-top">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/contracts/${contract.id}`} className="font-semibold text-foreground hover:text-primary">
                        {contract.title}
                      </Link>
                      {contract.createdByName ? <p className="m-0 mt-1 text-xs text-muted-foreground">By {contract.createdByName}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-foreground">{contract.assignedToName ?? "Unassigned"}</td>
                    <td className="px-4 py-3"><ContractStatusBadge status={contract.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(contract.createdAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(getContractUpdatedAt(contract))}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/dashboard/contracts/${contract.id}`}
                          aria-label={`View ${contract.title}`}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <Link
                          href={`/dashboard/contracts/${contract.id}/edit`}
                          aria-label={`Edit ${contract.title}`}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          aria-label={`Delete ${contract.title}`}
                          disabled={busyId === contract.id}
                          onClick={() => void removeContract(contract.id, contract.title)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-destructive hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No contracts yet" description="Create a contract to send an agreement to a creator." />
        )}
      </section>
    </main>
  );
}
