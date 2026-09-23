"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { DocumentEditor } from "@/components/document-editor";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { useFirestoreUsers } from "@/lib/firebase/client-content";

export default function NewDocumentPage() {
  const { user, role, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [assignee, setAssignee] = React.useState("");
  React.useEffect(() => { setAssignee(new URLSearchParams(window.location.search).get("assignee") ?? ""); }, []);
  if (authLoading || usersLoading) return <PageLoadingSkeleton titleWidth="w-40" />;
  if (!user || (role !== "admin" && role !== "manager")) return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"><PageHeader title="New document" /><p className="mt-6 text-sm text-muted-foreground">A staff account is required.</p></main>;
  return <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-4 sm:px-8"><DocumentEditor key={assignee} user={{ uid: user.uid, name: user.name ?? user.email }} users={users} initialAssignee={assignee} /></main>;
}
