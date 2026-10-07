"use client";

import { useAuth } from "@/components/auth-provider";
import { AppraisalEditor } from "@/components/appraisal-editor";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { useFirestoreUsers } from "@/lib/firebase/client-content";

export default function NewAppraisalPage() {
  const { user, role, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useFirestoreUsers();
  if (authLoading || usersLoading) return <PageLoadingSkeleton titleWidth="w-40" />;
  if (!user || (role !== "admin" && role !== "manager")) return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"><PageHeader title="New appraisal" /><p className="mt-6 text-sm text-muted-foreground">A staff account is required.</p></main>;
  return <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-4 sm:px-8"><AppraisalEditor user={{ uid: user.uid, name: user.name ?? user.email }} users={users} /></main>;
}
