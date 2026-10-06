"use client";

import * as React from "react";
import { Plus, Trash2, X } from "lucide-react";
import { DayRateField } from "@/components/day-rate-field";
import { CreatableSelectField, Field, ImageUploadField, SelectField, TextareaField, TextField } from "@/components/detail-editor";
import { type ProfileDraft } from "@/components/profile-fields";
import { useClientOptions } from "@/lib/firebase/client-content";
import {
  DEFAULT_CREATOR_CATEGORIES,
  REFERRAL_SOURCES,
  type CreatorAvailability,
  type CreatorWorkHistory,
  type User,
  type UserRole,
} from "@/lib/users";

export type UserAccountStatus = "active" | "pending";

const ROLE_OPTIONS: readonly { value: UserRole; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "creator", label: "Creator" },
  { value: "admin", label: "Admin" },
  { value: "client", label: "Client" },
];

function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="m-0 space-y-4 border-0 border-t border-border p-0 pt-5">
      <legend className="float-left mb-1 w-full p-0 text-[13px] font-semibold text-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

export function UserEditorFields({
  draft,
  onDraftChange,
  profileImage,
  onProfileImageChange,
  avatarUploadPath,
  categoryOptions = [],
  canManageAccess,
  status,
  onStatusChange,
  roles,
  onRolesChange,
  clientId,
  onClientIdChange,
  onboarding,
  onOnboardingChange,
  onboardingCompletedAt,
}: {
  draft: ProfileDraft;
  onDraftChange: (draft: ProfileDraft) => void;
  profileImage: string;
  onProfileImageChange: (value: string) => void;
  avatarUploadPath: string;
  categoryOptions?: string[];
  canManageAccess: boolean;
  status: UserAccountStatus;
  onStatusChange: (value: UserAccountStatus) => void;
  roles: UserRole[];
  onRolesChange: React.Dispatch<React.SetStateAction<UserRole[]>>;
  clientId: string;
  onClientIdChange: (value: string) => void;
  onboarding: boolean;
  onOnboardingChange: React.Dispatch<React.SetStateAction<boolean>>;
  onboardingCompletedAt?: unknown;
}) {
  const clientOptions = useClientOptions(undefined, { outsideOnly: true });
  const set = <K extends keyof ProfileDraft>(key: K) => (value: ProfileDraft[K]) => onDraftChange({ ...draft, [key]: value });
  const updateHistory = (index: number, patch: Partial<CreatorWorkHistory>) =>
    set("workHistory")(draft.workHistory.map((entry, position) => (position === index ? { ...entry, ...patch } : entry)));
  const availableRoles = ROLE_OPTIONS.filter((option) => !roles.includes(option.value));
  const referralOptions = [
    ...REFERRAL_SOURCES,
    ...(draft.referralSource !== "none" && !(REFERRAL_SOURCES as readonly string[]).includes(draft.referralSource) ? [draft.referralSource] : []),
  ];

  return (
    <div className="space-y-6">
      <EditorSection title="Primary account & identity">
        <ImageUploadField label="Avatar" value={profileImage} onChange={onProfileImageChange} variant="avatar" uploadPath={avatarUploadPath} />
        <TextField label="Name" value={draft.name} onChange={set("name")} placeholder="Full name" />
        {canManageAccess ? (
          <>
            <SelectField
              label="Account status"
              value={status}
              onChange={(value) => onStatusChange(value as UserAccountStatus)}
              options={[{ value: "active", label: "Active" }, { value: "pending", label: "Pending" }]}
            />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="block text-[13px] font-medium text-foreground">Onboarding</span>
                <p className="m-0 mt-0.5 text-xs text-muted-foreground">
                  {onboarding ? "On: they'll be sent through onboarding next time they open Bantaba." : onboardingCompletedAt ? "Done. Turn on to send them through it again." : "Off: they won't be asked to onboard."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={onboarding}
                aria-label="Onboarding"
                onClick={() => onOnboardingChange((current) => !current)}
                className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${onboarding ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-background shadow transition ${onboarding ? "translate-x-[18px]" : "translate-x-0.5"}`} />
              </button>
            </div>
          </>
        ) : null}
      </EditorSection>

      <EditorSection title="Contact & location">
        <TextField label="Email" value={draft.email} onChange={set("email")} type="email" />
        <TextField label="Phone" value={draft.phone} onChange={set("phone")} />
        <TextField label="Location" value={draft.location} onChange={set("location")} />
      </EditorSection>

      {canManageAccess ? (
        <EditorSection title="Roles & directory assignment">
          <Field label="Roles">
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => {
                const label = ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
                return (
                  <button
                    key={role}
                    type="button"
                    aria-label={`Remove ${label} role`}
                    disabled={roles.length === 1}
                    onClick={() => onRolesChange((current) => current.filter((value) => value !== role))}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-foreground bg-foreground px-3 text-[13px] font-medium text-background transition hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {label}
                    {roles.length > 1 ? <X className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
            <p className="m-0 pt-2 text-xs text-muted-foreground">A person can appear in both the team and creator directories.</p>
          </Field>
          {availableRoles.length ? (
            <SelectField
              label="Add role"
              value=""
              onChange={(value) => onRolesChange((current) => current.includes(value as UserRole) ? current : [...current, value as UserRole])}
              options={availableRoles.map((option) => ({ value: option.value, label: option.label }))}
              placeholder="Select a role"
            />
          ) : null}
          {roles.includes("client") ? <SelectField label="Company" value={clientId || undefined} onChange={onClientIdChange} options={clientOptions} placeholder="Select a company" /> : null}
        </EditorSection>
      ) : null}

      <EditorSection title="Profile & team details">
        <TextField label="Title" value={draft.title} onChange={set("title")} placeholder="e.g. Senior Copywriter" />
        <TextField label="Department" value={draft.department} onChange={set("department")} />
        <CreatableSelectField
          label="Category"
          value={draft.category}
          onChange={set("category")}
          options={categoryOptions.length ? categoryOptions : [...DEFAULT_CREATOR_CATEGORIES]}
          addLabel="Add new category…"
          placeholder="e.g. Photography"
        />
        <TextareaField label="About" value={draft.craftNote} onChange={set("craftNote")} />
      </EditorSection>

      <EditorSection title="Engagement & work rates">
        <SelectField
          label="Engages as"
          value={draft.entity}
          onChange={(value) => set("entity")(value as User["entity"])}
          options={[{ value: "Freelancer", label: "Freelancer" }, { value: "Studio", label: "Studio" }]}
        />
        <DayRateField currency={draft.rateCurrency} rateMin={draft.rateMin} onCurrencyChange={set("rateCurrency")} onRateMinChange={set("rateMin")} />
        <SelectField
          label="Day rate on profile"
          value={draft.hideRate ? "hidden" : "shown"}
          onChange={(value) => set("hideRate")(value === "hidden")}
          options={[{ value: "hidden", label: "Hidden" }, { value: "shown", label: "Shown" }]}
        />
        <SelectField
          label="Availability"
          value={draft.availability}
          onChange={(value) => set("availability")(value as CreatorAvailability)}
          options={[{ value: "open", label: "Open" }, { value: "busy", label: "Busy" }, { value: "unconfirmed", label: "Unconfirmed" }]}
        />
      </EditorSection>

      <EditorSection title="Portfolio & social links">
        <TextField label="Portfolio URL" value={draft.portfolio} onChange={set("portfolio")} />
        <TextField label="Behance URL" value={draft.behance} onChange={set("behance")} />
        <TextField label="LinkedIn URL" value={draft.linkedin} onChange={set("linkedin")} />
        <TextField label="Instagram URL" value={draft.instagram} onChange={set("instagram")} />
      </EditorSection>

      <EditorSection title="Creator & demographic details">
        <TextField label="Tags" value={draft.tags} onChange={set("tags")} placeholder="Separate with commas, e.g. Motion, 3D" />
        <TextField label="Niche" value={draft.niche} onChange={set("niche")} placeholder="e.g. Lifestyle and fashion" />
        <TextField label="Follower count" value={draft.followerCount} onChange={set("followerCount")} placeholder="e.g. 12k" />
        <TextField label="Follower platform" value={draft.followerPlatform} onChange={set("followerPlatform")} placeholder="e.g. Instagram" />
        <TextField label="Gender" value={draft.gender} onChange={set("gender")} />
        <TextField label="Age" value={draft.age} onChange={set("age")} type="number" />
      </EditorSection>

      <EditorSection title="History & attribution">
        <TextField label="Terms" value={draft.terms} onChange={set("terms")} placeholder="e.g. 50% upfront" />
        <Field label="Work history">
          <div className="space-y-3">
            {draft.workHistory.map((entry, index) => (
              <div key={index} className="space-y-3 rounded-lg border border-border p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextField label="Role" value={entry.role} onChange={(value) => updateHistory(index, { role: value })} />
                  <TextField label="Company" value={entry.company} onChange={(value) => updateHistory(index, { company: value })} />
                  <TextField label="Period" value={entry.period} onChange={(value) => updateHistory(index, { period: value })} placeholder="e.g. 2021 to 2024" />
                  <TextField label="Location" value={entry.location ?? ""} onChange={(value) => updateHistory(index, { location: value })} />
                </div>
                <button
                  type="button"
                  onClick={() => set("workHistory")(draft.workHistory.filter((_, position) => position !== index))}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("workHistory")([...draft.workHistory, { role: "", company: "", period: "" }])}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold hover:border-foreground"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add work history
            </button>
          </div>
        </Field>
        <SelectField
          label="How they heard about us"
          value={draft.referralSource}
          onChange={set("referralSource")}
          options={[{ value: "none", label: "Not set" }, ...referralOptions.map((source) => ({ value: source, label: source }))]}
        />
        <TextField label="Vouched by" value={draft.vouchedBy} onChange={set("vouchedBy")} />
      </EditorSection>
    </div>
  );
}
