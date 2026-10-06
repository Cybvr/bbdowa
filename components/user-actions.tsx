"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import { useClientOptions } from "@/lib/firebase/client-content";
import { needsOnboarding } from "@/lib/onboarding";
import { ProfileFields, profileDraftFrom, profileDraftToFirestore, type ProfileDraft } from "@/components/profile-fields";
import { EditSheet, ImageUploadField, SelectField } from "@/components/detail-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { userRoles, type User, type UserRole, toggleRole } from "@/lib/users";

type AccountStatus = "active" | "pending";

/**
 * Edit / delete for a user record. People and creators are both `users`, so
 * this one component serves both pages. Users are keyed by uid, but the pages
 * resolve them by `slug`, so we look the document up by its slug before writing.
 */
export function UserActions({
  user,
  variant,
  listHref,
  compactMenu = false,
  iconOnly = false,
  includeEditAction = false,
  categoryOptions = [],
  onMutated,
}: {
  user: User;
  variant: "team" | "creator";
  listHref: string;
  compactMenu?: boolean;
  iconOnly?: boolean;
  includeEditAction?: boolean;
  categoryOptions?: string[];
  onMutated?: () => void;
}) {
  const router = useRouter();
  const { isAdmin, role } = useAuth();
  const canEditUser = isAdmin || (role === "manager" && variant === "creator");

  const [status, setStatus] = React.useState<AccountStatus>(user.role === "pending" ? "pending" : "active");
  const [roles, setRoles] = React.useState<UserRole[]>(userRoles(user).length ? userRoles(user) : ["manager"]);
  const [draft, setDraft] = React.useState<ProfileDraft>(() => profileDraftFrom(user));
  const [profileImage, setProfileImage] = React.useState(user.profileImage ?? "");
  const initialOnboarding = needsOnboarding(user);
  const [clientId, setClientId] = React.useState(user.clientId ?? "");
  const clientOptions = useClientOptions();
  const [onboarding, setOnboarding] = React.useState(initialOnboarding);

  const docRef = async () => {
    if (user.uid) {
      const uidRef = doc(firebaseDb, "users", user.uid);
      if ((await getDoc(uidRef)).exists()) return uidRef;
    }

    if (!user.slug) return null;
    const snapshot = await getDocs(
      query(collection(firebaseDb, "users"), where("slug", "==", user.slug), limit(1)),
    );
    return snapshot.docs[0]?.ref ?? null;
  };

  const save = async () => {
    if (isAdmin && status !== "pending" && roles.includes("client") && !clientId) throw new Error("Pick the client company this person works for.");
    const ref = await docRef();
    if (!ref) throw new Error("User document not found");
    const accessFields = isAdmin
      ? {
          role: status === "pending" ? "pending" : roles[0] ?? "manager",
          roles: status === "pending" ? [] : roles,
          clientId: roles.includes("client") ? clientId || null : null,
          // Only write onboarding when the switch changed. On clears the finished mark so they go through it again.
          ...(onboarding === initialOnboarding
            ? {}
            : onboarding
              ? { onboardingRequired: true, onboardingCompletedAt: null, onboardingStatus: null }
              : { onboardingRequired: false }),
        }
      : {};
    await updateDoc(ref, {
      ...profileDraftToFirestore(draft),
      email: draft.email.trim() || null,
      vouchedBy: draft.vouchedBy.trim(),
      profileImage: profileImage.trim() || null,
      updatedAt: serverTimestamp(),
      ...accessFields,
    });
    if (onMutated) {
      onMutated();
      return;
    }
    // These pages read from Firestore on the client at mount, so reload to
    // pull the saved values back in.
    window.location.reload();
  };

  const remove = async () => {
    const ref = await docRef();
    if (!ref) throw new Error("User document not found");
    await deleteDoc(ref);
    if (onMutated) {
      onMutated();
      return;
    }
    router.push(listHref);
  };

  return (
    <EditSheet
      title={variant === "creator" ? "Edit creator" : "Edit profile"}
      description={user.name}
      onSave={save}
      canEdit={canEditUser}
      onDelete={isAdmin ? remove : undefined}
      deleteConfirm="Delete this person? This can’t be undone."
      trigger={iconOnly ? (open) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Edit ${user.name}`}
          title="Edit"
          onClick={open}
        >
          <Pencil aria-hidden="true" className="h-5 w-5" />
        </Button>
      ) : compactMenu ? (_open, removeFromMenu) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${user.name}`}
              className="grid h-8 w-8 place-items-center rounded-md border-0 bg-transparent text-muted-foreground shadow-none transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {canEditUser && (includeEditAction || role === "manager" || !compactMenu) ? <DropdownMenuItem onSelect={_open}><Pencil className="h-4 w-4" />Edit</DropdownMenuItem> : null}
            {isAdmin ? <DropdownMenuItem variant="destructive" onSelect={removeFromMenu}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem> : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : undefined}
    >
      <ImageUploadField label="Avatar" value={profileImage} onChange={setProfileImage} variant="avatar" uploadPath={`users/${user.uid ?? user.slug}/avatar`} />
      {isAdmin ? (
        <>
          <SelectField
            label="Account status"
            value={status}
            onChange={(value) => setStatus(value as AccountStatus)}
            options={[
              { value: "active", label: "Active" },
              { value: "pending", label: "Pending" },
            ]}
          />
          <div className="space-y-1.5">
            <span className="text-[13px] font-medium text-foreground">Roles</span>
            <div className="flex flex-wrap gap-2">
              {([
                ["admin", "Admin"],
                ["manager", "Manager"],
                ["creator", "Creator"],
                ["client", "Client"],
              ] as const).map(([value, label]) => {
                const selected = roles.includes(value);
                const cannotRemove = selected && roles.length === 1;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    disabled={cannotRemove}
                    onClick={() => setRoles((current) => toggleRole(current, value))}
                    className={`rounded-lg border px-3 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="m-0 text-xs text-muted-foreground">A person can appear in both the team and creator directories.</p>
          </div>
          {roles.includes("client") ? <SelectField label="Company" value={clientId || undefined} onChange={setClientId} options={clientOptions} /> : null}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="block text-[13px] font-medium text-foreground">Onboarding</span>
              <p className="m-0 mt-0.5 text-xs text-muted-foreground">
                {onboarding ? "On: they'll be sent through onboarding next time they open Bantaba." : user.onboardingCompletedAt ? "Done. Turn on to send them through it again." : "Off: they won't be asked to onboard."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={onboarding}
              aria-label="Onboarding"
              onClick={() => setOnboarding((current) => !current)}
              className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${onboarding ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-background shadow transition ${onboarding ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </button>
          </div>
        </>
      ) : null}
      <ProfileFields draft={draft} onChange={setDraft} categoryOptions={categoryOptions} editableEmail showVouchedBy />
    </EditSheet>
  );
}
