"use client";

import * as React from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Plus } from "lucide-react";
import { EditSheet, FormValidationError } from "@/components/detail-editor";
import { profileDraftFrom, profileDraftToFirestore, type ProfileDraft } from "@/components/profile-fields";
import { UserEditorFields, type UserAccountStatus } from "@/components/user-editor-fields";
import { firebaseDb } from "@/lib/firebase/client";
import { sendAppEmail } from "@/lib/app-email";
import { type UserRole } from "@/lib/users";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";

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
  const [draft, setDraft] = React.useState<ProfileDraft>(() => profileDraftFrom({ category: "Content" }));
  const [profileImage, setProfileImage] = React.useState("");
  const [status, setStatus] = React.useState<UserAccountStatus>("active");
  const [roles, setRoles] = React.useState<UserRole[]>(["manager"]);
  const [clientId, setClientId] = React.useState("");
  const [onboarding, setOnboarding] = React.useState(true);
  const isClient = roles.includes("client");

  const save = async () => {
    const cleanName = draft.name.trim();
    if (!cleanName) throw new FormValidationError("Name is required.");

    if (status !== "pending" && isClient && !clientId) throw new FormValidationError("Pick the company they work for.");

    const baseSlug = slugify(cleanName);
    let slug = baseSlug;
    let suffix = 2;
    while (existingSlugs.includes(slug)) slug = `${baseSlug}-${suffix++}`;

    await addDoc(collection(firebaseDb, "users"), {
      slug,
      ...profileDraftToFirestore(draft),
      name: cleanName,
      role: status === "pending" ? "pending" : roles[0] ?? "manager",
      roles: status === "pending" ? [] : roles,
      clientId: isClient ? clientId : null,
      onboardingRequired: onboarding,
      email: draft.email.trim().toLowerCase() || null,
      vouchedBy: draft.vouchedBy.trim(),
      profileImage: profileImage.trim() || null,
      clearance: "pending",
      vetted: false,
      workedOn: [],
      yearsActive: null,
      addedAt: new Date().toISOString(),
      featuredImage: null,
      contactNote: null,
      lastEngaged: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const inviteEmail = draft.email.trim().toLowerCase();
    if (inviteEmail && status !== "pending") await sendAppEmail({ type: "invite", email: inviteEmail });

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
      <UserEditorFields
        draft={draft}
        onDraftChange={setDraft}
        profileImage={profileImage}
        onProfileImageChange={setProfileImage}
        avatarUploadPath="users/directory/avatar"
        categoryOptions={categoryOptions}
        canManageAccess
        status={status}
        onStatusChange={setStatus}
        roles={roles}
        onRolesChange={setRoles}
        clientId={clientId}
        onClientIdChange={setClientId}
        onboarding={onboarding}
        onOnboardingChange={setOnboarding}
      />
    </EditSheet>
  );
}
