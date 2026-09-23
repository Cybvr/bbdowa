"use client";

import { useEffect, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useOwnUser } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import {
  CreatableSelectField,
  Field,
  ImageUploadField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/detail-editor";
import { DayRateField } from "@/components/day-rate-field";
import { creatorRateLabel, DEFAULT_CREATOR_CATEGORIES, isCreatorUser, userRoles, type CreatorAvailability, type RateCurrency } from "@/lib/users";

export default function SettingsPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { user: own, loading: ownLoading, error } = useOwnUser();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [category, setCategory] = useState("");
  const [dayRate, setDayRate] = useState("");
  const [rateMin, setRateMin] = useState<number | null>(null);
  const [rateCurrency, setRateCurrency] = useState<RateCurrency>("NGN");
  const [availability, setAvailability] = useState<CreatorAvailability>("unconfirmed");
  const [portfolio, setPortfolio] = useState("");
  const [behance, setBehance] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [craftNote, setCraftNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!own) return;
    setName(own.name ?? "");
    setTitle(own.title ?? "");
    setDepartment(own.department ?? "");
    setLocation(own.location ?? "");
    setPhone(own.phone ?? "");
    setProfileImage(own.profileImage ?? "");
    setCategory(own.category ?? "");
    setDayRate(own.dayRate ?? "");
    setRateMin(own.rateMin ?? null);
    setRateCurrency(own.rateCurrency ?? "NGN");
    setAvailability(own.availability ?? "unconfirmed");
    setPortfolio(own.portfolio ?? "");
    setBehance(own.behance ?? "");
    setLinkedin(own.linkedin ?? "");
    setInstagram(own.instagram ?? "");
    setCraftNote(own.craftNote ?? "");
  }, [own]);

  if (authLoading || ownLoading) return <PageLoadingSkeleton titleWidth="w-32" />;

  if (!authUser) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="Settings" />
        <p className="mt-6 text-sm text-muted-foreground">Sign in to manage your settings.</p>
      </main>
    );
  }

  if (error || !own) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="Settings" />
        <p className="mt-6 text-sm text-destructive">{error ?? "Unable to load your profile."}</p>
      </main>
    );
  }

  const creator = isCreatorUser(own);
  const roles = userRoles(own);

  const save = async () => {
    setBusy(true);
    setSaveError(null);
    setSaved(false);
    try {
      const common = {
        name: name.trim(),
        title: title.trim(),
        department: department.trim(),
        location: location.trim(),
        phone: phone.trim() || null,
        profileImage: profileImage.trim() || null,
        updatedAt: serverTimestamp(),
      };
      // Role and roles are intentionally left out: only an admin can change
      // those (see firestore.bbdowa.rules), so a self-service save that
      // included them would just be rejected.
      const creatorFields = creator
        ? {
            category: category.trim(),
            dayRate: creatorRateLabel(rateCurrency, rateMin) || dayRate.trim(),
            rateMin,
            rateCurrency,
            availability,
            portfolio: portfolio.trim() || null,
            behance: behance.trim() || null,
            linkedin: linkedin.trim() || null,
            instagram: instagram.trim() || null,
            craftNote: craftNote.trim(),
          }
        : {};
      await updateDoc(doc(firebaseDb, "users", authUser.uid), { ...common, ...creatorFields });
      setSaved(true);
    } catch (cause) {
      console.error("Unable to save settings", cause);
      setSaveError("Couldn’t save your settings. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
      <PageHeader title="Settings" description="Update your own profile details." />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        className="mt-6 space-y-4"
      >
        <ImageUploadField label="Avatar" value={profileImage} onChange={setProfileImage} variant="avatar" disabled={busy} />
        <TextField label="Name" value={name} onChange={setName} />
        <Field label="Email">
          <p className="m-0 text-[14px] text-muted-foreground">{own.email ?? authUser.email ?? "—"}</p>
        </Field>
        <Field label="Account role">
          <p className="m-0 text-[14px] text-muted-foreground">
            {roles.length ? roles.map((role) => role.charAt(0).toUpperCase() + role.slice(1)).join(", ") : "Pending — ask an admin to set your role"}
          </p>
        </Field>
        <TextField label="Title" value={title} onChange={setTitle} placeholder="e.g. Senior Copywriter" />
        <TextField label="Department" value={department} onChange={setDepartment} />
        <TextField label="Location" value={location} onChange={setLocation} />
        <TextField label="Phone" value={phone} onChange={setPhone} />

        {creator ? (
          <>
            <CreatableSelectField
              label="Category"
              value={category}
              onChange={setCategory}
              options={[...DEFAULT_CREATOR_CATEGORIES]}
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
              onChange={(value) => setAvailability(value as CreatorAvailability)}
              options={[
                { value: "open", label: "Open" },
                { value: "busy", label: "Busy" },
                { value: "unconfirmed", label: "Unconfirmed" },
              ]}
            />
            <TextField label="Portfolio URL" value={portfolio} onChange={setPortfolio} />
            <TextField label="Behance URL" value={behance} onChange={setBehance} />
            <TextField label="LinkedIn URL" value={linkedin} onChange={setLinkedin} />
            <TextField label="Instagram URL" value={instagram} onChange={setInstagram} />
            <TextareaField label="About" value={craftNote} onChange={setCraftNote} />
          </>
        ) : null}

        {saveError ? <p className="m-0 text-[13px] font-medium text-destructive">{saveError}</p> : null}
        {saved ? <p className="m-0 text-[13px] font-medium text-primary">Saved.</p> : null}

        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </main>
  );
}
