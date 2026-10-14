"use client";

import * as React from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "@/components/auth-provider";
import { LoginForm } from "@/components/login-form";
import { RichTextContent, richTextHasContent } from "@/components/rich-text-editor";
import { Badge } from "@/components/dashboard/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { firebaseDb, firebaseStorage } from "@/lib/firebase/client";
import { notify } from "@/lib/email/notify";
import { longDate } from "@/lib/format";
import { loadNdaState, type NdaState } from "@/lib/firebase/master-nda";
import {
  APPLICATION_STATUS_LABELS,
  JOB_APPLICATIONS_COLLECTION,
  JOB_POSTINGS_COLLECTION,
  applicationId,
  coverLetter,
  normalizePosting,
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
  coverIntro: string;
  answers: string[];
  attachment: ApplicationAttachment | null;
};

function emptyDraft(posting: JobPosting): Draft {
  return { coverIntro: "", answers: posting.questions.map(() => ""), attachment: null };
}

function draftFromApplication(posting: JobPosting, application: JobApplication): Draft {
  return {
    coverIntro: coverLetter(application),
    answers: posting.questions.map((question) => application.answers.find((item) => item.question === question)?.answer ?? ""),
    attachment: application.attachment ?? null,
  };
}

// A chosen file can't go in localStorage, so it's held here while the person creates an account.
const pendingFiles = new Map<string, File>();

// The draft is kept in the browser while the person creates an account, so
// the application can send itself once they're signed in.
const draftKey = (postingId: string) => `bbdowa.application.${postingId}`;
type StoredDraft = { draft: Draft; send: boolean };

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

function problemWith(draft: Draft, posting: JobPosting, file: File | null): string | null {
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
      <Badge tone={application.status === "declined" ? "neutral" : "active"}>{APPLICATION_STATUS_LABELS[application.status]}</Badge>
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

type View = "posting" | "form" | "account";

export function JobPostingPage({ postingId }: { postingId: string }) {
  const { user, loading: authLoading, isViewingAs } = useAuth();
  const [posting, setPosting] = React.useState<JobPosting | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [application, setApplication] = React.useState<JobApplication | null>(null);
  const [view, setView] = React.useState<View>("posting");
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [file, setFile] = React.useState<File | null>(() => pendingFiles.get(postingId) ?? null);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [justSent, setJustSent] = React.useState(false);
  const autoSent = React.useRef(false);

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

  // Pick up a draft saved before sign-up.
  React.useEffect(() => {
    if (!posting || draft) return;
    const stored = readStoredDraft(postingId);
    if (stored) {
      setDraft({ ...emptyDraft(posting), ...stored.draft, answers: posting.questions.map((_, index) => stored.draft.answers?.[index] ?? "") });
      setView("form");
    }
  }, [draft, posting, postingId]);

  const startApplying = () => {
    if (!posting) return;
    setError(null);
    setDraft(application ? draftFromApplication(posting, application) : draft ?? emptyDraft(posting));
    setView("form");
  };

  const chooseFile = (next: File | null) => {
    if (next && next.size > ATTACHMENT_MAX_BYTES) { setError("Attachments can be up to 10 MB."); return; }
    setError(null);
    setFile(next);
    if (next) pendingFiles.set(postingId, next);
    else pendingFiles.delete(postingId);
  };

  const submit = React.useCallback(async (current: Draft) => {
    if (!posting || !user) return;
    const problem = problemWith(current, posting, file);
    if (problem) { setError(problem); setView("form"); return; }
    setSending(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const id = applicationId(posting.id, user.uid);
      let attachment = current.attachment;
      if (file) {
        const path = `applications/${user.uid}/${posting.id}-${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_").slice(-80)}`;
        const uploaded = await uploadBytes(ref(firebaseStorage, path), file, { contentType: file.type || "application/octet-stream" });
        if (current.attachment?.path) void deleteObject(ref(firebaseStorage, current.attachment.path)).catch(() => undefined);
        attachment = { name: file.name.slice(0, 160), url: await getDownloadURL(uploaded.ref), path };
      }
      const record: Omit<JobApplication, "id"> = {
        postingId: posting.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        coverIntro: current.coverIntro.trim().slice(0, 4000),
        answers: posting.questions.map((question, index) => ({ question, answer: (current.answers[index] ?? "").trim().slice(0, 1500) })),
        attachment,
        status: "submitted",
        jobSlug: null,
        createdAt: application?.createdAt ?? now,
        updatedAt: now,
      };
      await setDoc(doc(firebaseDb, JOB_APPLICATIONS_COLLECTION, id), record);
      if (!application) void notify({ event: "application.submitted", id });
      writeStoredDraft(posting.id, null);
      setApplication({ id, ...record });
      setDraft(null);
      setFile(null);
      pendingFiles.delete(posting.id);
      setJustSent(true);
      setView("posting");
    } catch (cause) {
      console.error("Unable to send application", cause);
      setError("Couldn't send your application. Please try again.");
      setView("form");
    } finally {
      setSending(false);
    }
  }, [application, file, posting, user]);

  // Back from sign-up: send the saved application.
  React.useEffect(() => {
    if (autoSent.current || authLoading || !user || !posting || !draft) return;
    if (!readStoredDraft(posting.id)?.send) return;
    autoSent.current = true;
    void submit(draft);
  }, [authLoading, draft, posting, submit, user]);

  const continueToSend = () => {
    if (!posting || !draft) return;
    const problem = problemWith(draft, posting, file);
    if (problem) { setError(problem); return; }
    setError(null);
    if (user) { void submit(draft); return; }
    writeStoredDraft(posting.id, { draft, send: true });
    setView("account");
  };

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current, [key]: value };
      if (posting) writeStoredDraft(posting.id, { draft: next, send: false });
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
          {justSent ? <p role="status" className="m-0 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">Application sent.</p> : null}
          {application ? <ApplicationStatusPanel application={application} onEdit={() => void startApplying()} /> : null}
          <PostingSummary posting={posting} />
          {!application && !isViewingAs ? closed
            ? <p className="m-0 text-sm text-muted-foreground">This job is no longer taking applications.</p>
            : <div className="sticky bottom-4 z-10 flex justify-end"><Button type="button" size="lg" onClick={() => void startApplying()}>Apply</Button></div> : null}
        </> : null}

        {view === "form" && draft ? <form onSubmit={(event) => { event.preventDefault(); continueToSend(); }} className="grid gap-8">
          <div>
            <button type="button" onClick={() => setView("posting")} className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Back to the job</button>
            <h1 className="mb-0 mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Apply: {posting.headline || "Open job"}</h1>
            <PostedDate posting={posting} />
          </div>

          <PostingTerms posting={posting} />

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
            <p className="m-0 mr-auto text-xs text-muted-foreground">{user ? null : "Next you'll create your account. Your answers are kept."}</p>
            <Button type="submit" size="lg" disabled={sending}>{sending ? "Sending…" : user ? application ? "Save changes" : "Send application" : "Continue"}</Button>
          </div>
        </form> : null}

        {view === "account" ? user ? <p className="text-sm text-muted-foreground">Sending your application…</p> : <section className="mx-auto w-full max-w-[440px]">
          <button type="button" onClick={() => setView("form")} className="mb-4 text-sm font-semibold text-muted-foreground hover:text-foreground">← Back to your application</button>
          <p className="mb-4 mt-0 text-sm text-muted-foreground">Last step: create your account to send your application. Already have one? Sign in.</p>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
            <LoginForm initialMode="signup" redirectTo={`/jobs/${encodeURIComponent(posting.id)}`} />
          </div>
        </section> : null}
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
