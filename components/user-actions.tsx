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
import { DayRateField } from "@/components/day-rate-field";
import { CreatableSelectField, EditSheet, ImageUploadField, SelectField, TextField, TextareaField } from "@/components/detail-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { creatorRateLabel, userRoles, type RateCurrency, type User, type UserRole } from "@/lib/users";

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

  const [name, setName] = React.useState(user.name ?? "");
  const [status, setStatus] = React.useState<AccountStatus>(user.role === "pending" ? "pending" : "active");
  const [roles, setRoles] = React.useState<UserRole[]>(userRoles(user).length ? userRoles(user) : ["manager"]);
  const [title, setTitle] = React.useState(user.title ?? "");
  const [department, setDepartment] = React.useState(user.department ?? "");
  const [location, setLocation] = React.useState(user.location ?? "");
  const [email, setEmail] = React.useState(user.email ?? "");
  const [phone, setPhone] = React.useState(user.phone ?? "");
  const [profileImage, setProfileImage] = React.useState(user.profileImage ?? "");
  // Creator-only
  const [category, setCategory] = React.useState(user.category ?? "");
  const [dayRate] = React.useState(user.dayRate ?? "");
  const [rateMin, setRateMin] = React.useState<number | null>(user.rateMin ?? null);
  const [rateCurrency, setRateCurrency] = React.useState<RateCurrency>(user.rateCurrency ?? "NGN");
  const [availability, setAvailability] = React.useState(user.availability ?? "unconfirmed");
  const [portfolio, setPortfolio] = React.useState(user.portfolio ?? "");
  const [behance, setBehance] = React.useState(user.behance ?? "");
  const [linkedin, setLinkedin] = React.useState(user.linkedin ?? "");
  const [instagram, setInstagram] = React.useState(user.instagram ?? "");
  const [vouchedBy, setVouchedBy] = React.useState(user.vouchedBy ?? "");
  const [craftNote, setCraftNote] = React.useState(user.craftNote ?? "");
  const [followerCount, setFollowerCount] = React.useState(user.followerCount ?? "");
  const [followerPlatform, setFollowerPlatform] = React.useState(user.followerPlatform ?? "");
  const [gender, setGender] = React.useState(user.gender ?? "");
  const [age, setAge] = React.useState(user.age == null ? "" : String(user.age));
  const [niche, setNiche] = React.useState(user.niche ?? "");

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
    const ref = await docRef();
    if (!ref) throw new Error("User document not found");
    const common = {
      name: name.trim(),
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      profileImage: profileImage.trim() || null,
      updatedAt: serverTimestamp(),
    };
    const accessFields = isAdmin
      ? {
          role: status === "pending" ? "pending" : roles[0] ?? "manager",
          roles: status === "pending" ? [] : roles,
        }
      : {};
    const creatorFields =
      variant === "creator" || roles.includes("creator")
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
            vouchedBy: vouchedBy.trim(),
            craftNote: craftNote.trim(),
            followerCount: followerCount.trim() || null,
            followerPlatform: followerPlatform.trim() || null,
            gender: gender.trim() || null,
            age: age.trim() ? Number(age) : null,
            niche: niche.trim() || null,
          }
        : {};
    await updateDoc(ref, { ...common, ...accessFields, ...creatorFields });
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
          variant="default"
          size="icon"
          className="text-white"
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
              className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
      <TextField label="Name" value={name} onChange={setName} />
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
              ] as const).map(([value, label]) => {
                const selected = roles.includes(value);
                const cannotRemove = selected && roles.length === 1;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    disabled={cannotRemove}
                    onClick={() =>
                      setRoles((current) =>
                        selected ? current.filter((role) => role !== value) : [...current, value],
                      )
                    }
                    className={`rounded-lg border px-3 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="m-0 text-xs text-muted-foreground">A person can appear in both the team and creator directories.</p>
          </div>
        </>
      ) : null}
      {variant === "team" ? (
        <>
          <TextField label="Title" value={title} onChange={setTitle} />
          <TextField label="Department" value={department} onChange={setDepartment} />
        </>
      ) : null}
      {variant === "creator" || roles.includes("creator") ? (
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
            onChange={(value) => setAvailability(value as User["availability"])}
            options={[
              { value: "open", label: "Open" },
              { value: "busy", label: "Busy" },
              { value: "unconfirmed", label: "Unconfirmed" },
            ]}
          />
        </>
      ) : null}
      <TextField label="Location" value={location} onChange={setLocation} />
      <TextField label="Email" value={email} onChange={setEmail} type="email" />
      <TextField label="Phone" value={phone} onChange={setPhone} />
      {variant === "creator" || roles.includes("creator") ? (
        <>
          <TextField label="Portfolio URL" value={portfolio} onChange={setPortfolio} />
          <TextField label="Behance URL" value={behance} onChange={setBehance} />
          <TextField label="LinkedIn URL" value={linkedin} onChange={setLinkedin} />
          <TextField label="Instagram URL" value={instagram} onChange={setInstagram} />
          <TextField label="Vouched by" value={vouchedBy} onChange={setVouchedBy} />
          <TextareaField label="About" value={craftNote} onChange={setCraftNote} />
          <TextField label="Follower count" value={followerCount} onChange={setFollowerCount} placeholder="e.g. 202" />
          <TextField label="Follower platform" value={followerPlatform} onChange={setFollowerPlatform} placeholder="e.g. Instagram" />
          <TextField label="Gender" value={gender} onChange={setGender} />
          <TextField label="Age" value={age} onChange={setAge} type="number" />
          <TextField label="Niche" value={niche} onChange={setNiche} placeholder="e.g. Commercial and lifestyle production" />
        </>
      ) : null}
    </EditSheet>
  );
}
