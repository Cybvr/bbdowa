"use client";

import * as React from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { DayRateField } from "@/components/day-rate-field";
import { CreatableSelectField, EditSheet, SelectField, TextField } from "@/components/detail-editor";
import { firebaseDb } from "@/lib/firebase/client";
import { creatorRateLabel, DEFAULT_CREATOR_CATEGORIES, type RateCurrency } from "@/lib/users";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "creator";
}

export function CreatorCreateAction({
  existingSlugs,
  categoryOptions = [],
}: {
  existingSlugs: string[];
  categoryOptions?: string[];
}) {
  const router = useRouter();
  const { isAdmin, role } = useAuth();
  const canCreate = isAdmin || role === "manager";
  const [name, setName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("Content");
  const [location, setLocation] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [rateCurrency, setRateCurrency] = React.useState<RateCurrency>("NGN");
  const [rateMin, setRateMin] = React.useState<number | null>(null);
  const [availability, setAvailability] = React.useState("unconfirmed");

  const save = async () => {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Name is required");
    const cleanEmail = email.trim();
    if (!cleanEmail) throw new Error("Email is required");
    if (rateMin === null) throw new Error("Choose a day rate range");

    const baseSlug = slugify(cleanName);
    let slug = baseSlug;
    let suffix = 2;
    while (existingSlugs.includes(slug)) slug = `${baseSlug}-${suffix++}`;

    await addDoc(collection(firebaseDb, "users"), {
      slug,
      name: cleanName,
      role: "creator",
      roles: ["creator"],
      title: title.trim(),
      department: "",
      location: location.trim(),
      email: cleanEmail,
      phone: null,
      profileImage: null,
      category: category.trim(),
      tags: [],
      entity: "Freelancer",
      dayRate: creatorRateLabel(rateCurrency, rateMin),
      rateMin,
      rateCurrency,
      hideRate: false,
      terms: "",
      availability,
      clearance: "pending",
      vetted: false,
      vouchedBy: "",
      workedOn: [],
      yearsActive: null,
      portfolio: null,
      behance: null,
      addedAt: new Date().toISOString(),
      featuredImage: null,
      workHistory: [],
      linkedin: null,
      instagram: null,
      contactNote: null,
      followerCount: null,
      followerPlatform: null,
      gender: null,
      age: null,
      niche: null,
      lastEngaged: null,
      craftNote: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    router.push(`/dashboard/discover/${slug}`);
  };

  if (!canCreate) return null;

  return (
    <EditSheet
      title="New creator"
      description="Create a creator profile and open it after saving."
      canEdit={canCreate}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className={LIST_ACTION_CLASS}
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          New creator
        </button>
      )}
      onSave={save}
    >
      <TextField label="Name" value={name} onChange={setName} placeholder="Full name" />
      <TextField label="Email" value={email} onChange={setEmail} placeholder="name@example.com" type="email" required />
      <TextField label="Title" value={title} onChange={setTitle} placeholder="e.g. Product designer" />
      <CreatableSelectField
        label="Category"
        value={category}
        onChange={setCategory}
        options={[...new Set([...DEFAULT_CREATOR_CATEGORIES, ...categoryOptions])]}
        addLabel="Add new category…"
        placeholder="e.g. Photography"
      />
      <DayRateField
        currency={rateCurrency}
        rateMin={rateMin}
        onCurrencyChange={setRateCurrency}
        onRateMinChange={setRateMin}
      />
      <SelectField
        label="Availability"
        value={availability}
        onChange={setAvailability}
        options={[
          { value: "open", label: "Open" },
          { value: "busy", label: "Busy" },
          { value: "unconfirmed", label: "Unconfirmed" },
        ]}
      />
      <TextField label="Location" value={location} onChange={setLocation} placeholder="e.g. Lagos, Nigeria" />
    </EditSheet>
  );
}
