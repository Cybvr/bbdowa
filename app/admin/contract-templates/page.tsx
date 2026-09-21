"use client";

import * as React from "react";
import Link from "next/link";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { PageHeader } from "@/components/dashboard/ui";
import { useFirestoreContractTemplates } from "@/lib/firebase/client-content";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { formatDate } from "@/lib/contracts";
import { CONTRACT_TEMPLATE_COLLECTION } from "@/lib/contract-templates";

export default function AdminContractTemplatesPage() {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const { templates, loading, error } = useFirestoreContractTemplates();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const formatTemplateDate = (value: unknown) => {
    if (typeof value === "string") return formatDate(value);
    if (value && typeof value === "object") {
      const timestamp = value as { toDate?: () => Date };
      if (typeof timestamp.toDate === "function") return formatDate(timestamp.toDate().toISOString());
    }
    return "—";
  };

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

  const removeTemplate = async (templateId: string, title: string) => {
    if (!window.confirm(`Delete “${title}”? This can’t be undone.`)) return;
    setBusyId(templateId);
    try {
      await deleteDoc(doc(firebaseDb, CONTRACT_TEMPLATE_COLLECTION, templateId));
      window.location.reload();
    } catch (cause) {
      console.error("Unable to delete template", cause);
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

      <section className="mt-6 overflow-x-auto rounded-xl border border-border bg-background">
        {error ? (
          <p className="px-5 py-8 text-center text-sm text-destructive">{error}</p>
        ) : templates.length ? (
          <table className="min-w-[760px] w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-4 py-3">Template</th>
                <th className="px-4 py-3">Created by</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Modified</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} className="border-b border-border last:border-b-0 align-top">
                  <td className="max-w-[420px] px-4 py-3">
                    <Link href={`/admin/contract-templates/${template.id}/edit`} className="font-semibold text-foreground hover:text-primary">
                      {template.title}
                    </Link>
                    <p className="m-0 mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{template.body}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground">{template.createdByName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatTemplateDate(template.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatTemplateDate(template.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/admin/contract-templates/${template.id}/edit`}
                        aria-label={`Edit ${template.title}`}
                        title="Edit template"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Duplicate ${template.title}`}
                        title="Duplicate template"
                        disabled={busyId === template.id}
                        onClick={() => void duplicateTemplate(template)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${template.title}`}
                        title="Delete template"
                        disabled={busyId === template.id}
                        onClick={() => void removeTemplate(template.id, template.title)}
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
