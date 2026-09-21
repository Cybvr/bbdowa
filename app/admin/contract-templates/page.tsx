"use client";

import * as React from "react";
import Link from "next/link";
import { addDoc, collection } from "firebase/firestore";
import { Copy, Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { PageHeader } from "@/components/dashboard/ui";
import { useFirestoreContractTemplates } from "@/lib/firebase/client-content";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { CONTRACT_TEMPLATE_COLLECTION } from "@/lib/contract-templates";

export default function AdminContractTemplatesPage() {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const { templates, loading, error } = useFirestoreContractTemplates();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const duplicateTemplate = async (template: (typeof templates)[number]) => {
    if (!user) return;
    setBusyId(template.id);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(firebaseDb, CONTRACT_TEMPLATE_COLLECTION), {
        title: `${template.title} (Copy)`,
        body: template.body,
        createdBy: user.uid,
        createdByName: user.name ?? user.email,
        createdAt: now,
        updatedAt: now,
      });
      window.location.reload();
    } catch (cause) {
      console.error("Unable to duplicate template", cause);
      setBusyId(null);
    }
  };

  if (authLoading || loading) {
    return <UsersTableSkeleton />;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-8 sm:px-8">
        <PageHeader title="Agreement templates" />
        <p className="mt-8 text-sm text-muted-foreground">An admin account is required to manage agreement templates.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader
        title="Agreement templates"
        description="Reusable NDA and agreement text. Staff pick one when sending a contract to a creator."
        meta={`${templates.length} ${templates.length === 1 ? "template" : "templates"}`}
        actions={
          <Link
            href="/admin/contract-templates/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            New template
          </Link>
        }
      />

      <section className="mt-6 overflow-hidden rounded-xl border border-border bg-background">
        {error ? (
          <p className="px-5 py-8 text-center text-sm text-destructive">{error}</p>
        ) : templates.length ? (
          <ul className="divide-y divide-border">
            {templates.map((template) => (
              <li key={template.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <Link
                  href={`/admin/contract-templates/${template.id}/edit`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-4 no-underline"
                >
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[14px] font-semibold text-foreground">{template.title}</p>
                    <p className="m-0 mt-0.5 line-clamp-1 text-xs text-muted-foreground">{template.body}</p>
                  </div>
                  <span aria-hidden="true" className="text-lg text-muted-foreground">→</span>
                </Link>
                <button
                  type="button"
                  aria-label={`Duplicate ${template.title}`}
                  title="Duplicate template"
                  disabled={busyId === template.id}
                  onClick={() => void duplicateTemplate(template)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="m-0 text-[15px] font-semibold">No templates yet</p>
            <p className="mb-0 mt-1 text-sm text-muted-foreground">Create one so staff can send it to a creator.</p>
          </div>
        )}
      </section>
    </main>
  );
}
