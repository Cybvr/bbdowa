"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useFirestoreUsers, useOwnUser } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { Field, ImageUploadField } from "@/components/detail-editor";
import {
  PROFILE_SECTIONS,
  ProfileFields,
  profileDraftFrom,
  profileDraftToFirestore,
  type ProfileDraft,
  type ProfileSectionKey,
} from "@/components/profile-fields";
import { creatorCategoryOptions, userRoles } from "@/lib/users";

// Account also holds the profile fields, so "profile" never shows as its own section.
type SectionKey = "account" | Exclude<ProfileSectionKey, "profile">;

const NAV_ITEMS: ({ key: SectionKey; label: string } | { href: string; label: string })[] = [
  { key: "account", label: "Account" },
  ...PROFILE_SECTIONS.filter((section) => section.key !== "profile").map((section) => ({ key: section.key, label: section.label })),
  { href: "/dashboard/payments", label: "Payments" },
];

const SECTION_KEYS: string[] = NAV_ITEMS.flatMap((item) => ("key" in item ? [item.key] : []));

const NAV_ITEM =
  "relative block whitespace-nowrap py-2 pl-4 text-[14px] no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

function labelFor(key: SectionKey) {
  return key === "account" ? "Account" : PROFILE_SECTIONS.find((section) => section.key === key)?.label ?? "";
}

export default function SettingsPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { user: own, loading: ownLoading, error } = useOwnUser();
  const { users } = useFirestoreUsers();

  const [section, setSection] = useState<SectionKey>("account");
  const [draft, setDraft] = useState<ProfileDraft>(() => profileDraftFrom({}));
  const [profileImage, setProfileImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // The open section lives in ?section= so it survives a reload and can be linked to.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("section") as SectionKey | null;
    if (requested && SECTION_KEYS.includes(requested)) setSection(requested);
  }, []);

  const openSection = (key: SectionKey) => {
    setSection(key);
    setSaved(false);
    setSaveError(null);
    const url = new URL(window.location.href);
    if (key === "account") url.searchParams.delete("section");
    else url.searchParams.set("section", key);
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    if (!own) return;
    setDraft(profileDraftFrom(own));
    setProfileImage(own.profileImage ?? "");
  }, [own]);

  if (authLoading || ownLoading) return <PageLoadingSkeleton titleWidth="w-32" />;

  if (!authUser) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="Settings" />
        <p className="mt-6 text-sm text-muted-foreground">Sign in to manage your settings.</p>
      </main>
    );
  }

  if (error || !own) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
        <PageHeader title="Settings" />
        <p className="mt-6 text-sm text-destructive">{error ?? "Unable to load your profile."}</p>
      </main>
    );
  }

  const roles = userRoles(own);

  const save = async () => {
    setBusy(true);
    setSaveError(null);
    setSaved(false);
    try {
      // Role and roles are intentionally left out: only an admin can change
      // those (see firestore.bbdowa.rules), so a self-service save that
      // included them would just be rejected.
      await updateDoc(doc(firebaseDb, "users", authUser.uid), {
        ...profileDraftToFirestore(draft),
        profileImage: profileImage.trim() || null,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (cause) {
      console.error("Unable to save settings", cause);
      setSaveError("Couldn’t save your settings. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
      <PageHeader title="Settings" />

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[200px_minmax(0,1fr)] md:gap-12">
        <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
          <ul className="m-0 flex list-none gap-1 p-0 md:flex-col md:gap-0 md:border-l md:border-border">
            {NAV_ITEMS.map((item) => {
              if ("href" in item) {
                return (
                  <li key={item.href}>
                    <Link href={item.href} className={`${NAV_ITEM} text-muted-foreground hover:text-foreground`}>
                      {item.label}
                    </Link>
                  </li>
                );
              }
              const active = section === item.key;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => openSection(item.key)}
                    className={`${NAV_ITEM} w-full cursor-pointer border-0 bg-transparent text-left ${
                      active
                        ? "font-medium text-foreground before:absolute before:-left-px before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-foreground before:content-['']"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          className="min-w-0 max-w-2xl space-y-6"
        >
          <h2 className="m-0 text-[20px] font-semibold tracking-tight">{labelFor(section)}</h2>

          {section === "account" ? (
            <div className="space-y-4">
              <ImageUploadField label="Avatar" value={profileImage} onChange={setProfileImage} variant="avatar" disabled={busy} />
              <Field label="Email">
                <p className="m-0 text-[14px] text-muted-foreground">{own.email ?? authUser.email ?? "—"}</p>
              </Field>
              <Field label="Account role">
                <p className="m-0 text-[14px] text-muted-foreground">
                  {roles.length ? roles.map((role) => role.charAt(0).toUpperCase() + role.slice(1)).join(", ") : "Pending, ask an admin to set your role"}
                </p>
              </Field>
              <ProfileFields draft={draft} onChange={setDraft} categoryOptions={creatorCategoryOptions(users)} section="profile" />
            </div>
          ) : (
            <ProfileFields draft={draft} onChange={setDraft} categoryOptions={creatorCategoryOptions(users)} section={section} />
          )}

          {saveError ? <p className="m-0 text-[13px] font-medium text-destructive">{saveError}</p> : null}
          {saved ? <p className="m-0 text-[13px] font-medium text-primary">Saved.</p> : null}

          <button
            type="submit"
            disabled={busy || !draft.name.trim()}
            className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </main>
  );
}
