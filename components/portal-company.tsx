"use client";

import * as React from "react";
import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { Globe, Pencil } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { ImageUploadField } from "@/components/detail-editor";
import { CreatorThumbnail } from "@/components/creator-thumbnail";
import { usePortalClient } from "@/components/portal-shell";
import { firebaseDb } from "@/lib/firebase/client";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { CLIENT_INVITES_COLLECTION, CLIENT_TIMEZONES, TEAM_SIZE_RANGES, teamSizeLabel, type Client, type ClientInvite } from "@/lib/clients";

const FIELD = "block space-y-1.5 text-sm font-medium";
const INPUT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/40";

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-item-title font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-1.5 text-body">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 break-words font-medium">{children}</dd>
    </div>
  );
}

/** The client's company profile. Everyone at the company sees it; the owner edits it and adds colleagues. */
export function PortalCompany() {
  const { user, isViewingAs } = useAuth();
  const portal = usePortalClient();
  const clientId = portal?.clientId ?? "";
  const { users } = useFirestoreUsers();
  const [company, setCompany] = React.useState<Client | null>(null);
  const [invites, setInvites] = React.useState<ClientInvite[]>([]);
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => {
    if (!clientId) return;
    return onSnapshot(doc(firebaseDb, "clients", clientId), (snapshot) => {
      setCompany(snapshot.exists() ? ({ slug: snapshot.id, ...snapshot.data() } as Client) : null);
    });
  }, [clientId]);

  // The owner (or an admin viewing as them) manages the company.
  const isOwner = Boolean(company && user && (company.ownerUid === user.uid || isViewingAs));

  React.useEffect(() => {
    if (!clientId || !isOwner) return;
    return onSnapshot(
      query(collection(firebaseDb, CLIENT_INVITES_COLLECTION), where("clientId", "==", clientId)),
      (snapshot) => setInvites(snapshot.docs.map((item) => item.data() as ClientInvite)),
      () => setInvites([]),
    );
  }, [clientId, isOwner]);

  if (!company) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const colleagues = users.filter((person) => person.role === "client" && person.clientId === clientId);
  const signedInEmails = new Set(colleagues.map((person) => person.email?.toLowerCase()).filter(Boolean));
  const waiting = invites.filter((invite) => !signedInEmails.has(invite.email));

  return (
    <div className="grid gap-3">
      <h1 className="m-0 text-page-title font-bold max-nav:hidden sm:text-page-title-lg">Company</h1>
      {editing ? (
        <CompanyForm company={company} onDone={() => setEditing(false)} />
      ) : (
        <>
          <section className="flex items-center gap-4 rounded-xl border border-border bg-background p-4 sm:p-5">
            <CreatorThumbnail imageSrc={company.profileImage} avatarSeed={company.name} className="h-16 w-16 shrink-0" rounded={false} />
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-page-title font-semibold">{company.name}</p>
              {company.industry ? <p className="m-0 mt-1 truncate text-sm text-muted-foreground">{company.industry}</p> : null}
            </div>
            {isOwner ? (
              <button type="button" onClick={() => setEditing(true)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-semibold hover:border-foreground">
                <Pencil aria-hidden="true" className="h-3.5 w-3.5" />Edit
              </button>
            ) : null}
          </section>

          <Card title="About">
            <p className="mb-0 mt-3 whitespace-pre-line text-body text-muted-foreground">{company.description?.trim() || "No description yet."}</p>
          </Card>

          <Card title="Details">
            <dl className="m-0 mt-3">
              <Row label="Industry">{company.industry || "—"}</Row>
              <Row label="Team size">{teamSizeLabel(company.teamSize) ?? "—"}</Row>
              <Row label="City / Country">{company.location || "—"}</Row>
              <Row label="Time zone">{company.timezone || "—"}</Row>
              <Row label="Website">{company.website ? <a href={company.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground underline decoration-border underline-offset-4 hover:text-primary"><Globe aria-hidden="true" className="h-3.5 w-3.5" />{company.website.replace(/^https?:\/\//, "")}</a> : "—"}</Row>
            </dl>
          </Card>
        </>
      )}

      <Card title="People">
        <ul className="m-0 mt-3 grid list-none gap-2 p-0">
          {colleagues.map((person) => (
            <li key={person.uid ?? person.slug} className="flex min-w-0 items-center gap-3 text-body">
              <CreatorThumbnail imageSrc={person.profileImage} avatarSeed={person.name} className="h-8 w-8 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-medium">{person.name || person.email}</span>
              {person.uid && person.uid === company.ownerUid ? <span className="shrink-0 text-xs text-muted-foreground">Owner</span> : null}
            </li>
          ))}
          {isOwner ? waiting.map((invite) => (
            <li key={invite.email} className="flex min-w-0 items-center gap-3 text-body">
              <CreatorThumbnail avatarSeed={invite.name} className="h-8 w-8 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-medium">{invite.name}<span className="ml-2 text-sm font-normal text-muted-foreground">{invite.email}</span></span>
              <button type="button" onClick={() => { if (window.confirm(`Remove ${invite.name}?`)) void deleteDoc(doc(firebaseDb, CLIENT_INVITES_COLLECTION, invite.email)); }} className="shrink-0 text-xs font-semibold text-destructive hover:underline">Remove</button>
            </li>
          )) : null}
        </ul>
        {isOwner ? <AddColleague company={company} /> : null}
      </Card>
    </div>
  );
}

function AddColleague({ company }: { company: Client }) {
  const { user } = useAuth();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim() || !cleanEmail.includes("@")) return setError("Enter their name and email.");
    setBusy(true);
    setError(null);
    try {
      await setDoc(doc(firebaseDb, CLIENT_INVITES_COLLECTION, cleanEmail), {
        email: cleanEmail,
        name: name.trim(),
        title: "",
        clientId: company.slug,
        clientName: company.name,
        invitedBy: user?.uid ?? null,
        invitedAt: new Date().toISOString(),
      } satisfies ClientInvite);
      setName("");
      setEmail("");
    } catch (cause) {
      console.error("Unable to add colleague", cause);
      setError("Couldn’t add them. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={add} className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" aria-label="Colleague name" className={INPUT} />
      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" aria-label="Colleague email" className={INPUT} />
      <button type="submit" disabled={busy} className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">Add</button>
      {error ? <p role="alert" className="m-0 text-sm text-destructive sm:col-span-3">{error}</p> : null}
    </form>
  );
}

function CompanyForm({ company, onDone }: { company: Client; onDone: () => void }) {
  const [name, setName] = React.useState(company.name ?? "");
  const [description, setDescription] = React.useState(company.description ?? "");
  const [industry, setIndustry] = React.useState(company.industry ?? "");
  const [teamSize, setTeamSize] = React.useState(teamSizeLabel(company.teamSize) ?? "");
  const [location, setLocation] = React.useState(company.location ?? "");
  const [timezone, setTimezone] = React.useState(company.timezone ?? "");
  const [website, setWebsite] = React.useState(company.website ?? "");
  const [profileImage, setProfileImage] = React.useState(company.profileImage ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return setError("Enter the company name.");
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(firebaseDb, "clients", company.slug), {
        name: name.trim(),
        description: description.trim() || null,
        industry: industry.trim(),
        teamSize: teamSize || null,
        location: location.trim() || null,
        timezone: timezone || null,
        website: website.trim() || null,
        profileImage: profileImage.trim() || null,
        updatedAt: serverTimestamp(),
      });
      onDone();
    } catch (cause) {
      console.error("Unable to save company", cause);
      setError("Couldn’t save. Try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="grid gap-4 rounded-xl border border-border bg-background p-4 sm:p-5">
      <ImageUploadField label="Logo" value={profileImage} onChange={setProfileImage} variant="avatar" uploadPath={`clients/${company.slug}/logo`} />
      <label className={FIELD}>Company name<input value={name} onChange={(event) => setName(event.target.value)} className={INPUT} required /></label>
      <label className={FIELD}>About<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className={`${INPUT} h-auto py-2`} placeholder="What your company does" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={FIELD}>Industry<input value={industry} onChange={(event) => setIndustry(event.target.value)} className={INPUT} /></label>
        <label className={FIELD}>Team size
          <select value={teamSize} onChange={(event) => setTeamSize(event.target.value)} className={INPUT}>
            <option value="">Choose</option>
            {TEAM_SIZE_RANGES.map((size) => <option key={size} value={size}>{size === "1" ? "1 person" : `${size} people`}</option>)}
          </select>
        </label>
        <label className={FIELD}>City / Country<input value={location} onChange={(event) => setLocation(event.target.value)} className={INPUT} /></label>
        <label className={FIELD}>Time zone
          <select value={timezone} onChange={(event) => setTimezone(event.target.value)} className={INPUT}>
            <option value="">Choose</option>
            {(timezone && !CLIENT_TIMEZONES.includes(timezone) ? [timezone, ...CLIENT_TIMEZONES] : CLIENT_TIMEZONES).map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </select>
        </label>
      </div>
      <label className={FIELD}>Website<input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} className={INPUT} placeholder="https://" /></label>
      {error ? <p role="alert" className="m-0 text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="h-10 rounded-md px-4 text-sm font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
        <button type="submit" disabled={busy} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
      </div>
    </form>
  );
}
