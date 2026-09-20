"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  collection,
  deleteDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { EditSheet, SelectField, TextField, TextareaField } from "@/components/detail-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/users";

/**
 * Edit / delete for a user record. People and creators are both `users`, so
 * this one component serves both pages — `variant` decides which fields show.
 * Users are keyed by uid, but the pages resolve them by `slug`, so we look the
 * document up by its slug before writing.
 */
export function UserActions({
  user,
  variant,
  listHref,
  compactMenu = false,
}: {
  user: User;
  variant: "team" | "creator";
  listHref: string;
  compactMenu?: boolean;
}) {
  const router = useRouter();

  const [name, setName] = React.useState(user.name ?? "");
  const [role, setRole] = React.useState<User["role"]>(user.role ?? "creator");
  const [title, setTitle] = React.useState(user.title ?? "");
  const [department, setDepartment] = React.useState(user.department ?? "");
  const [location, setLocation] = React.useState(user.location ?? "");
  const [email, setEmail] = React.useState(user.email ?? "");
  const [phone, setPhone] = React.useState(user.phone ?? "");
  const [profileImage, setProfileImage] = React.useState(user.profileImage ?? "");
  // Creator-only
  const [category, setCategory] = React.useState(user.category ?? "");
  const [dayRate, setDayRate] = React.useState(user.dayRate ?? "");
  const [availability, setAvailability] = React.useState(user.availability ?? "unconfirmed");
  const [portfolio, setPortfolio] = React.useState(user.portfolio ?? "");
  const [behance, setBehance] = React.useState(user.behance ?? "");
  const [linkedin, setLinkedin] = React.useState(user.linkedin ?? "");
  const [instagram, setInstagram] = React.useState(user.instagram ?? "");
  const [vouchedBy, setVouchedBy] = React.useState(user.vouchedBy ?? "");
  const [craftNote, setCraftNote] = React.useState(user.craftNote ?? "");

  const docRef = async () => {
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
      role,
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      profileImage: profileImage.trim() || null,
      updatedAt: serverTimestamp(),
    };
    const creatorFields =
      variant === "creator"
        ? {
            category: category.trim(),
            dayRate: dayRate.trim(),
            availability,
            portfolio: portfolio.trim() || null,
            behance: behance.trim() || null,
            linkedin: linkedin.trim() || null,
            instagram: instagram.trim() || null,
            vouchedBy: vouchedBy.trim(),
            craftNote: craftNote.trim(),
          }
        : {};
    await updateDoc(ref, { ...common, ...creatorFields });
    // These pages read from Firestore on the client at mount, so reload to
    // pull the saved values back in.
    window.location.reload();
  };

  const remove = async () => {
    const ref = await docRef();
    if (!ref) throw new Error("User document not found");
    await deleteDoc(ref);
    router.push(listHref);
  };

  return (
    <EditSheet
      title={variant === "creator" ? "Edit creator" : "Edit profile"}
      description={user.name}
      onSave={save}
      onDelete={remove}
      deleteConfirm="Delete this person? This can’t be undone."
      trigger={compactMenu ? (_open, removeFromMenu) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${user.name}`}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem variant="destructive" onSelect={removeFromMenu}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : undefined}
    >
      <TextField label="Name" value={name} onChange={setName} />
      <SelectField
        label="Role"
        value={role}
        onChange={(value) => setRole(value as User["role"])}
        options={[
          { value: "admin", label: "Admin" },
          { value: "manager", label: "Manager" },
          { value: "creator", label: "Creator" },
        ]}
      />
      {variant === "team" ? (
        <>
          <TextField label="Title" value={title} onChange={setTitle} />
          <TextField label="Department" value={department} onChange={setDepartment} />
        </>
      ) : (
        <>
          <SelectField
            label="Category"
            value={category}
            onChange={(value) => setCategory(value as User["category"])}
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
            onChange={(value) => setAvailability(value as User["availability"])}
            options={[
              { value: "open", label: "Open" },
              { value: "busy", label: "Busy" },
              { value: "unconfirmed", label: "Unconfirmed" },
            ]}
          />
        </>
      )}
      <TextField label="Location" value={location} onChange={setLocation} />
      <TextField label="Email" value={email} onChange={setEmail} type="email" />
      <TextField label="Phone" value={phone} onChange={setPhone} />
      <TextField label="Profile image URL" value={profileImage} onChange={setProfileImage} />
      {variant === "creator" ? (
        <>
          <TextField label="Portfolio URL" value={portfolio} onChange={setPortfolio} />
          <TextField label="Behance URL" value={behance} onChange={setBehance} />
          <TextField label="LinkedIn URL" value={linkedin} onChange={setLinkedin} />
          <TextField label="Instagram URL" value={instagram} onChange={setInstagram} />
          <TextField label="Vouched by" value={vouchedBy} onChange={setVouchedBy} />
          <TextareaField label="Craft note" value={craftNote} onChange={setCraftNote} />
        </>
      ) : null}
    </EditSheet>
  );
}
