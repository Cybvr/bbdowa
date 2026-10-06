"use client";

import * as React from "react";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Plus } from "lucide-react";
import { DayRateField } from "@/components/day-rate-field";
import { CreatableSelectField, EditSheet, SelectField, TextField } from "@/components/detail-editor";
import { firebaseDb } from "@/lib/firebase/client";
import { creatorRateLabel, toggleRole, type RateCurrency, type UserRole } from "@/lib/users";
import { CLIENT_INVITES_COLLECTION, type ClientInvite } from "@/lib/clients";
import { useClientOptions } from "@/lib/firebase/client-content";
import { useAuth } from "@/components/auth-provider";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";

// Creates any directory user, including people with multiple roles.
const ROLE_OPTIONS: readonly { value: UserRole; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "creator", label: "Creator" },
  { value: "admin", label: "Admin" },
  { value: "client", label: "Client" },
];

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "user";
}

export function UserCreateAction({
  existingSlugs,
  categoryOptions = [],
  onCreated,
}: {
  existingSlugs: string[];
  categoryOptions?: string[];
  onCreated?: () => void;
}) {
  const [name, setName] = React.useState("");
  const [roles, setRoles] = React.useState<UserRole[]>(["manager"]);
  const [title, setTitle] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [category, setCategory] = React.useState("Content");
  const [rateMin, setRateMin] = React.useState<number | null>(null);
  const [rateCurrency, setRateCurrency] = React.useState<RateCurrency>("NGN");
  const [availability, setAvailability] = React.useState("unconfirmed");
  const [clientId, setClientId] = React.useState("");
  const clientOptions = useClientOptions(undefined, { outsideOnly: true });
  const { user: authUser } = useAuth();
  const isClient = roles.includes("client");

  const save = async () => {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Name is required");

    // Clients are saved by email: the first time they sign in with it, they
    // become a client of this company and land in their portal.
    if (isClient) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) throw new Error("Enter the client's email.");
      if (!clientId) throw new Error("Pick the company they work for.");
      await setDoc(doc(firebaseDb, CLIENT_INVITES_COLLECTION, cleanEmail), {
        email: cleanEmail,
        name: cleanName,
        title: title.trim(),
        clientId,
        clientName: clientOptions.find((option) => option.value === clientId)?.label ?? clientId,
        invitedBy: authUser?.uid ?? null,
        invitedAt: new Date().toISOString(),
      } satisfies ClientInvite);
      onCreated?.();
      window.location.reload();
      return;
    }

    const baseSlug = slugify(cleanName);
    let slug = baseSlug;
    let suffix = 2;
    while (existingSlugs.includes(slug)) slug = `${baseSlug}-${suffix++}`;

    await addDoc(collection(firebaseDb, "users"), {
      slug,
      name: cleanName,
      role: roles[0] ?? "manager",
      roles,
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      email: email.trim() || null,
      phone: null,
      profileImage: null,
      category,
      tags: [],
      entity: "Freelancer",
      dayRate: creatorRateLabel(rateCurrency, rateMin),
      rateMin,
      rateCurrency,
      hideRate: true,
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

    onCreated?.();
    window.location.reload();
  };

  return (
    <EditSheet
      title="New user"
      description="Create a directory profile and assign one or more roles."
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className={LIST_ACTION_CLASS}
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          New user
        </button>
      )}
      onSave={save}
    >
      <TextField label="Name" value={name} onChange={setName} placeholder="Full name" />
      <div className="space-y-1.5">
        <span className="text-[13px] font-medium text-foreground">Roles</span>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((option) => {
            const selected = roles.includes(option.value);
            const cannotRemove = selected && roles.length === 1;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                disabled={cannotRemove}
                onClick={() => setRoles((current) => toggleRole(current, option.value))}
                className={`rounded-lg border px-3 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground"}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="m-0 text-xs text-muted-foreground">Select Creator too when this person should appear in the creator directory.</p>
      </div>
      {isClient ? (
        <>
          <SelectField label="Company" value={clientId || undefined} onChange={setClientId} options={clientOptions} />
          <TextField label="Email" value={email} onChange={setEmail} type="email" />
          <TextField label="Title" value={title} onChange={setTitle} placeholder="e.g. Brand manager" />
        </>
      ) : (
        <>
      <TextField label="Title" value={title} onChange={setTitle} placeholder="e.g. Account Manager" />
      <TextField label="Department" value={department} onChange={setDepartment} placeholder="e.g. Client service" />
      {roles.includes("creator") ? (
        <>
          <CreatableSelectField
            label="Category"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
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
        </>
      ) : null}
      <TextField label="Location" value={location} onChange={setLocation} placeholder="e.g. Lagos, Nigeria" />
      <TextField label="Email" value={email} onChange={setEmail} type="email" />
        </>
      )}
    </EditSheet>
  );
}
