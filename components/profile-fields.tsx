"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { CreatableSelectField, Field, SelectField, TextField, TextareaField } from "@/components/detail-editor";
import { DayRateField } from "@/components/day-rate-field";
import {
  DEFAULT_CREATOR_CATEGORIES,
  REFERRAL_SOURCES,
  creatorRateLabel,
  type CreatorAvailability,
  type CreatorWorkHistory,
  type RateCurrency,
  type User,
} from "@/lib/users";

/**
 * Every user carries the same profile fields, whether they sit in the team
 * directory, the creator directory or both. Settings and the admin edit sheet
 * both render this form so the two can never drift apart.
 */
export type ProfileDraft = {
  name: string;
  title: string;
  department: string;
  location: string;
  email: string;
  phone: string;
  category: string;
  entity: User["entity"];
  dayRate: string;
  rateMin: number | null;
  rateCurrency: RateCurrency;
  hideRate: boolean;
  availability: CreatorAvailability;
  terms: string;
  portfolio: string;
  behance: string;
  linkedin: string;
  instagram: string;
  vouchedBy: string;
  referralSource: string;
  craftNote: string;
  tags: string;
  followerCount: string;
  followerPlatform: string;
  gender: string;
  age: string;
  niche: string;
  workHistory: CreatorWorkHistory[];
};

export function profileDraftFrom(user: Partial<User>): ProfileDraft {
  return {
    name: user.name ?? "",
    title: user.title ?? "",
    department: user.department ?? "",
    location: user.location ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    category: user.category ?? "",
    entity: user.entity ?? "Freelancer",
    dayRate: user.dayRate ?? "",
    rateMin: user.rateMin ?? null,
    rateCurrency: user.rateCurrency ?? "NGN",
    hideRate: user.hideRate ?? true,
    availability: user.availability ?? "unconfirmed",
    terms: user.terms ?? "",
    portfolio: user.portfolio ?? "",
    behance: user.behance ?? "",
    linkedin: user.linkedin ?? "",
    instagram: user.instagram ?? "",
    vouchedBy: user.vouchedBy ?? "",
    referralSource: user.referralSource || "none",
    craftNote: user.craftNote ?? "",
    tags: (user.tags ?? []).join(", "),
    followerCount: user.followerCount ?? "",
    followerPlatform: user.followerPlatform ?? "",
    gender: user.gender ?? "",
    age: user.age == null ? "" : String(user.age),
    niche: user.niche ?? "",
    workHistory: user.workHistory ?? [],
  };
}

/** The Firestore fields for a draft. Email and vouched-by are left to the caller. */
export function profileDraftToFirestore(draft: ProfileDraft) {
  return {
    name: draft.name.trim(),
    title: draft.title.trim(),
    department: draft.department.trim(),
    location: draft.location.trim(),
    phone: draft.phone.trim() || null,
    category: draft.category.trim(),
    entity: draft.entity,
    dayRate: creatorRateLabel(draft.rateCurrency, draft.rateMin) || draft.dayRate.trim(),
    rateMin: draft.rateMin,
    rateCurrency: draft.rateCurrency,
    hideRate: draft.hideRate,
    availability: draft.availability,
    terms: draft.terms.trim(),
    portfolio: draft.portfolio.trim() || null,
    behance: draft.behance.trim() || null,
    linkedin: draft.linkedin.trim() || null,
    instagram: draft.instagram.trim() || null,
    referralSource: draft.referralSource === "none" ? null : draft.referralSource,
    craftNote: draft.craftNote.trim(),
    tags: draft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    followerCount: draft.followerCount.trim() || null,
    followerPlatform: draft.followerPlatform.trim() || null,
    gender: draft.gender.trim() || null,
    age: draft.age.trim() ? Number(draft.age) : null,
    niche: draft.niche.trim() || null,
    workHistory: draft.workHistory
      .map((entry) => ({
        role: entry.role.trim(),
        company: entry.company.trim(),
        period: entry.period.trim(),
        ...(entry.location?.trim() ? { location: entry.location.trim() } : {}),
      }))
      .filter((entry) => entry.role || entry.company),
  };
}

export const PROFILE_SECTIONS = [
  { key: "profile", label: "Profile" },
  { key: "work", label: "Work" },
  { key: "social", label: "Social" },
] as const;

export type ProfileSectionKey = (typeof PROFILE_SECTIONS)[number]["key"];

const GroupContext = React.createContext<ProfileSectionKey | null>(null);

/** One titled group of fields. When the form is showing a single section, only that group renders, without its own title. */
function Group({ id, children }: { id: ProfileSectionKey; children: React.ReactNode }) {
  const only = React.useContext(GroupContext);
  if (only && only !== id) return null;
  if (only) return <div className="space-y-4">{children}</div>;
  const title = PROFILE_SECTIONS.find((section) => section.key === id)?.label;
  return (
    <fieldset className="m-0 space-y-4 border-0 border-t border-border p-0 pt-5">
      <legend className="float-left mb-1 w-full p-0 text-[13px] font-semibold text-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

export function ProfileFields({
  draft,
  onChange,
  categoryOptions = [],
  editableEmail = false,
  showVouchedBy = false,
  section,
}: {
  draft: ProfileDraft;
  onChange: (draft: ProfileDraft) => void;
  categoryOptions?: string[];
  editableEmail?: boolean;
  showVouchedBy?: boolean;
  /** Render just this section instead of the whole form. */
  section?: ProfileSectionKey;
}) {
  const set = <K extends keyof ProfileDraft>(key: K) => (value: ProfileDraft[K]) => onChange({ ...draft, [key]: value });

  const referralOptions = [
    ...REFERRAL_SOURCES,
    ...(draft.referralSource !== "none" && !(REFERRAL_SOURCES as readonly string[]).includes(draft.referralSource) ? [draft.referralSource] : []),
  ];

  const updateHistory = (index: number, patch: Partial<CreatorWorkHistory>) =>
    set("workHistory")(draft.workHistory.map((entry, position) => (position === index ? { ...entry, ...patch } : entry)));

  return (
    <GroupContext.Provider value={section ?? null}>
    <div className="space-y-6">
      <Group id="profile">
        <TextField label="Name" value={draft.name} onChange={set("name")} />
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
        <TextField label="Tags" value={draft.tags} onChange={set("tags")} placeholder="Separate with commas, e.g. Motion, 3D" />
        <TextareaField label="About" value={draft.craftNote} onChange={set("craftNote")} />
        {editableEmail ? <TextField label="Email" value={draft.email} onChange={set("email")} type="email" /> : null}
        <TextField label="Phone" value={draft.phone} onChange={set("phone")} />
        <TextField label="Location" value={draft.location} onChange={set("location")} />
      </Group>

      <Group id="work">
        <SelectField
          label="Engages as"
          value={draft.entity}
          onChange={(value) => set("entity")(value as User["entity"])}
          options={[
            { value: "Freelancer", label: "Freelancer" },
            { value: "Studio", label: "Studio" },
          ]}
        />
        <DayRateField
          currency={draft.rateCurrency}
          rateMin={draft.rateMin}
          onCurrencyChange={set("rateCurrency")}
          onRateMinChange={set("rateMin")}
        />
        <SelectField
          label="Day rate on profile"
          value={draft.hideRate ? "hidden" : "shown"}
          onChange={(value) => set("hideRate")(value === "hidden")}
          options={[
            { value: "hidden", label: "Hidden" },
            { value: "shown", label: "Shown" },
          ]}
        />
        <SelectField
          label="Availability"
          value={draft.availability}
          onChange={(value) => set("availability")(value as CreatorAvailability)}
          options={[
            { value: "open", label: "Open" },
            { value: "busy", label: "Busy" },
            { value: "unconfirmed", label: "Unconfirmed" },
          ]}
        />
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
              Add role
            </button>
          </div>
        </Field>

        <SelectField
          label="How they heard about us"
          value={draft.referralSource}
          onChange={set("referralSource")}
          options={[{ value: "none", label: "Not set" }, ...referralOptions.map((source) => ({ value: source, label: source }))]}
        />
        {showVouchedBy ? <TextField label="Vouched by" value={draft.vouchedBy} onChange={set("vouchedBy")} /> : null}
      </Group>

      <Group id="social">
        <TextField label="Portfolio URL" value={draft.portfolio} onChange={set("portfolio")} />
        <TextField label="Behance URL" value={draft.behance} onChange={set("behance")} />
        <TextField label="LinkedIn URL" value={draft.linkedin} onChange={set("linkedin")} />
        <TextField label="Instagram URL" value={draft.instagram} onChange={set("instagram")} />
        <TextField label="Follower count" value={draft.followerCount} onChange={set("followerCount")} placeholder="e.g. 12k" />
        <TextField label="Follower platform" value={draft.followerPlatform} onChange={set("followerPlatform")} placeholder="e.g. Instagram" />
        <TextField label="Niche" value={draft.niche} onChange={set("niche")} placeholder="e.g. Lifestyle and fashion" />
        <TextField label="Gender" value={draft.gender} onChange={set("gender")} />
        <TextField label="Age" value={draft.age} onChange={set("age")} type="number" />
      </Group>
    </div>
    </GroupContext.Provider>
  );
}
