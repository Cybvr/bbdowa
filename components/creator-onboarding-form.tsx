"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { completeCreatorOnboarding } from "@/lib/firebase/user-profiles";

type FormState = {
  name: string;
  craft: string;
  location: string;
  portfolio: string;
  instagram: string;
  linkedin: string;
  bio: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  craft: "",
  location: "",
  portfolio: "",
  instagram: "",
  linkedin: "",
  bio: "",
};

const FIELD = "h-11 rounded-xl bg-background text-sm";
const LABEL = "mb-1.5 block text-xs font-bold text-foreground";

export function CreatorOnboardingForm() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(null);

  React.useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) {
        router.replace("/auth/login?next=/onboarding/creator");
        setLoading(false);
        return;
      }
      setFirebaseUser(user);
      if (user.displayName) setForm((current) => ({ ...current, name: user.displayName ?? "" }));
      setLoading(false);
    });
  }, [router]);

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const nextStep = () => {
    if (!form.name.trim() || !form.craft.trim()) {
      setError("Your name and primary craft are required.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!firebaseUser) throw new Error("Your sign-in has expired. Please sign in again.");
      await completeCreatorOnboarding(firebaseUser, form);
      setSubmitted(true);
      window.setTimeout(() => router.replace("/dashboard/discover"), 900);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not save your creator profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[360px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (submitted) {
    return (
      <div className="py-12 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Profile submitted</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Your creator profile is now pending review. Taking you to the creator directory.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">Creator onboarding</p>
          <h1 className="m-0 mt-2 text-3xl font-bold tracking-tight">Tell us about your work</h1>
        </div>
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">Step {step} of 2</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-label={`Step ${step} of 2`}>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: step === 1 ? "50%" : "100%" }} />
      </div>

      {error ? <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">{error}</div> : null}

      {step === 1 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className={LABEL}>Name <span className="text-primary">*</span></span><Input className={FIELD} value={form.name} onChange={(event) => update("name", event.target.value)} required /></label>
          <label><span className={LABEL}>Primary craft <span className="text-primary">*</span></span><Input className={FIELD} placeholder="e.g. Art Director" value={form.craft} onChange={(event) => update("craft", event.target.value)} required /></label>
          <label><span className={LABEL}>Location</span><Input className={FIELD} placeholder="e.g. Lagos, Nigeria" value={form.location} onChange={(event) => update("location", event.target.value)} /></label>
          <div className="sm:col-span-2 flex justify-end"><button type="button" onClick={nextStep} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:brightness-95">Continue <ArrowRight className="h-4 w-4" /></button></div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className={LABEL}>Portfolio or website</span><Input className={FIELD} type="url" placeholder="https://…" value={form.portfolio} onChange={(event) => update("portfolio", event.target.value)} /></label>
          <label><span className={LABEL}>Instagram</span><Input className={FIELD} placeholder="https://instagram.com/…" value={form.instagram} onChange={(event) => update("instagram", event.target.value)} /></label>
          <label><span className={LABEL}>LinkedIn</span><Input className={FIELD} placeholder="https://linkedin.com/in/…" value={form.linkedin} onChange={(event) => update("linkedin", event.target.value)} /></label>
          <label className="sm:col-span-2"><span className={LABEL}>Short bio</span><Textarea className="min-h-28 rounded-xl bg-background text-sm" placeholder="What do you make and what kind of work do you want to do?" value={form.bio} onChange={(event) => update("bio", event.target.value)} /></label>
          <div className="sm:col-span-2 flex justify-between gap-3"><button type="button" onClick={() => setStep(1)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-5 text-sm font-bold hover:border-foreground"><ArrowLeft className="h-4 w-4" /> Back</button><button type="submit" disabled={submitting} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:brightness-95 disabled:opacity-60">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{submitting ? "Saving…" : "Submit profile"}</button></div>
        </div>
      )}
    </form>
  );
}
