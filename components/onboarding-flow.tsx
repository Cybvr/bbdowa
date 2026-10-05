"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { readDocumentsForAssignee, useFirestoreUsers } from "@/lib/firebase/client-content";
import { onboardingDoneMessage, sendSystemMessage } from "@/lib/firebase/system-messages";
import { Field, ImageUploadField, SelectField, TextField } from "@/components/detail-editor";
import { DocumentSignDialog } from "@/components/document-sign-dialog";
import { DocumentStatus } from "@/components/document-status";
import { formatDocumentDateTime, type AgencyDocument } from "@/lib/documents";
import { creatorCategoryOptions, isTeamUser, userRoles, type CreatorAvailability } from "@/lib/users";
import {
  EQUIPMENT_ITEMS,
  HR_COLLECTION,
  STEP_LABELS,
  ONBOARDING_STEPS,
  emptyHrRecord,
  type HrRecord,
  type OnboardingStep,
} from "@/lib/onboarding";

/** Keeps a saved answer in the list even if nobody else has it yet. */
function withCurrent(options: string[], current: string) {
  return current && !options.includes(current) ? [...options, current] : options;
}

type ProfileAnswers = {
  name: string;
  preferredName: string;
  phone: string;
  location: string;
  profileImage: string;
  title: string;
  department: string;
  category: string;
  portfolio: string;
  linkedin: string;
  instagram: string;
  availability: CreatorAvailability;
  craftNote: string;
};

const PRIMARY =
  "inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY =
  "inline-flex h-10 items-center gap-2 rounded-lg border border-border px-5 text-[13px] font-semibold text-foreground transition hover:border-foreground";

function clean(value: string) {
  return value.trim();
}

export function OnboardingFlow() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, markOnboarded } = useAuth();
  const uid = authUser?.uid ?? null;

  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [answers, setAnswers] = React.useState<ProfileAnswers | null>(null);
  const [hr, setHr] = React.useState<HrRecord | null>(null);
  const [documents, setDocuments] = React.useState<AgencyDocument[]>([]);
  const [signing, setSigning] = React.useState<AgencyDocument | null>(null);
  const [step, setStep] = React.useState<OnboardingStep>("profile");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Dropdowns use what's already in the directory: team departments, admins as managers, creator fields.
  const { users: directory } = useFirestoreUsers();
  const departmentOptions = React.useMemo(() => [...new Set(directory.filter(isTeamUser).map((person) => person.department?.trim()).filter((value): value is string => Boolean(value)))].sort(), [directory]);
  const managerOptions = React.useMemo(() => directory.filter((person) => userRoles(person).includes("admin")).map((person) => person.name).filter(Boolean).sort(), [directory]);
  const fieldOptions = React.useMemo(() => creatorCategoryOptions(directory).filter((value) => typeof value === "string" && value.trim()), [directory]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!uid) {
      router.replace("/auth/login?next=/onboarding");
      return;
    }

    let active = true;
    Promise.all([
      getDoc(doc(firebaseDb, "users", uid)),
      getDoc(doc(firebaseDb, HR_COLLECTION, uid)).catch(() => null),
      readDocumentsForAssignee(uid).catch(() => [] as AgencyDocument[]),
    ])
      .then(([userSnapshot, hrSnapshot, assigned]) => {
        if (!active) return;
        const data = userSnapshot.data() ?? {};
        setEmail(data.email ?? authUser?.email ?? null);
        setAnswers({
          name: data.name ?? authUser?.name ?? "",
          preferredName: data.preferredName ?? "",
          phone: data.phone ?? "",
          location: data.location ?? "",
          profileImage: data.profileImage ?? data.picture ?? "",
          title: data.title ?? "",
          department: data.department ?? "",
          category: data.category ?? data.craft ?? "",
          portfolio: data.portfolio ?? "",
          linkedin: data.linkedin ?? "",
          instagram: data.instagram ?? "",
          availability: data.availability ?? "unconfirmed",
          craftNote: data.craftNote ?? "",
        });
        setHr(hrSnapshot?.exists() ? { ...emptyHrRecord(uid), ...(hrSnapshot.data() as Partial<HrRecord>) } : emptyHrRecord(uid));
        setDocuments(assigned.filter((document) => document.status !== "draft"));
        setLoading(false);
      })
      .catch((cause) => {
        console.error("Unable to load onboarding", cause);
        if (active) {
          setError("We couldn’t load your details. Refresh to try again.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authLoading, uid, authUser?.email, authUser?.name, router]);

  const refreshDocuments = async () => {
    if (!uid) return;
    const assigned = await readDocumentsForAssignee(uid);
    setDocuments(assigned.filter((document) => document.status !== "draft"));
  };

  if (loading || !answers || !hr || !uid) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        {error ? <p className="text-sm text-destructive">{error}</p> : <Loader2 className="h-6 w-6 animate-spin text-primary" />}
      </div>
    );
  }

  // One onboarding for everyone, staff and creators alike.
  const steps = ONBOARDING_STEPS;
  const index = steps.indexOf(step);
  const set = <K extends keyof ProfileAnswers>(key: K) => (value: ProfileAnswers[K]) => setAnswers({ ...answers, [key]: value });
  const setContact = (key: keyof HrRecord["emergencyContact"]) => (value: string) =>
    setHr({ ...hr, emergencyContact: { ...hr.emergencyContact, [key]: value } });
  const unsigned = documents.filter((document) => document.status === "pending_signature");

  const profileFields = () => ({
    name: clean(answers.name),
    preferredName: clean(answers.preferredName) || null,
    phone: clean(answers.phone) || null,
    location: clean(answers.location),
    profileImage: clean(answers.profileImage) || null,
    title: clean(answers.title),
    department: clean(answers.department),
    category: clean(answers.category),
    portfolio: clean(answers.portfolio) || null,
    linkedin: clean(answers.linkedin) || null,
    instagram: clean(answers.instagram) || null,
    availability: answers.availability,
    craftNote: clean(answers.craftNote),
  });

  const validate = (target: OnboardingStep): string | null => {
    if (target === "profile" && !clean(answers.name)) return "Add your name to continue.";
    if (target === "hr" && (!clean(hr.emergencyContact.name) || !clean(hr.emergencyContact.phone))) {
      return "Add an emergency contact name and phone number to continue.";
    }
    return null;
  };

  // Every step saves as you leave it, so closing the tab never loses answers.
  const saveProgress = async (target: OnboardingStep) => {
    if (target === "profile" || target === "work") {
      await setDoc(doc(firebaseDb, "users", uid), { ...profileFields(), updatedAt: serverTimestamp() }, { merge: true });
    }
    if (target === "profile" || target === "work" || target === "hr") {
      await setDoc(doc(firebaseDb, HR_COLLECTION, uid), { ...hr, uid, updatedAt: new Date().toISOString() }, { merge: true });
    }
  };

  const goTo = async (next: OnboardingStep) => {
    const forward = steps.indexOf(next) > index;
    if (forward) {
      const problem = validate(step);
      if (problem) {
        setError(problem);
        return;
      }
    }
    setError(null);
    setBusy(true);
    try {
      await saveProgress(step);
      setStep(next);
      window.scrollTo({ top: 0 });
    } catch (cause) {
      console.error("Unable to save onboarding step", cause);
      setError("We couldn’t save that step. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // Skipping keeps whatever has been saved so far and stops onboarding from coming back.
  const skip = async () => {
    if (!uid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await setDoc(
        doc(firebaseDb, "users", uid),
        { onboardingRequired: false, onboardingStatus: "skipped", onboardingSkippedAt: serverTimestamp(), updatedAt: serverTimestamp() },
        { merge: true },
      );
      markOnboarded();
      router.replace("/dashboard");
    } catch (cause) {
      console.error("Unable to skip onboarding", cause);
      setError("We couldn’t skip onboarding. Try again.");
      setBusy(false);
    }
  };

  const complete = async () => {
    const problem = steps.map(validate).find(Boolean);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await setDoc(doc(firebaseDb, HR_COLLECTION, uid), { ...hr, uid, updatedAt: new Date().toISOString() }, { merge: true });
      await setDoc(
        doc(firebaseDb, "users", uid),
        { ...profileFields(), onboardingStatus: "complete", onboardingCompletedAt: serverTimestamp(), updatedAt: serverTimestamp() },
        { merge: true },
      );
      void sendSystemMessage(uid, answers.name, onboardingDoneMessage(answers.name));
      markOnboarded();
      router.replace("/dashboard");
    } catch (cause) {
      console.error("Unable to complete onboarding", cause);
      setError("We couldn’t finish onboarding. Try again.");
      setBusy(false);
    }
  };

  const reviewRows: { step: OnboardingStep; label: string; value: string }[] = [
    { step: "profile", label: "Name", value: answers.name },
    { step: "profile", label: "Preferred name", value: answers.preferredName },
    { step: "profile", label: "Email", value: email ?? "" },
    { step: "profile", label: "Phone", value: answers.phone },
    { step: "profile", label: "Location", value: answers.location },
    { step: "work", label: "Title", value: answers.title },
    { step: "work", label: "Department", value: answers.department },
    { step: "work", label: "Field", value: answers.category },
    { step: "work", label: "Manager", value: hr.managerName },
    { step: "work", label: "Start date", value: hr.startDate },
    { step: "work", label: "Portfolio", value: answers.portfolio },
    { step: "work", label: "Availability", value: answers.availability },
    {
      step: "hr",
      label: "Emergency contact",
      value: [hr.emergencyContact.name, hr.emergencyContact.relationship, hr.emergencyContact.phone].filter(Boolean).join(", "),
    },
    {
      step: "hr",
      label: "Equipment and access",
      value: `${EQUIPMENT_ITEMS.filter((item) => hr.equipment[item.key]).length} of ${EQUIPMENT_ITEMS.length} confirmed`,
    },
    {
      step: "policies",
      label: "Policies",
      value: documents.length ? `${documents.length - unsigned.length} of ${documents.length} signed` : "Nothing to sign",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="m-0 text-[13px] font-semibold text-primary">Welcome to BBDO West Africa</p>
          <h1 className="m-0 mt-2 text-[28px] font-bold leading-tight tracking-tight">{STEP_LABELS[step]}</h1>
        </div>
        <button type="button" disabled={busy} onClick={() => void skip()} className="shrink-0 text-[13px] font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50">
          Skip for now
        </button>
      </div>

      <ol className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 border-b border-border p-0 pb-3" aria-label="Onboarding steps">
        {steps.map((entry, position) => {
          const done = position < index;
          const current = entry === step;
          return (
            <li key={entry}>
              <button
                type="button"
                disabled={busy || position > index}
                onClick={() => void goTo(entry)}
                aria-current={current ? "step" : undefined}
                className={`inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-semibold disabled:cursor-default ${
                  current ? "text-foreground" : done ? "cursor-pointer text-muted-foreground hover:text-foreground" : "text-muted-foreground/60"
                }`}
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${
                    current ? "bg-foreground text-background" : done ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-3 w-3" aria-hidden="true" /> : position + 1}
                </span>
                {STEP_LABELS[entry]}
              </button>
            </li>
          );
        })}
      </ol>

      {error ? (
        <p role="alert" className="m-0 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-[13px] font-medium text-destructive">
          {error}
        </p>
      ) : null}

      {step === "profile" ? (
        <div className="space-y-4">
          <ImageUploadField label="Profile photo" value={answers.profileImage} onChange={set("profileImage")} variant="avatar" uploadPath={`users/${uid}/avatar`} />
          <TextField label="Full name" value={answers.name} onChange={set("name")} required />
          <TextField label="Preferred name" value={answers.preferredName} onChange={set("preferredName")} placeholder="What should people call you?" />
          <Field label="Email">
            <p className="m-0 text-[14px] text-muted-foreground">{email ?? "Not set"}</p>
          </Field>
          <TextField label="Phone" value={answers.phone} onChange={set("phone")} />
          <TextField label="Location" value={answers.location} onChange={set("location")} placeholder="e.g. Lagos, Nigeria" />
          <TextField label="Bank name" value={hr.bankName} onChange={(value) => setHr({ ...hr, bankName: value })} />
          <TextField label="Account number" value={hr.accountNumber} onChange={(value) => setHr({ ...hr, accountNumber: value })} />
        </div>
      ) : null}

      {step === "work" ? (
        <div className="space-y-4">
          <TextField label="Job title" value={answers.title} onChange={set("title")} placeholder="e.g. Senior Copywriter" />
          <SelectField
            label="Department"
            value={answers.department || undefined}
            onChange={set("department")}
            options={withCurrent(departmentOptions, answers.department).map((value) => ({ value, label: value }))}
          />
          <SelectField
            label="Manager"
            value={hr.managerName || undefined}
            onChange={(value) => setHr({ ...hr, managerName: value })}
            options={withCurrent(managerOptions, hr.managerName).map((value) => ({ value, label: value }))}
          />
          <TextField label="Start date" value={hr.startDate} onChange={(value) => setHr({ ...hr, startDate: value })} type="date" />
          <SelectField
            label="Field"
            value={answers.category || undefined}
            onChange={set("category")}
            options={withCurrent(fieldOptions, answers.category).map((value) => ({ value, label: value }))}
          />
          <SelectField
            label="Availability"
            value={answers.availability}
            onChange={(value) => set("availability")(value as CreatorAvailability)}
            options={[
              { value: "open", label: "Open to work" },
              { value: "busy", label: "Busy" },
              { value: "unconfirmed", label: "Not sure yet" },
            ]}
          />
          <p className="m-0 text-[12px] text-muted-foreground">Everything here is optional. Your manager and start date are only visible to you and the people team.</p>
        </div>
      ) : null}

      {step === "hr" ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="m-0 text-[15px] font-semibold">Emergency contact</h2>
            <TextField label="Name" value={hr.emergencyContact.name} onChange={setContact("name")} required />
            <TextField label="Relationship" value={hr.emergencyContact.relationship} onChange={setContact("relationship")} placeholder="e.g. Sister" />
            <TextField label="Phone" value={hr.emergencyContact.phone} onChange={setContact("phone")} required />
          </div>
          <div className="space-y-3">
            <h2 className="m-0 text-[15px] font-semibold">Equipment and access</h2>
            <p className="m-0 text-[13px] text-muted-foreground">Tick what you already have. Anything left unticked tells the people team what to sort out.</p>
            <ul className="m-0 list-none space-y-1 p-0">
              {EQUIPMENT_ITEMS.map((item) => (
                <li key={item.key}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2 text-[14px] hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={Boolean(hr.equipment[item.key])}
                      onChange={(event) => setHr({ ...hr, equipment: { ...hr.equipment, [item.key]: event.target.checked } })}
                      className="h-4 w-4 accent-primary"
                    />
                    {item.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {step === "policies" ? (
        <div className="space-y-4">
          {documents.length ? (
            <>
              <p className="m-0 text-[14px] text-muted-foreground">
                Read and sign each document sent to you. Your name and the time you sign are saved against that document.
              </p>
              <ul className="m-0 list-none divide-y divide-border rounded-xl border border-border p-0">
                {documents.map((document) => (
                  <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="m-0 text-[14px] font-semibold">{document.title}</p>
                      <p className="m-0 mt-1 text-[12px] text-muted-foreground">
                        {document.status === "signed"
                          ? `Signed by ${document.signedName} on ${formatDocumentDateTime(document.signedAt)}`
                          : `Sent by ${document.createdByName ?? "the agency"}`}
                      </p>
                    </div>
                    {document.status === "pending_signature" ? (
                      <button type="button" onClick={() => setSigning(document)} className={SECONDARY}>
                        Read and sign
                      </button>
                    ) : (
                      <DocumentStatus status={document.status} />
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="m-0 rounded-xl border border-dashed border-border p-6 text-center text-[14px] text-muted-foreground">
              Nothing to sign right now. When the agency sends you a contract or policy, it will show up here and under Work.
            </p>
          )}
          {signing ? (
            <DocumentSignDialog
              document={signing}
              defaultName={answers.name}
              open
              hideTrigger
              onOpenChange={(open) => {
                if (!open) setSigning(null);
              }}
              onSigned={() => {
                setSigning(null);
                void refreshDocuments();
              }}
            />
          ) : null}
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-4">
          <p className="m-0 text-[14px] text-muted-foreground">Check your answers. You can change any of this later in Settings.</p>
          <dl className="m-0 divide-y divide-border rounded-xl border border-border">
            {reviewRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_auto] items-baseline gap-3 px-4 py-3">
                <dt className="text-[13px] text-muted-foreground">{row.label}</dt>
                <dd className="m-0 break-words text-[14px]">{row.value || <span className="text-muted-foreground">Not given</span>}</dd>
                <button type="button" onClick={() => void goTo(row.step)} className="border-0 bg-transparent p-0 text-[12px] font-semibold text-primary hover:underline">
                  Edit
                </button>
              </div>
            ))}
          </dl>
          {unsigned.length ? (
            <p className="m-0 text-[13px] text-muted-foreground">
              You still have {unsigned.length === 1 ? "one document" : `${unsigned.length} documents`} to sign. You can finish now and sign from Work later.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-between gap-3 border-t border-border pt-5">
        {index > 0 ? (
          <button type="button" disabled={busy} onClick={() => void goTo(steps[index - 1])} className={SECONDARY}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        ) : (
          <span />
        )}
        {step === "review" ? (
          <button type="button" disabled={busy} onClick={() => void complete()} className={PRIMARY}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Finish onboarding
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => void goTo(steps[index + 1])} className={PRIMARY}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
