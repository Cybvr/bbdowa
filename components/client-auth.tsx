"use client";

import * as React from "react";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { firebaseAuth, firebaseDb } from "@/lib/firebase/client";
import { CLIENT_INVITES_COLLECTION, CLIENT_TIMEZONES, TEAM_SIZE_RANGES } from "@/lib/clients";

const FIELD = "block space-y-1.5 text-sm font-medium";
const INPUT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/40";
const PRIMARY = "h-10 w-full rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50";

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "company";
}

function authMessage(cause: unknown) {
  if (!(cause instanceof FirebaseError)) return "We couldn’t sign you in. Try again.";
  switch (cause.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password didn’t match.";
    case "auth/email-already-in-use":
      return "An account already uses this email. Sign in instead.";
    case "auth/weak-password":
      return "Use a password with at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/popup-closed-by-user":
      return "The sign-in window was closed before it finished.";
    default:
      return "We couldn’t sign you in. Try again.";
  }
}

/**
 * Where a signed-in person goes from the client sign-in: their portal if they're
 * a client, the company step if they're new, or the staff sign-in if they're not a client.
 */
async function routeAfterSignIn(user: User): Promise<string | null> {
  const snapshot = await getDoc(doc(firebaseDb, "users", user.uid));
  if (snapshot.exists()) {
    return snapshot.data().role === "client" ? "/portal" : null;
  }
  // Someone we added by email becomes a client of that company right away.
  if (user.email) {
    const invite = await getDoc(doc(firebaseDb, CLIENT_INVITES_COLLECTION, user.email.toLowerCase())).catch(() => null);
    const data = invite?.exists() ? invite.data() : null;
    if (data && typeof data.clientId === "string") {
      await setDoc(doc(firebaseDb, "users", user.uid), {
        uid: user.uid,
        slug: `${slugify(user.displayName ?? data.name ?? "client")}-${user.uid.slice(0, 4).toLowerCase()}`,
        name: user.displayName ?? data.name ?? null,
        email: user.email,
        role: "client",
        roles: ["client"],
        clientId: data.clientId,
        type: "client",
        title: typeof data.title === "string" ? data.title : "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return "/portal";
    }
  }
  return "/portal/signup/company";
}

/** Client-only sign in / sign up. Staff and creators use the main sign-in. */
export function ClientAuth({ mode }: { mode: "signin" | "signup" }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notClient, setNotClient] = React.useState(false);

  const finish = async (user: User) => {
    const next = await routeAfterSignIn(user);
    if (!next) {
      setNotClient(true);
      setBusy(false);
      return;
    }
    // A full load so the app picks up the new account.
    window.location.assign(next);
  };

  const withEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const credential = mode === "signup"
        ? await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password)
        : await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      await finish(credential.user);
    } catch (cause) {
      setError(authMessage(cause));
      setBusy(false);
    }
  };

  const withGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(firebaseAuth, provider);
      await finish(credential.user);
    } catch (cause) {
      setError(authMessage(cause));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="m-0 text-page-title font-bold">{mode === "signup" ? "Hire with BBDO West Africa" : "Client sign in"}</h1>
        <p className="mb-0 mt-1 text-sm text-muted-foreground">{mode === "signup" ? "Create your account, set up your company, and post your first job." : "Sign in to post jobs and follow your work."}</p>
      </div>
      {notClient ? (
        <p role="alert" className="m-0 rounded-lg border border-border bg-muted p-3 text-sm">This email belongs to a staff or creator account. <Link href="/auth/login" className="font-semibold text-primary">Use the main sign-in</Link>.</p>
      ) : null}
      <button type="button" onClick={() => void withGoogle()} disabled={busy} className="h-10 w-full rounded-md border border-border bg-background text-sm font-semibold hover:border-foreground disabled:opacity-50">Continue with Google</button>
      <form onSubmit={withEmail} className="space-y-3">
        <label className={FIELD}>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={INPUT} required autoComplete="email" /></label>
        <label className={FIELD}>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={INPUT} required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>
        {error ? <p role="alert" className="m-0 text-sm text-destructive">{error}</p> : null}
        <button type="submit" disabled={busy} className={PRIMARY}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
      </form>
      <p className="m-0 text-center text-sm text-muted-foreground">
        {mode === "signup" ? <>Already have an account? <Link href="/portal/login" className="font-semibold text-primary">Sign in</Link></> : <>New here? <Link href="/portal/signup" className="font-semibold text-primary">Create an account</Link></>}
      </p>
    </div>
  );
}

/** Step 2 of client sign-up: create the company they'll own. */
export function CompanySetup() {
  const { user, role, loading } = useAuth();
  const [name, setName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [teamSize, setTeamSize] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [timezone, setTimezone] = React.useState("Africa/Lagos");
  const [website, setWebsite] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (loading) return;
    if (!user) window.location.assign("/portal/signup");
    else if (role === "client") window.location.assign("/portal");
    else if (role) window.location.assign("/dashboard");
    else setName((current) => current || user.name || "");
  }, [loading, role, user]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || busy) return;
    if (!companyName.trim()) return setError("Enter your company name.");
    setBusy(true);
    setError(null);
    try {
      // Pick an unused id for the company, e.g. "acme" or "acme-2".
      const base = slugify(companyName);
      let slug = base;
      for (let attempt = 2; (await getDoc(doc(firebaseDb, "clients", slug))).exists(); attempt += 1) slug = `${base}-${attempt}`;
      const now = new Date().toISOString();
      await setDoc(doc(firebaseDb, "clients", slug), {
        type: "client",
        slug,
        name: companyName.trim(),
        industry: industry.trim(),
        teamSize: teamSize || null,
        location: location.trim() || null,
        timezone: timezone || null,
        website: website.trim() || null,
        description: null,
        date: null,
        internal: false,
        ownerUid: user.uid,
        createdAt: now,
        updatedAt: now,
      });
      await setDoc(doc(firebaseDb, "users", user.uid), {
        uid: user.uid,
        slug: `${slugify(name || companyName)}-${user.uid.slice(0, 4).toLowerCase()}`,
        name: name.trim() || null,
        email: user.email,
        role: "client",
        roles: ["client"],
        clientId: slug,
        clientRole: "owner",
        type: "client",
        title: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      window.location.assign("/portal");
    } catch (cause) {
      console.error("Unable to set up company", cause);
      setError("Couldn’t set up your company. Try again.");
      setBusy(false);
    }
  };

  if (loading || !user || role) return null;

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <h1 className="m-0 text-page-title font-bold">Set up your company</h1>
        <p className="mb-0 mt-1 text-sm text-muted-foreground">You’ll be its owner and can add colleagues later.</p>
      </div>
      <label className={FIELD}>Your name<input value={name} onChange={(event) => setName(event.target.value)} className={INPUT} required /></label>
      <label className={FIELD}>Company name<input value={companyName} onChange={(event) => setCompanyName(event.target.value)} className={INPUT} required /></label>
      <label className={FIELD}>Industry<input value={industry} onChange={(event) => setIndustry(event.target.value)} className={INPUT} placeholder="e.g. Food & beverages" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={FIELD}>Team size
          <select value={teamSize} onChange={(event) => setTeamSize(event.target.value)} className={INPUT}>
            <option value="">Choose</option>
            {TEAM_SIZE_RANGES.map((size) => <option key={size} value={size}>{size === "1" ? "1 person" : `${size} people`}</option>)}
          </select>
        </label>
        <label className={FIELD}>Time zone
          <select value={timezone} onChange={(event) => setTimezone(event.target.value)} className={INPUT}>
            {CLIENT_TIMEZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </select>
        </label>
      </div>
      <label className={FIELD}>City / Country<input value={location} onChange={(event) => setLocation(event.target.value)} className={INPUT} placeholder="e.g. Lagos, Nigeria" /></label>
      <label className={FIELD}>Website<input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} className={INPUT} placeholder="https://" /></label>
      {error ? <p role="alert" className="m-0 text-sm text-destructive">{error}</p> : null}
      <button type="submit" disabled={busy} className={PRIMARY}>{busy ? "Setting up…" : "Create company"}</button>
    </form>
  );
}
