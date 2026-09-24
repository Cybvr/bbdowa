"use client";

import Link from "next/link";
import { ArrowRight, CheckSquare, FileText, Users as UsersIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/ui";
import { ItemCard, ItemCardList } from "@/components/dashboard/item-card";
import { DocumentStatus } from "@/components/document-status";
import { TaskStatusBadge } from "@/components/tasks-view";
import { useFirestoreDocuments, useFirestoreTasks, useFirestoreUsers } from "@/lib/firebase/client-content";
import { formatDate as formatTaskDate, isOverdue } from "@/lib/creator-tasks";
import { formatDocumentDate } from "@/lib/documents";
import { isCreatorUser } from "@/lib/users";

export default function AdminPage() {
  const { role, loading } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const { users } = useFirestoreUsers();
  const { documents } = useFirestoreDocuments();
  const { tasks } = useFirestoreTasks();

  const recentUsers = [...users].sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? "")).slice(0, 5);
  const recentDocuments = documents.slice(0, 5);
  const recentTasks = tasks.slice(0, 5);

  if (!loading && !isStaff) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-8 sm:px-8">
        <PageHeader title="Admin" />
        <p className="mt-8 text-sm text-muted-foreground">A staff account is required for admin tools.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Admin" description="Data tools for the dashboard." />

      <div className="mt-6 space-y-8">
        {role === "admin" ? <section>
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="m-0 text-eyebrow font-semibold uppercase tracking-[0.08em] text-muted-foreground">Users</h2>
            <Link href="/admin/users" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition hover:underline">View all<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </div>
          {recentUsers.length ? (
            <ItemCardList>
              {recentUsers.map((person) => (
                <ItemCard
                  key={person.slug}
                  href={isCreatorUser(person) ? `/dashboard/discover/${person.slug}` : "/admin/users"}
                  icon={<UsersIcon className="h-5 w-5" aria-hidden="true" />}
                  title={person.name}
                  subtitle={person.category || person.title || person.role}
                />
              ))}
            </ItemCardList>
          ) : <p className="py-3 text-[13px] text-muted-foreground">No users yet.</p>}
        </section> : null}

        <section>
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="m-0 text-eyebrow font-semibold uppercase tracking-[0.08em] text-muted-foreground">Documents</h2>
            <Link href="/admin/documents" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition hover:underline">View all<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </div>
          {recentDocuments.length ? (
            <ItemCardList>
              {recentDocuments.map((document) => (
                <ItemCard
                  key={document.id}
                  href={`/dashboard/documents/${document.id}`}
                  icon={<FileText className="h-5 w-5" aria-hidden="true" />}
                  title={document.title}
                  subtitle={`Sent ${formatDocumentDate(document.createdAt)}${document.assignedToName ? ` · ${document.assignedToName}` : ""}`}
                  trailing={<DocumentStatus status={document.status} />}
                />
              ))}
            </ItemCardList>
          ) : <p className="py-3 text-[13px] text-muted-foreground">No documents yet.</p>}
        </section>

        <section>
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="m-0 text-eyebrow font-semibold uppercase tracking-[0.08em] text-muted-foreground">Tasks</h2>
            <Link href="/admin/tasks" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition hover:underline">View all<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </div>
          {recentTasks.length ? (
            <ItemCardList>
              {recentTasks.map((task) => (
                <ItemCard
                  key={task.id}
                  href="/admin/tasks"
                  icon={<CheckSquare className="h-5 w-5" aria-hidden="true" />}
                  title={task.title}
                  subtitle={`${task.assignedToName ?? "Unassigned"}${task.dueDate ? ` · Due ${formatTaskDate(task.dueDate)}` : ""}`}
                  trailing={<TaskStatusBadge status={task.status} overdue={isOverdue(task)} />}
                />
              ))}
            </ItemCardList>
          ) : <p className="py-3 text-[13px] text-muted-foreground">No tasks yet.</p>}
        </section>
      </div>
    </main>
  );
}
