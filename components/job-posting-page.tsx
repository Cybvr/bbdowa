"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useAuth } from "@/components/auth-provider";
import { RichTextContent, richTextHasContent } from "@/components/rich-text-editor";
import { Badge } from "@/components/dashboard/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { firebaseAuth, firebaseDb, firebaseStorage } from "@/lib/firebase/client";
import { notify } from "@/lib/email/notify";
import { longDate } from "@/lib/format";
import { loadNdaState, type NdaState } from "@/lib/firebase/master-nda";
import { upsertUserProfile } from "@/lib/firebase/user-profiles";
import {
  APPLICANT_STATUS_LABELS,
  JOB_APPLICATIONS_COLLECTION,
  JOB_POSTINGS_COLLECTION,
  applicationId,
  coverLetter,
  normalizePosting,
  postingHref,
  type ApplicationAttachment,
  type JobApplication,
  type JobPosting,
} from "@/lib/job-postings";

const FIELD = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40";
const LABEL = "block space-y-1.5 text-sm font-medium";
const HINT = "m-0 text-xs font-normal text-muted-foreground";
const ATTACHMENT_TYPES = ".pdf,.doc,.docx,image/*";
const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

type Draft = {
  name: string;
  email: string;
  coverIntro: string;
  answers: string[];
  attachment: ApplicationAttachment | null;
};

function emptyDraft(posting: JobPosting, user: { name: string | null; email: string | null } | null): Draft {
  return { name: user?.name ?? "", email: user?.email ?? "", coverIntro: "", answers: posting.questions.map(() => ""), attachment: null };
}

function draftFromApplication(posting: JobPosting, application: JobApplication): Draft {
  return {
    name: application.name ?? "",
    email: application.email ?? "",
    coverIntro: coverLetter(application),
    answers: posting.questions.map((question) => application.answers.find((item) => item.question === question)?.answer ?? ""),
    attachment: application.attachment ?? null,
  };
}

// The draft is kept in the browser so a reload doesn't lose the person's answers.
const draftKey = (postingId: string) => `bbdowa.application.${postingId}`;
type StoredDraft = { draft: Draft };

function readStoredDraft(postingId: string): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(postingId));
    return raw ? (JSON.parse(raw) as StoredDraft) : null;
  } catch {
    return null;
  }
}

function writeStoredDraft(postingId: string, value: StoredDraft | null) {
  try {
    if (value) window.localStorage.setItem(draftKey(postingId), JSON.stringify(value));
    else window.localStorage.removeItem(draftKey(postingId));
  } catch {
    // Storage can be blocked; the form still works while the page is open.
  }
}

// The name and email on the form are the sign-up. Someone who already has an
// account with that email is signed in with the password they give.
async function accountFromForm(name: string, email: string, password: string): Promise<string> {
  try {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await upsertUserProfile(credential.user, "creator");
    return credential.user.uid;
  } catch (cause) {
    if (!(cause instanceof FirebaseError) || cause.code !== "auth/email-already-in-use") throw cause;
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return credential.user.uid;
  }
}

function accountProblem(cause: unknown): string | null {
  if (!(cause instanceof FirebaseError)) return null;
  if (cause.code === "auth/invalid-credential" || cause.code === "auth/wrong-password") return "That email already has an account and the password didn't match.";
  if (cause.code === "auth/weak-password") return "Use a password of at least 6 characters.";
  if (cause.code === "auth/invalid-email") return "Add a valid email address.";
  if (cause.code === "auth/network-request-failed") return "Couldn't connect. Check your connection and try again.";
  return null;
}

function problemWith(draft: Draft, posting: JobPosting, file: File | null, password: string | null): string | null {
  if (password !== null) {
    if (!draft.name.trim()) return "Add your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) return "Add a valid email address.";
    if (password.length < 6) return "Choose a password of at least 6 characters.";
  }
  if (!draft.coverIntro.trim()) return "Write your cover letter.";
  if (posting.questions.some((_, index) => !draft.answers[index]?.trim())) return "Answer the application questions.";
  if (!file && !draft.attachment) return "Attach your CV or portfolio.";
  return null;
}

function PostingTerms({ posting }: { posting: JobPosting }) {
  const facts = [["Commitment", posting.commitment], ["Rate", posting.budget], ["Job length", posting.duration], ["Industry", posting.industry], ["Job type", posting.workSetup === "Onsite" ? "On-site" : posting.workSetup]].filter(([, value]) => value);
  if (!facts.length && !posting.skills.length) return null;
  return <section className="border-t border-border pt-6">
    <h2 className="m-0 text-base font-semibold">Terms</h2>
    <dl className="m-0 mt-3 grid gap-1.5 text-sm">
      {facts.map(([label, value]) => <div key={label} className="flex gap-1.5"><dt className="text-muted-foreground">{label}:</dt><dd className="m-0 font-medium">{value}</dd></div>)}
      {posting.skills.length ? <div className="flex flex-wrap items-center gap-1.5"><dt className="text-muted-foreground">Skills:</dt><dd className="m-0"><ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">{posting.skills.map((skill) => <li key={skill}><Badge>{skill}</Badge></li>)}</ul></dd></div> : null}
    </dl>
  </section>;
}

function PostedDate({ posting }: { posting: JobPosting }) {
  if (!posting.createdAt) return null;
  return <p className="mb-0 mt-2 text-xs text-muted-foreground">Posted {longDate(posting.createdAt.slice(0, 10))}</p>;
}

function PostingSummary({ posting }: { posting: JobPosting }) {
  return <article>
    <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{posting.clientLabel || "Confidential client"}</p>
    <h1 className="mb-0 mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{posting.headline || "Open job"}</h1>
    <PostedDate posting={posting} />
    <div className="mt-8"><PostingTerms posting={posting} /></div>
    {richTextHasContent(posting.brief) ? <section className="mt-8 border-t border-border pt-6"><h2 className="m-0 text-base font-semibold">About</h2><RichTextContent value={posting.brief} className="mt-3 max-w-[70ch] text-body" /></section> : null}
    {posting.deliverables.length ? <section className="mt-8 border-t border-border pt-6"><h2 className="m-0 text-base font-semibold">Deliverables</h2><ul className="m-0 mt-3 grid gap-1.5 pl-5 text-[15px]">{posting.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
  </article>;
}

function ApplicationStatusPanel({ application, onEdit }: { application: JobApplication; onEdit: () => void }) {
  const [nda, setNda] = React.useState<NdaState | null>(null);
  React.useEffect(() => {
    if (application.status !== "shortlisted" && application.status !== "hired") return;
    let active = true;
    loadNdaState(application.uid).then((state) => { if (active) setNda(state); }).catch(() => { if (active) setNda({ status: "none", documentId: null }); });
    return () => { active = false; };
  }, [application.status, application.uid]);

  const jobLink = application.jobSlug ? (application.status === "hired" ? `/dashboard/my-jobs/${encodeURIComponent(application.jobSlug)}` : `/dashboard/jobs/${encodeURIComponent(application.jobSlug)}`) : null;

  return <section className="rounded-xl border border-border bg-background p-5">
    <div className="flex items-center justify-between gap-3">
      <h2 className="m-0 text-base font-semibold">Your application</h2>
      <Badge tone={application.status === "declined" ? "neutral" : "active"}>{APPLICANT_STATUS_LABELS[application.status]}</Badge>
    </div>
    {application.status === "submitted" ? <>
      <p className="mb-0 mt-3 text-sm text-muted-foreground">Sent. We&apos;ll let you know if you&apos;re shortlisted.</p>
      <Button type="button" variant="outline" className="mt-4" onClick={onEdit}>Edit application</Button>
    </> : null}
    {application.status === "declined" ? <p className="mb-0 mt-3 text-sm text-muted-foreground">Thanks for applying. The client went with someone else this time.</p> : null}
    {application.status === "shortlisted" || application.status === "hired" ? !nda ? <p className="mb-0 mt-3 text-sm text-muted-foreground">Checking your NDA…</p>
      : nda.status === "signed" || application.status === "hired" ? <>
        <p className="mb-0 mt-3 text-sm text-muted-foreground">{application.status === "hired" ? "You're on the job." : "You're shortlisted and your NDA is signed."}</p>
        {jobLink ? <Link href={jobLink} className={buttonVariants({ className: "mt-4" })}>Open the full brief</Link> : null}
      </> : nda.status === "pending" && nda.documentId ? <>
        <p className="mb-0 mt-3 text-sm text-muted-foreground">You&apos;re shortlisted. Sign our NDA to see the client and the full brief. You only sign it once.</p>
        <Link href={`/dashboard/documents/${encodeURIComponent(nda.documentId)}`} className={buttonVariants({ className: "mt-4" })}>Sign the NDA</Link>
      </> : <p className="mb-0 mt-3 text-sm text-muted-foreground">You&apos;re shortlisted. We&apos;ll send you our NDA shortly.</p>
      : null}
  </section>;
}

type View = "posting" | "form";

export function JobPostingPage({ postingId }: { postingId: string }) {
  const { user, loading: authLoading, isViewingAs } = useAuth();
  const [posting, setPosting] = React.useState<JobPosting | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [application, setApplication] = React.useState<JobApplication | null>(null);
  const [view, setView] = React.useState<View>("posting");
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [password, setPassword] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [justSent, setJustSent] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    let active = true;
    getDoc(doc(firebaseDb, JOB_POSTINGS_COLLECTION, postingId))
      .then((snapshot) => { if (active) setPosting(snapshot.exists() ? normalizePosting(snapshot.id, snapshot.data()) : null); })
      .catch(() => { if (active) setPosting(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [postingId]);

  // Signed in: load their application, if any.
  React.useEffect(() => {
    if (authLoading || !user) { setApplication(null); return; }
    let active = true;
    getDoc(doc(firebaseDb, JOB_APPLICATIONS_COLLECTION, applicationId(postingId, user.uid)))
      .then((snapshot) => { if (active) setApplication(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as JobApplication) : null); })
      .catch(() => { if (active) setApplication(null); });
    return () => { active = false; };
  }, [authLoading, postingId, user]);

  // Pick up a draft left from an earlier visit.
  React.useEffect(() => {
    if (!posting || draft) return;
    const stored = readStoredDraft(postingId);
    if (stored) {
      setDraft({ ...emptyDraft(posting, null), ...stored.draft, answers: posting.questions.map((_, index) => stored.draft.answers?.[index] ?? "") });
      setView("form");
    }
  }, [draft, posting, postingId]);

  const startApplying = () => {
    if (!posting) return;
    setError(null);
    setDraft(application ? draftFromApplication(posting, application) : draft ?? emptyDraft(posting, user));
    setView("form");
  };

  const chooseFile = (next: File | null) => {
    if (next && next.size > ATTACHMENT_MAX_BYTES) { setError("Attachments can be up to 10 MB."); return; }
    setError(null);
    setFile(next);
  };

  const submit = async (current: Draft) => {
    if (!posting) return;
    const problem = problemWith(current, posting, file, user ? null : password);
    if (problem) { setError(problem); return; }
    setSending(true);
    setError(null);
    try {
      const uid = user?.uid ?? await accountFromForm(current.name.trim(), current.email.trim(), password);
      const now = new Date().toISOString();
      const id = applicationId(posting.id, uid);
      // Someone who signed in through the form may have applied before.
      // The rules refuse reads of an application that doesn't exist yet, so a refusal means none.
      const earlier = application ?? await getDoc(doc(firebaseDb, JOB_APPLICATIONS_COLLECTION, id))
        .then((snapshot) => snapshot.data() as JobApplication | undefined)
        .catch(() => undefined);
      let attachment = current.attachment;
      if (file) {
        const path = `applications/${uid}/${posting.id}-${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_").slice(-80)}`;
        const uploaded = await uploadBytes(ref(firebaseStorage, path), file, { contentType: file.type || "application/octet-stream" });
        if (current.attachment?.path) void deleteObject(ref(firebaseStorage, current.attachment.path)).catch(() => undefined);
        attachment = { name: file.name.slice(0, 160), url: await getDownloadURL(uploaded.ref), path };
      }
      const record: Omit<JobApplication, "id"> = {
        postingId: posting.id,
        uid,
        name: (user?.name ?? current.name.trim()).slice(0, 120),
        email: (user?.email ?? current.email.trim()).toLowerCase().slice(0, 200),
        coverIntro: current.coverIntro.trim().slice(0, 4000),
        answers: posting.questions.map((question, index) => ({ question, answer: (current.answers[index] ?? "").trim().slice(0, 1500) })),
        attachment,
        status: "submitted",
        jobSlug: null,
        createdAt: earlier?.createdAt ?? now,
        updatedAt: now,
      };
      await setDoc(doc(firebaseDb, JOB_APPLICATIONS_COLLECTION, id), record);
      if (!earlier) void notify({ event: "application.submitted", id });
      writeStoredDraft(posting.id, null);
      setApplication({ id, ...record });
      setDraft(null);
      setFile(null);
      if (!earlier) { router.push(`${postingHref(posting.id)}/sent`); return; }
      setJustSent(true);
      setView("posting");
    } catch (cause) {
      console.error("Unable to send application", cause);
      setError(accountProblem(cause) ?? "Couldn't send your application. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current, [key]: value };
      if (posting) writeStoredDraft(posting.id, { draft: next });
      return next;
    });
  };

  const closed = posting?.status === "closed";

  return <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-10 sm:py-16">
    <div className="mx-auto max-w-3xl">
      <Link href="/" className="inline-flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/bbdo-west-africa.png" alt="BBDO West Africa" className="h-7 w-auto object-contain dark:brightness-0 dark:invert" />
      </Link>

      {loading ? <p className="mt-12 text-sm text-muted-foreground">Loading job…</p> : !posting ? <section className="mt-12 border-t border-border pt-8">
        <h1 className="m-0 text-3xl font-bold">Job unavailable</h1>
        <p className="mt-3 text-muted-foreground">This job link no longer works.</p>
      </section> : <div className="mt-12 grid gap-8">
        {view === "posting" ? <>
          {justSent ? <p role="status" className="m-0 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">Changes saved.</p> : null}
          {application ? <ApplicationStatusPanel application={application} onEdit={() => void startApplying()} /> : null}
          <PostingSummary posting={posting} />
          {!application && !isViewingAs ? closed
            ? <p className="m-0 text-sm text-muted-foreground">This job is no longer taking applications.</p>
            : <div className="sticky bottom-4 z-10 flex justify-end"><Button type="button" size="lg" onClick={() => void startApplying()}>Apply</Button></div> : null}
        </> : null}

        {view === "form" && draft ? <form onSubmit={(event) => { event.preventDefault(); void submit(draft); }} className="grid gap-8">
          <div>
            <button type="button" onClick={() => setView("posting")} className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Back to the job</button>
            <h1 className="mb-0 mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Apply: {posting.headline || "Open job"}</h1>
            <PostedDate posting={posting} />
          </div>

          <PostingTerms posting={posting} />

          {user ? null : <section className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h2 className="m-0 text-base font-semibold">Your details</h2>
              <p className={`${HINT} mt-1`}>This creates your account, so you can come back to check on your application.</p>
            </div>
            <label className={LABEL}>Name
              <input value={draft.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" className={FIELD} />
            </label>
            <label className={LABEL}>Email
              <input type="email" value={draft.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" className={FIELD} />
            </label>
            <label className={`${LABEL} sm:col-span-2`}>Create password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className={FIELD} />
            </label>
          </section>}

          <section className="grid gap-4 border-t border-border pt-6">
            <h2 className="m-0 text-base font-semibold"><label htmlFor="cover-letter">Cover letter</label></h2>
            <textarea id="cover-letter" value={draft.coverIntro} onChange={(event) => update("coverIntro", event.target.value)} rows={8} className={`${FIELD} resize-y`} />
          </section>

          {posting.questions.length ? <section className="grid gap-4 border-t border-border pt-6">
            <h2 className="m-0 text-base font-semibold">Application questions</h2>
            {posting.questions.map((question, index) => <label key={question} className={LABEL}>{question}
              <textarea value={draft.answers[index] ?? ""} onChange={(event) => update("answers", draft.answers.map((answer, at) => at === index ? event.target.value : answer))} rows={3} className={`${FIELD} resize-y`} />
            </label>)}
          </section> : null}

          <section className="grid gap-3 border-t border-border pt-6">
            <h2 className="m-0 text-base font-semibold">Attachment</h2>
            <p className={HINT}>CV or portfolio. PDF, Word or image, up to 10 MB.</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className={buttonVariants({ variant: "outline", className: "cursor-pointer" })}>
                {file || draft.attachment ? "Replace file" : "Choose file"}
                <input type="file" accept={ATTACHMENT_TYPES} onChange={(event) => { chooseFile(event.target.files?.[0] ?? null); event.target.value = ""; }} className="sr-only" />
              </label>
              {file ? <span className="min-w-0 truncate text-sm">{file.name}</span>
                : draft.attachment ? <a href={draft.attachment.url} target="_blank" rel="noreferrer" className="min-w-0 truncate text-sm underline underline-offset-4">{draft.attachment.name}</a> : null}
            </div>
          </section>

          {error ? <p role="alert" className="m-0 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <Button type="submit" size="lg" disabled={sending}>{sending ? "Sending…" : application ? "Save changes" : "Send application"}</Button>
          </div>
        </form> : null}
      </div>}

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
        <p className="m-0">© 2025 - 2026 Caser&apos;s Group</p>
        <ul className="m-0 flex list-none gap-4 p-0">
          <li><Link href="/about" className="hover:text-foreground">Terms</Link></li>
          <li><Link href="/about" className="hover:text-foreground">Privacy</Link></li>
        </ul>
      </footer>
    </div>
  </main>;
}
