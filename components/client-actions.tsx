"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { EditSheet, ImageUploadField, SelectField, TextField, TextareaField } from "@/components/detail-editor";
import { CLIENT_TIMEZONES, TEAM_SIZE_RANGES, teamSizeLabel, type Client } from "@/lib/clients";
import { CLIENT_CONTACTS_COLLECTION, type ClientContact } from "@/lib/job-terms";

const numberOrNull = (value: string) => (value.trim() ? Number(value) : null);

function SheetSection({ children }: { children: React.ReactNode }) {
  return <h3 className="m-0 border-t border-border pt-5 text-sm font-semibold">{children}</h3>;
}

export function ClientActions({ client }: { client: Client }) {
  const router = useRouter();

  const [name, setName] = React.useState(client.name ?? "");
  const [industry, setIndustry] = React.useState(client.industry ?? "");
  const [date, setDate] = React.useState(client.date ?? "");
  const [profileImage, setProfileImage] = React.useState(client.profileImage ?? "");
  const [description, setDescription] = React.useState(client.description ?? "");
  const [targetAudience, setTargetAudience] = React.useState(client.targetAudience ?? "");
  const [teamSize, setTeamSize] = React.useState(teamSizeLabel(client.teamSize) ?? "");
  const [yearFounded, setYearFounded] = React.useState(client.yearFounded == null ? "" : String(client.yearFounded));
  const [location, setLocation] = React.useState(client.location ?? "");
  const [website, setWebsite] = React.useState(client.website ?? "");
  const [linkedIn, setLinkedIn] = React.useState(client.linkedIn ?? "");
  const [timezone, setTimezone] = React.useState(client.timezone ?? "");

  // The point of contact is private, so it loads separately from the public client record.
  const { role } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const [contactLoaded, setContactLoaded] = React.useState(false);
  const [contactName, setContactName] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactRole, setContactRole] = React.useState("");
  const [contactOutOfOfficeUntil, setContactOutOfOfficeUntil] = React.useState("");
  const [contactNote, setContactNote] = React.useState("");

  React.useEffect(() => {
    if (!isStaff) return;
    let active = true;
    getDoc(doc(firebaseDb, CLIENT_CONTACTS_COLLECTION, client.slug))
      .then((snapshot) => {
        if (!active) return;
        const contact = snapshot.exists() ? (snapshot.data() as Partial<ClientContact>) : {};
        setContactName(contact.name ?? "");
        setContactEmail(contact.email ?? "");
        setContactRole(contact.role ?? "");
        setContactOutOfOfficeUntil(contact.outOfOfficeUntil ?? "");
        setContactNote(contact.note ?? "");
        setContactLoaded(true);
      })
      .catch((cause) => console.error("Unable to load client contact", cause));
    return () => { active = false; };
  }, [client.slug, isStaff]);

  const save = async () => {
    const founded = numberOrNull(yearFounded);
    if (founded !== null && (!Number.isInteger(founded) || founded < 1800 || founded > new Date().getFullYear())) throw new Error("Enter a valid founding year.");
    await updateDoc(doc(firebaseDb, "clients", client.slug), {
      name: name.trim(),
      industry: industry.trim(),
      date: date.trim() || null,
      profileImage: profileImage.trim() || null,
      description: description.trim() || null,
      targetAudience: targetAudience.trim() || null,
      teamSize: teamSize || null,
      yearFounded: founded,
      location: location.trim() || null,
      website: website.trim() || null,
      linkedIn: linkedIn.trim() || null,
      timezone: timezone.trim() || null,
      updatedAt: serverTimestamp(),
    });
    if (contactLoaded) {
      await setDoc(doc(firebaseDb, CLIENT_CONTACTS_COLLECTION, client.slug), {
        name: contactName.trim() || null,
        email: contactEmail.trim() || null,
        role: contactRole.trim() || null,
        outOfOfficeUntil: contactOutOfOfficeUntil || null,
        note: contactNote.trim() || null,
        updatedAt: new Date().toISOString(),
      } satisfies ClientContact);
    }
    router.refresh();
  };

  const remove = async () => {
    await deleteDoc(doc(firebaseDb, "clients", client.slug));
    await deleteDoc(doc(firebaseDb, CLIENT_CONTACTS_COLLECTION, client.slug));
    router.push("/admin/clients");
  };

  return (
    <EditSheet
      title="Edit client"
      description={client.name}
      onSave={save}
      onDelete={remove}
      deleteConfirm="Delete this client? Its jobs are not removed. This can’t be undone."
    >
      <ImageUploadField label="Avatar" value={profileImage} onChange={setProfileImage} variant="avatar" />
      <TextField label="Name" value={name} onChange={setName} />
      <TextField label="Industry" value={industry} onChange={setIndustry} />
      <TextField label="First live date" value={date} onChange={setDate} type="date" />
      <TextareaField label="Description" value={description} onChange={setDescription} />
      <TextareaField label="Target audience" value={targetAudience} onChange={setTargetAudience} rows={3} placeholder="Who is this client trying to reach?" />

      <SheetSection>Company information</SheetSection>
      <SelectField label="Team size" value={teamSize || undefined} onChange={setTeamSize} options={TEAM_SIZE_RANGES.map((value) => ({ value, label: value === "1" ? "1 person" : `${value} people` }))} />
      <TextField label="Year founded" value={yearFounded} onChange={setYearFounded} type="number" placeholder="e.g. 2017" />
      <TextField label="City / Country" value={location} onChange={setLocation} placeholder="Lagos, Nigeria" />
      <TextField label="Website" value={website} onChange={setWebsite} type="url" placeholder="https://" />
      <TextField label="LinkedIn" value={linkedIn} onChange={setLinkedIn} type="url" placeholder="https://linkedin.com/company/" />

      <SelectField label="Time zone" value={timezone || undefined} onChange={setTimezone} options={(timezone && !CLIENT_TIMEZONES.includes(timezone) ? [timezone, ...CLIENT_TIMEZONES] : CLIENT_TIMEZONES).map((value) => ({ value, label: value }))} />

      {contactLoaded ? (
        <>
          <SheetSection>Point of contact (private)</SheetSection>
          <TextField label="Name" value={contactName} onChange={setContactName} placeholder="Primary contact" />
          <TextField label="Email" value={contactEmail} onChange={setContactEmail} type="email" placeholder="Optional" />
          <TextField label="Role" value={contactRole} onChange={setContactRole} placeholder="Marketing lead" />
          <TextField label="Out of office until" value={contactOutOfOfficeUntil} onChange={setContactOutOfOfficeUntil} type="date" />
          <TextareaField label="Contact note" value={contactNote} onChange={setContactNote} rows={2} placeholder="Availability or handoff note" />
        </>
      ) : null}
    </EditSheet>
  );
}
