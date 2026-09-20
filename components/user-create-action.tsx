"use client";

import * as React from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Plus } from "lucide-react";
import { EditSheet, SelectField, TextField } from "@/components/detail-editor";
import { firebaseDb } from "@/lib/firebase/client";
import type { UserRole } from "@/lib/users";

// Creates any directory user, including people with multiple roles.
const ROLE_OPTIONS: readonly { value: UserRole; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "creator", label: "Creator" },
  { value: "admin", label: "Admin" },
];

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "user";
}

export function UserCreateAction({ existingSlugs, onCreated }: { existingSlugs: string[]; onCreated?: () => void }) {
  const [name, setName] = React.useState("");
  const [roles, setRoles] = React.useState<UserRole[]>(["manager"]);
  const [title, setTitle] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [category, setCategory] = React.useState("Content");
  const [dayRate, setDayRate] = React.useState("");
  const [availability, setAvailability] = React.useState("unconfirmed");

  const save = async () => {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Name is required");

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
      dayRate: dayRate.trim(),
      rateMin: null,
      rateCurrency: "NGN",
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
      title="Add user"
      description="Create a directory profile and assign one or more roles."
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          Add user
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
                onClick={() => setRoles((current) => selected ? current.filter((role) => role !== option.value) : [...current, option.value])}
                className={`rounded-lg border px-3 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground"}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="m-0 text-xs text-muted-foreground">Select Creator too when this person should appear in the creator directory.</p>
      </div>
      <TextField label="Title" value={title} onChange={setTitle} placeholder="e.g. Account Manager" />
      <TextField label="Department" value={department} onChange={setDepartment} placeholder="e.g. Client service" />
      {roles.includes("creator") ? (
        <>
          <SelectField
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: "Art", label: "Art" },
              { value: "Writing", label: "Writing" },
              { value: "UX", label: "UX" },
              { value: "Strategy", label: "Strategy" },
              { value: "Film", label: "Film" },
              { value: "Content", label: "Content" },
            ]}
          />
          <TextField label="Day rate" value={dayRate} onChange={setDayRate} />
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
    </EditSheet>
  );
}
