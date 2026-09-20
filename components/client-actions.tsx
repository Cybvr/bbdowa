"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ImageWithFallback } from "@/components/empty-thumbnail";
import { firebaseDb } from "@/lib/firebase/client";
import { EditSheet, TextField, TextareaField } from "@/components/detail-editor";
import type { Client } from "@/lib/clients";

export function ClientActions({ client }: { client: Client }) {
  const router = useRouter();

  const [name, setName] = React.useState(client.name ?? "");
  const [industry, setIndustry] = React.useState(client.industry ?? "");
  const [date, setDate] = React.useState(client.date ?? "");
  const [profileImage, setProfileImage] = React.useState(client.profileImage ?? "");
  const [description, setDescription] = React.useState(client.description ?? "");
  const [targetAudience, setTargetAudience] = React.useState(client.targetAudience ?? "");

  const save = async () => {
    await updateDoc(doc(firebaseDb, "clients", client.slug), {
      name: name.trim(),
      industry: industry.trim(),
      date: date.trim() || null,
      profileImage: profileImage.trim() || null,
      description: description.trim() || null,
      targetAudience: targetAudience.trim() || null,
      updatedAt: serverTimestamp(),
    });
    router.refresh();
  };

  const remove = async () => {
    await deleteDoc(doc(firebaseDb, "clients", client.slug));
    router.push("/dashboard/clients");
  };

  return (
    <EditSheet
      title="Edit client"
      description={client.name}
      onSave={save}
      onDelete={remove}
      deleteConfirm="Delete this client? Its campaigns are not removed. This can’t be undone."
    >
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/20 p-4">
        <button
          type="button"
          onClick={() => document.getElementById("client-profile-image")?.focus()}
          className="group relative h-24 w-24 overflow-hidden rounded-full border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Change client avatar"
        >
          <ImageWithFallback
            src={profileImage}
            alt={`${name || client.name} avatar`}
            className="h-full w-full object-contain"
            fallbackClassName="h-full w-full rounded-full"
            fallbackSeed={name || client.name}
          />
          <span className="absolute inset-x-0 bottom-0 bg-foreground/80 px-1 py-1 text-[10px] font-semibold text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Change avatar
          </span>
        </button>
        <p className="m-0 text-center text-[12px] text-muted-foreground">Click the avatar to change its image URL.</p>
      </div>
      <TextField label="Name" value={name} onChange={setName} />
      <TextField label="Industry" value={industry} onChange={setIndustry} />
      <TextField label="First live date" value={date} onChange={setDate} type="date" />
      <TextField id="client-profile-image" label="Avatar image URL" value={profileImage} onChange={setProfileImage} />
      <TextareaField label="Description" value={description} onChange={setDescription} />
      <TextareaField label="Target audience" value={targetAudience} onChange={setTargetAudience} rows={3} placeholder="Who is this client trying to reach?" />
    </EditSheet>
  );
}
