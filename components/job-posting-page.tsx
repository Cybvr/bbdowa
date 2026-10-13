"use client";

import * as React from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { LoginForm } from "@/components/login-form";
import { RichTextContent, richTextHasContent } from "@/components/rich-text-editor";
import { Badge } from "@/components/dashboard/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { firebaseDb } from "@/lib/firebase/client";
import { notify } from "@/lib/email/notify";
import { loadNdaState, type NdaState } from "@/lib/firebase/master-nda";
import type { PaymentCurrency } from "@/lib/payments";
import {
  APPLICATION_STATUS_LABELS,
  DURATION_OPTIONS,
  JOB_APPLICATIONS_COLLECTION,
  JOB_POSTINGS_COLLECTION,
  applicationId,
  normalizePosting,
  type ApplicationLink,
  type JobApplication,
  type JobPosting,
} from "@/lib/job-postings";

const FIELD = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40";
const LABEL = "block space-y-1.5 text-sm font-medium";
const HINT = "m-0 text-xs font-normal text-muted-foreground";

type Draft = {
  rateAmount: string;
  rateCurrency: PaymentCurrency;
  rateUnit: "hour" | "fixed";
  duration: string;
  coverIntro: string;
  coverApproach: string;
  coverNext: string;
  answers: string[];
  portfolio: ApplicationLink[];
  samples: ApplicationLink[];
  testimonialQuote: string;
  testimonialName: string;
  testimonialCompany: string;
};

const EMPTY_LINKS = (): ApplicationLink[] => [{ title: "", url: "" }, { title: "", url: "" }, { title: "", url: "" }];

function emptyDraft(posting: JobPosting): Draft {
  return {
    rateAmount: "",
    rateCurrency: "NGN",
    rateUnit: "fixed",
    duration: posting.duration && DURATION_OPTIONS.includes(posting.duration) ? posting.duration : "",
    coverIntro: "",
    coverApproach: "",
    coverNext: "Happy to jump on a call this week.",
    answers: posting.questions.map(() => ""),
    portfolio: EMPTY_LINKS(),
    samples: EMPTY_LINKS(),
    testimonialQuote: "",
    testimonialName: "",
    testimonialCompany: "",
  };
}

function draftFromApplication(posting: JobPosting, application: JobApplication): Draft {
  const pad = (links: ApplicationLink[]) => [...links, ...EMPTY_LINKS()].slice(0, 3);
  return {
    rateAmount: application.rateAmount == null ? "" : String(application.rateAmount),
    rateCurrency: application.rateCurrency,
    rateUnit: application.rateUnit,
    duration: application.duration,
    coverIntro: application.coverIntro,
    coverApproach: application.coverApproach,
    coverNext: application.coverNext,
    answers: posting.questions.map((question) => application.answers.find((item) => item.question === question)?.answer ?? ""),
    portfolio: pad(application.portfolio),
    samples: pad(application.samples),
    testimonialQuote: application.testimonial?.quote ?? "",
    testimonialName: application.testimonial?.name ?? "",
    testimonialCompany: application.testimonial?.company ?? "",
  };
}

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

function validUrl(value: string) {
  return /^https?:\/\/\S+\.\S+/i.test(value.trim());
}

function problemWith(draft: Draft, posting: JobPosting): string | null {
  const amount = Number(draft.rateAmount);
  if (!draft.rateAmount.trim() || !Number.isFinite(amount) || amount <= 0) return "Enter your rate.";
  if (!draft.duration) return "Pick how long you need.";
  if (!draft.coverIntro.trim()) return "Say who you are in the cover letter.";
  if (!draft.coverApproach.trim()) return "Say how you'd do the job in the cover letter.";
  if (posting.questions.some((_, index) => !draft.answers[index]?.trim())) return "Answer the client's questions.";
  const links = [...draft.portfolio, ...draft.samples].filter((link) => link.url.trim());
  if (!draft.portfolio.some((link) => link.url.trim())) return "Add at least one portfolio link.";
  if (links.some((link) => !validUrl(link.url))) return "Links must start with http:// or https://.";
  return null;
}

function cleanLinks(links: ApplicationLink[]): ApplicationLink[] {
  return links
    .map((link) => ({ title: link.title.trim().slice(0, 120), url: link.url.trim().slice(0, 500) }))
    .filter((link) => link.url);
}

function LinkRows({ label, hint, links, onChange }: { label: string; hint: string; links: ApplicationLink[]; onChange: (links: ApplicationLink[]) => void }) {
  return <fieldset className="space-y-2">
    <legend className="text-sm font-medium">{label}</legend>
    <p className={HINT}>{hint}</p>
    {links.map((link, index) => <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <input value={link.title} onChange={(event) => onChange(links.map((item, at) => at === index ? { ...item, title: event.target.value } : item))} placeholder="Project for client" aria-label={`${label} ${index + 1} title`} className={FIELD} />
      <input type="url" value={link.url} onChange={(event) => onChange(links.map((item, at) => at === index ? { ...item, url: event.target.value } : item))} placeholder="https://" aria-label={`${label} ${index + 1} link`} className={FIELD} />
    </div>)}
  </fieldset>;
}

function PostingSummary({ posting }: { posting: JobPosting }) {
  const facts = [["Budget", posting.budget], ["Duration", posting.duration], ["Work setup", posting.workSetup]].filter(([, value]) => value);
  return <article>
    <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{posting.clientLabel || "Confidential client"}</p>
    <h1 className="mb-0 mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{posting.headline || "Open job"}</h1>
    {facts.length ? <dl className="m-0 mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
      {facts.map(([label, value]) => <div key={label} className="flex gap-1.5"><dt className="text-muted-foreground">{label}</dt><dd className="m-0 font-medium">{value}</dd></div>)}
    </dl> : null}
    {richTextHasContent(posting.brief) ? <section className="mt-8 border-t border-border pt-6"><h2 className="m-0 text-base font-semibold">The brief</h2><RichTextContent value={posting.brief} className="mt-3 max-w-[70ch] text-body" /></section> : null}
    {posting.deliverables.length ? <section className="mt-8 border-t border-border pt-6"><h2 className="m-0 text-base font-semibold">Deliverables</h2><ul className="m-0 mt-3 grid gap-1.5 pl-5 text-[15px]">{posting.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
    {posting.skills.length ? <section className="mt-8 border-t border-border pt-6"><h2 className="m-0 text-base font-semibold">Skills</h2><ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">{posting.skills.map((skill) => <li key={skill}><Badge>{skill}</Badge></li>)}</ul></section> : null}
    <p className="mb-0 mt-8 border-t border-border pt-6 text-sm text-muted-foreground">The client&apos;s name and full brief are shared with shortlisted freelancers after they sign our NDA.</p>
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

  // Fill in rate and portfolio from the person's profile when they start fresh.
  const prefill = React.useCallback(async (base: Draft): Promise<Draft> => {
    if (!user) return base;
    const profile = (await getDoc(doc(firebaseDb, "users", user.uid)).catch(() => null))?.data() ?? {};
    const links = [profile.portfolio, profile.behance, profile.linkedin].filter((value): value is string => typeof value === "string" && validUrl(value));
    return {
      ...base,
      rateCurrency: profile.rateCurrency === "USD" ? "USD" : base.rateCurrency,
      portfolio: links.length ? [...links.map((url) => ({ title: "", url })), ...EMPTY_LINKS()].slice(0, 3) : base.portfolio,
    };
  }, [user]);

  const startApplying = async () => {
    if (!posting) return;
    setError(null);
    setDraft(application ? draftFromApplication(posting, application) : draft ?? await prefill(emptyDraft(posting)));
    setView("form");
  };

  const submit = React.useCallback(async (current: Draft) => {
    if (!posting || !user) return;
    const problem = problemWith(current, posting);
    if (problem) { setError(problem); setView("form"); return; }
    setSending(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const id = applicationId(posting.id, user.uid);
      const testimonial = current.testimonialQuote.trim()
        ? { quote: current.testimonialQuote.trim().slice(0, 600), name: current.testimonialName.trim().slice(0, 120), company: current.testimonialCompany.trim().slice(0, 120) }
        : null;
      const record: Omit<JobApplication, "id"> = {
        postingId: posting.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        rateAmount: Number(current.rateAmount),
        rateCurrency: current.rateCurrency,
        rateUnit: current.rateUnit,
        duration: current.duration,
        coverIntro: current.coverIntro.trim().slice(0, 1500),
        coverApproach: current.coverApproach.trim().slice(0, 1500),
        coverNext: current.coverNext.trim().slice(0, 600),
        answers: posting.questions.map((question, index) => ({ question, answer: (current.answers[index] ?? "").trim().slice(0, 1500) })),
        portfolio: cleanLinks(current.portfolio),
        samples: cleanLinks(current.samples),
        testimonial,
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
      setJustSent(true);
      setView("posting");
    } catch (cause) {
      console.error("Unable to send application", cause);
      setError("Couldn't send your application. Please try again.");
      setView("form");
    } finally {
      setSending(false);
    }
  }, [application, posting, user]);

  // Back from sign-up: send the saved application.
  React.useEffect(() => {
    if (autoSent.current || authLoading || !user || !posting || !draft) return;
    if (!readStoredDraft(posting.id)?.send) return;
    autoSent.current = true;
    void submit(draft);
  }, [authLoading, draft, posting, submit, user]);

  const continueToSend = () => {
    if (!posting || !draft) return;
    const problem = problemWith(draft, posting);
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
        <img src="/bbdo-west-africa.png" alt="BBDO West Africa" className="h-7 w-auto object-contain dark:invert" />
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
            <p className="mb-0 mt-2 text-sm text-muted-foreground">Keep it short. Clients read many of these.</p>
          </div>

          <section className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <h2 className="m-0 text-base font-semibold sm:col-span-2">Rate and time</h2>
            <fieldset className="space-y-1.5 sm:col-span-2">
              <legend className="text-sm font-medium">How do you charge?</legend>
              <div className="flex gap-4 text-sm">
                {(["fixed", "hour"] as const).map((unit) => <label key={unit} className="flex items-center gap-2"><input type="radio" name="rateUnit" checked={draft.rateUnit === unit} onChange={() => update("rateUnit", unit)} className="h-4 w-4 accent-[var(--primary)]" />{unit === "fixed" ? "Fixed price" : "Hourly"}</label>)}
              </div>
            </fieldset>
            <label className={LABEL}>{draft.rateUnit === "fixed" ? "Price for the job" : "Hourly rate"}
              <div className="flex gap-2">
                <select value={draft.rateCurrency} onChange={(event) => update("rateCurrency", event.target.value as PaymentCurrency)} aria-label="Currency" className={`${FIELD} w-24`}><option value="NGN">NGN</option><option value="USD">USD</option></select>
                <input inputMode="decimal" value={draft.rateAmount} onChange={(event) => update("rateAmount", event.target.value.replace(/[^\d.]/g, ""))} placeholder="0" className={FIELD} />
              </div>
            </label>
            <label className={LABEL}>How long you need
              <select value={draft.duration} onChange={(event) => update("duration", event.target.value)} className={FIELD}>
                <option value="">Pick one</option>
                {DURATION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </section>

          <section className="grid gap-4 border-t border-border pt-6">
            <h2 className="m-0 text-base font-semibold">Cover letter</h2>
            <label className={LABEL}>Who you are
              <textarea value={draft.coverIntro} onChange={(event) => update("coverIntro", event.target.value)} rows={3} className={`${FIELD} resize-y`} placeholder="I'm a [role] with [X] years doing [type of work] for brands like [Client 1] and [Client 2]." />
            </label>
            <label className={LABEL}>Their problem and how you&apos;d solve it
              <textarea value={draft.coverApproach} onChange={(event) => update("coverApproach", event.target.value)} rows={4} className={`${FIELD} resize-y`} placeholder="You need [their problem in one line]. I'd [your approach], and deliver [deliverables] by [timeline]." />
            </label>
            <label className={LABEL}>Next step
              <input value={draft.coverNext} onChange={(event) => update("coverNext", event.target.value)} className={FIELD} />
            </label>
          </section>

          {posting.questions.length ? <section className="grid gap-4 border-t border-border pt-6">
            <h2 className="m-0 text-base font-semibold">The client&apos;s questions</h2>
            {posting.questions.map((question, index) => <label key={question} className={LABEL}>{question}
              <textarea value={draft.answers[index] ?? ""} onChange={(event) => update("answers", draft.answers.map((answer, at) => at === index ? event.target.value : answer))} rows={3} className={`${FIELD} resize-y`} />
            </label>)}
          </section> : null}

          <section className="grid gap-6 border-t border-border pt-6">
            <h2 className="m-0 text-base font-semibold">Your work</h2>
            <LinkRows label="Portfolio" hint="Up to 3 projects. At least one." links={draft.portfolio} onChange={(links) => update("portfolio", links)} />
            <LinkRows label="Samples" hint="Optional. Up to 3 links to the work closest to this job." links={draft.samples} onChange={(links) => update("samples", links)} />
          </section>

          <section className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <h2 className="m-0 text-base font-semibold sm:col-span-2">Testimonial <span className="font-normal text-muted-foreground">(optional)</span></h2>
            <label className={`${LABEL} sm:col-span-2`}>Quote<textarea value={draft.testimonialQuote} onChange={(event) => update("testimonialQuote", event.target.value)} rows={2} className={`${FIELD} resize-y`} /></label>
            <label className={LABEL}>Name<input value={draft.testimonialName} onChange={(event) => update("testimonialName", event.target.value)} className={FIELD} /></label>
            <label className={LABEL}>Company<input value={draft.testimonialCompany} onChange={(event) => update("testimonialCompany", event.target.value)} className={FIELD} /></label>
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
    </div>
  </main>;
}
