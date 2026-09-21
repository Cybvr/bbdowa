"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, deleteDoc, getDoc } from "firebase/firestore";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import { DetailBreadcrumb } from "@/components/dashboard/detail-hero";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { ContractSidebarSummary } from "@/components/contract-metadata";
import { CONTRACT_COLLECTION, type Contract } from "@/lib/contracts";

/** Read-only agreement detail. Edit and delete are admin-only; anyone assigned or on staff can view. */
export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: authUser, isAdmin, loading: authLoading } = useAuth();
  const { users } = useFirestoreUsers();

  const [contract, setContract] = React.useState<Contract | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (authLoading || !authUser) return;
    let active = true;
    getDoc(doc(firebaseDb, CONTRACT_COLLECTION, id))
      .then((snapshot) => {
        if (!active) return;
        if (!snapshot.exists()) {
          setError("Agreement not found.");
          return;
        }
        setContract({ id: snapshot.id, ...(snapshot.data() as Omit<Contract, "id">) });
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
  }, [authLoading, authUser, id]);

  const assignedSlug = contract
    ? users.find((user) => user.uid === contract.assignedTo)?.slug ?? users.find((user) => user.slug === contract.assignedTo)?.slug
    : undefined;

  const removeContract = async () => {
    if (!contract) return;
    if (!window.confirm("Delete this agreement? This can’t be undone.")) return;
    setBusy(true);
    try {
      await deleteDoc(doc(firebaseDb, CONTRACT_COLLECTION, contract.id));
      router.push(assignedSlug ? `/dashboard/creators/${assignedSlug}` : "/dashboard/creators");
    } catch (cause) {
      console.error("Unable to delete agreement", cause);
      setError("Couldn’t delete that agreement. Try again.");
      setBusy(false);
    }
  };

  if (authLoading || loading) return <PageLoadingSkeleton titleWidth="w-48" />;

  if (!authUser) {
    return (
      <main className="flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-4">
        <p className="text-sm text-muted-foreground">Sign in to view this agreement.</p>
      </main>
    );
  }

  if (error || !contract) {
    return (
      <main className="flex-1 px-3 pb-10 pt-3 sm:px-8 sm:pb-16 sm:pt-4">
        <p className="text-sm text-destructive">{error ?? "Agreement not found."}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-3 pb-6 pt-3 sm:px-8 sm:pb-8 sm:pt-5 nav:h-[calc(100vh-60px)] nav:overflow-hidden nav:pb-4">
      <DetailBreadcrumb
        crumbs={[
          ...(assignedSlug ? [{ label: contract.assignedToName ?? "Creator", href: `/dashboard/creators/${assignedSlug}` }] : []),
          { label: contract.title },
        ]}
        actions={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/contracts/${contract.id}/edit`}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-semibold text-foreground transition hover:border-foreground"
              >
                <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                Edit
              </Link>
              <button
                type="button"
                onClick={() => void removeContract()}
                disabled={busy}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-semibold text-destructive transition hover:border-destructive disabled:opacity-50"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="mt-3 flex flex-1 flex-col gap-4 sm:mt-4 nav:min-h-0 nav:flex-row nav:items-stretch nav:gap-6">
        <aside className="nav:w-[300px] nav:flex-none nav:overflow-y-auto">
          <ContractSidebarSummary contract={contract} />
        </aside>

        <section
          aria-label="Agreement document"
          className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-muted/30 nav:h-full nav:min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-[680px] rounded-sm border border-border/60 bg-background shadow-md">
              <header className="border-b border-border/60 px-8 py-6 sm:px-10">
                <img
                  src="/bbdo-west-africa.png"
                  alt="BBDO West Africa"
                  className="h-8 w-auto object-contain object-left"
                />
                <h2 className="m-0 mt-1 text-[19px] font-bold tracking-tight text-foreground">{contract.title}</h2>
              </header>
              <div className="whitespace-pre-wrap px-8 py-8 text-[14px] leading-[1.75] text-foreground sm:px-10">
                {contract.body}
              </div>
              <footer className="border-t border-border/60 px-8 py-4 sm:px-10">
                <p className="m-0 text-[11px] leading-relaxed text-muted-foreground">
                  13 Ologun Agbaje St, Victoria Island, Lagos 106104, Lagos ·{" "}
                  <a href="https://www.bbdowestafrica.com" className="transition hover:text-foreground">
                    www.bbdowestafrica.com
                  </a>
                </p>
                <p className="m-0 mt-1 text-[11px] text-muted-foreground">Confidential · not for distribution</p>
              </footer>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
