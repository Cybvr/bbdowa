"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { EditSheet, ImageUploadField, TextField, TextareaField } from "@/components/detail-editor";
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
      <ImageUploadField label="Avatar" value={profileImage} onChange={setProfileImage} variant="avatar" />
      <TextField label="Name" value={name} onChange={setName} />
      <TextField label="Industry" value={industry} onChange={setIndustry} />
      <TextField label="First live date" value={date} onChange={setDate} type="date" />
      <TextareaField label="Description" value={description} onChange={setDescription} />
      <TextareaField label="Target audience" value={targetAudience} onChange={setTargetAudience} rows={3} placeholder="Who is this client trying to reach?" />
    </EditSheet>
  );
}
