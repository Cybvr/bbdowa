"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { ContractMetadata, ContractStatusBadge } from "@/components/contract-metadata";
import { SelectField, TextareaField, TextField } from "@/components/detail-editor";
import { CONTRACT_COLLECTION, type Contract } from "@/lib/contracts";
import { isCreatorUser, type User } from "@/lib/users";
import type { ContractTemplate } from "@/lib/contract-templates";

type AdminContractFormProps = {
  user: { uid: string; name: string | null };
  users: User[];
  templates: ContractTemplate[];
  contract?: Contract;
  templatesError?: string | null;
};

function userKey(user: User): string {
  return user.uid || user.slug;
}

export function AdminContractForm({ user, users, templates, contract, templatesError }: AdminContractFormProps) {
  const router = useRouter();
  const isEditing = Boolean(contract);
  const isSigned = contract?.status === "signed";
  const [documentId, setDocumentId] = React.useState(contract?.documentId ?? "");
  const [title, setTitle] = React.useState(contract?.title ?? "");
  const [body, setBody] = React.useState(contract?.body ?? "");
  const [assignedTo, setAssignedTo] = React.useState(contract?.assignedTo ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const assignableUsers = React.useMemo(() => {
    const candidates = users.filter((candidate) => candidate.slug && isCreatorUser(candidate));
    if (contract?.assignedTo && !candidates.some((candidate) => userKey(candidate) === contract.assignedTo)) {
      const current = users.find(
        (candidate) => candidate.uid === contract.assignedTo || candidate.slug === contract.assignedTo,
      );
      if (current) candidates.push(current);
    }
    return candidates.sort((a, b) => a.name.localeCompare(b.name));
  }, [contract?.assignedTo, users]);

  const assignmentOptions = assignableUsers.map((candidate) => ({
    value: userKey(candidate),
    label: candidate.name,
  }));
  const selectedAssignee = assignableUsers.find((candidate) => userKey(candidate) === assignedTo);

  const documentOptions = [
    ...(contract && !documentId ? [{ value: "__current__", label: "Current contract document" }] : []),
    ...templates.map((template) => ({ value: template.id, label: template.title })),
  ];

  const selectedTemplate = templates.find((template) => template.id === documentId);
  const canSave = Boolean(title.trim() && body.trim() && assignedTo && (!isEditing || !isSigned)) && !busy;

  const selectDocument = (value: string) => {
    if (value === "__current__") {
      setDocumentId("");
      return;
    }
    const template = templates.find((candidate) => candidate.id === value);
    setDocumentId(value);
    if (template) {
      setTitle(template.title);
      setBody(template.body);
    }
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError(null);

    const selectedUser = assignableUsers.find((candidate) => userKey(candidate) === assignedTo);
    const assignedToName = selectedUser?.name ?? contract?.assignedToName ?? null;
    const now = new Date().toISOString();

    try {
      if (contract) {
        await updateDoc(doc(firebaseDb, CONTRACT_COLLECTION, contract.id), {
          title: title.trim(),
          body: body.trim(),
          documentId: documentId || null,
          assignedTo,
          assignedToName,
          updatedAt: now,
        });
        router.push(`/admin/contracts`);
      } else {
        await addDoc(collection(firebaseDb, CONTRACT_COLLECTION), {
          title: title.trim(),
          body: body.trim(),
          documentId: documentId || null,
          assignedTo,
          assignedToName,
          createdBy: user.uid,
          createdByName: user.name,
          status: "pending",
          createdAt: now,
          updatedAt: now,
          signedAt: null,
          signedName: null,
        });
        router.push(`/admin/contracts`);
      }
    } catch (cause) {
      console.error("Unable to save contract", cause);
      setError("Couldn’t save this contract. Check the document and assignee, then try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-6 space-y-6">
      {isSigned ? (
        <section className="rounded-xl border border-primary/25 bg-primary/5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Contract status</p>
              <p className="mb-0 mt-1 text-[13px] leading-relaxed text-muted-foreground">
                This contract has been signed and is locked. Duplicate it from the contracts table to create an editable pending version.
              </p>
            </div>
            <ContractStatusBadge status="signed" />
          </div>
        </section>
      ) : null}

      <section className="space-y-4 rounded-xl border border-border p-5 sm:p-6" aria-labelledby="admin-contract-document-heading">
        <div>
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Document</p>
          <h2 id="admin-contract-document-heading" className="m-0 mt-1 text-[17px] font-semibold">Contract document</h2>
          <p className="mb-0 mt-1 text-[13px] leading-relaxed text-muted-foreground">Choose the reusable document, then adjust the contract snapshot if needed.</p>
        </div>

        {templatesError ? <p className="m-0 text-[13px] font-medium text-destructive">{templatesError}</p> : null}
        {documentOptions.length ? (
          <SelectField
            label="Document"
            value={documentId || (contract ? "__current__" : "")}
            onChange={selectDocument}
            options={documentOptions}
          />
        ) : (
          <p className="m-0 rounded-lg border border-dashed border-border px-3 py-2 text-[13px] text-muted-foreground">
            No documents exist yet. Create one in Documents before creating a contract.
          </p>
        )}
        {selectedTemplate ? <p className="m-0 text-xs text-muted-foreground">Loaded from “{selectedTemplate.title}”.</p> : null}
        <TextField label="Contract title" value={title} onChange={setTitle} placeholder="Mutual NDA" />
        <TextareaField label="Agreement text" value={body} onChange={setBody} rows={18} placeholder="The full agreement text…" />
      </section>

      <section className="space-y-4 rounded-xl border border-border p-5 sm:p-6" aria-labelledby="admin-contract-assignment-heading">
        <div>
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Delivery</p>
          <h2 id="admin-contract-assignment-heading" className="m-0 mt-1 text-[17px] font-semibold">Assign contract</h2>
        </div>
        {assignmentOptions.length ? (
          <SelectField label="Assign to creator" value={assignedTo} onChange={setAssignedTo} options={assignmentOptions} />
        ) : (
          <p className="m-0 text-[13px] text-muted-foreground">No creator profiles are available to assign this contract to.</p>
        )}
      </section>

      {contract ? <ContractMetadata contract={{ ...contract, title, body, assignedToName: selectedAssignee?.name ?? contract.assignedToName }} /> : null}
      {error ? <p className="m-0 text-[13px] font-medium text-destructive">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving…" : isEditing ? "Save contract" : "Create contract"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/contracts")}
          disabled={busy}
          className="h-10 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
