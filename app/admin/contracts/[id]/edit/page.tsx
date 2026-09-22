"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { AdminContractForm } from "@/components/admin-contract-form";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { useFirestoreContractTemplates, useFirestoreUsers } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import { CONTRACT_COLLECTION, type Contract } from "@/lib/contracts";

export default function EditAdminContractPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const { templates, loading: templatesLoading, error: templatesError } = useFirestoreContractTemplates();
  const [contract, setContract] = React.useState<Contract | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading || !user || !isAdmin) {
      setLoading(false);
      return;
    }

    let active = true;
    getDoc(doc(firebaseDb, CONTRACT_COLLECTION, id))
      .then((snapshot) => {
        if (!active) return;
        if (!snapshot.exists()) {
          setError("Contract not found.");
          return;
        }
        setContract({ id: snapshot.id, ...(snapshot.data() as Omit<Contract, "id">) });
      })
      .catch((cause) => {
        console.error("Unable to load contract", cause);
        if (active) setError("Unable to load this contract.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, id, isAdmin, user]);

  if (authLoading || loading || usersLoading || templatesLoading) return <PageLoadingSkeleton titleWidth="w-40" />;

  if (!isAdmin || !user) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="Edit contract" />
        <p className="mt-6 text-sm text-muted-foreground">An admin account is required to edit contracts.</p>
      </main>
    );
  }

  if (error || !contract) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="Edit contract" />
        <p className="mt-6 text-sm text-destructive">{error ?? "Contract not found."}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
      <PageHeader title="Edit contract" description="Update the document assignment and contract record from the admin workspace." />
      <AdminContractForm
        user={{ uid: user.uid, name: user.name ?? user.email }}
        users={users}
        templates={templates}
        templatesError={templatesError}
        contract={contract}
      />
    </main>
  );
}
