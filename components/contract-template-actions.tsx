"use client";

import * as React from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { firebaseDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import { EditSheet, TextareaField, TextField } from "@/components/detail-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CONTRACT_TEMPLATE_COLLECTION, type ContractTemplate } from "@/lib/contract-templates";

/** Admin-only: EditSheet already hides its trigger from anyone who isn't an admin. */
export function ContractTemplateCreateAction({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");

  const save = async () => {
    if (!user) throw new Error("You must be signed in.");
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) throw new Error("Title and body are required.");

    const now = new Date().toISOString();
    await addDoc(collection(firebaseDb, CONTRACT_TEMPLATE_COLLECTION), {
      title: cleanTitle,
      body: cleanBody,
      createdBy: user.uid,
      createdByName: user.name ?? user.email,
      createdAt: now,
      updatedAt: now,
    });

    setTitle("");
    setBody("");
    onCreated?.();
  };

  return (
    <EditSheet
      title="New template"
      description="Reusable agreement text staff can pick from when sending a contract."
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          New template
        </button>
      )}
      onSave={save}
    >
      <TextField label="Title" value={title} onChange={setTitle} placeholder="Mutual NDA" />
      <TextareaField label="Agreement text" value={body} onChange={setBody} rows={14} placeholder="Paste or write the full agreement text…" />
    </EditSheet>
  );
}

export function ContractTemplateActions({ template, onMutated }: { template: ContractTemplate; onMutated?: () => void }) {
  const [title, setTitle] = React.useState(template.title);
  const [body, setBody] = React.useState(template.body);

  const save = async () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) throw new Error("Title and body are required.");
    await updateDoc(doc(firebaseDb, CONTRACT_TEMPLATE_COLLECTION, template.id), {
      title: cleanTitle,
      body: cleanBody,
      updatedAt: serverTimestamp(),
    });
    onMutated?.();
  };

  const remove = async () => {
    await deleteDoc(doc(firebaseDb, CONTRACT_TEMPLATE_COLLECTION, template.id));
    onMutated?.();
  };

  return (
    <EditSheet
      title="Edit template"
      description={template.title}
      onSave={save}
      onDelete={remove}
      deleteConfirm="Delete this template? This can’t be undone."
      trigger={(open, removeFromMenu) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${template.title}`}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onSelect={open}><Pencil className="h-4 w-4" />Edit</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={removeFromMenu}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    >
      <TextField label="Title" value={title} onChange={setTitle} />
      <TextareaField label="Agreement text" value={body} onChange={setBody} rows={14} />
    </EditSheet>
  );
}
