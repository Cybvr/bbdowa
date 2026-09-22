"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { AdminContractForm } from "@/components/admin-contract-form";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { useFirestoreContractTemplates, useFirestoreUsers } from "@/lib/firebase/client-content";

export default function NewAdminContractPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const { templates, loading: templatesLoading, error: templatesError } = useFirestoreContractTemplates();

  if (authLoading || usersLoading || templatesLoading) return <PageLoadingSkeleton titleWidth="w-40" />;

  if (!isAdmin || !user) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="New contract" />
        <p className="mt-6 text-sm text-muted-foreground">An admin account is required to create contracts.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
      <PageHeader title="New contract" description="Select a document, assign it to a creator, and send it for signature." />
      <AdminContractForm
        user={{ uid: user.uid, name: user.name ?? user.email }}
        users={users}
        templates={templates}
        templatesError={templatesError}
      />
    </main>
  );
}
