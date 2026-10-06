"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ClipboardList, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { usePortalClient } from "@/components/portal-shell";
import { RichTextContent, RichTextEditor, richTextHasContent } from "@/components/rich-text-editor";
import { TagInput } from "@/components/tag-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { longDate } from "@/lib/format";
import { EMPTY_BRIEF, NJERI_DRAFT_KEY, createClientJob, type JobBrief } from "@/lib/portal-jobs";

const FIELD = "block space-y-1.5 text-sm font-medium";
const INPUT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/40";
const SETUP_LABELS: Record<string, string> = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" };

type Change = <K extends keyof JobBrief>(key: K, value: JobBrief[K]) => void;

/** The brief fields, grouped so the steps and the editor share them. */
export function BasicsFields({ brief, change }: { brief: JobBrief; change: Change }) {
  return (
    <div className="grid gap-4">
      <label className={FIELD}>Job title<input value={brief.title} onChange={(event) => change("title", event.target.value)} className={INPUT} placeholder="e.g. Social media content for our October launch" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={FIELD}>Category<input value={brief.category} onChange={(event) => change("category", event.target.value)} className={INPUT} placeholder="e.g. Social media" /></label>
        <label className={FIELD}>Work setup
          <select value={brief.workSetup} onChange={(event) => change("workSetup", event.target.value)} className={INPUT}>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export function DetailsFields({ brief, change }: { brief: JobBrief; change: Change }) {
  return (
    <div className="grid gap-4">
      <RichTextEditor label="Description" value={brief.summary} onChange={(value) => change("summary", value)} placeholder="What do you need, who is it for, and what does success look like?" compact />
      <TagInput label="Tags" value={brief.tags} onChange={(value) => change("tags", value)} placeholder="e.g. TikTok, then press Enter" />
    </div>
  );
}

export function TimingFields({ brief, change }: { brief: JobBrief; change: Change }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={FIELD}>Start date<input type="date" value={brief.startDate} onChange={(event) => change("startDate", event.target.value)} className={INPUT} /></label>
      <label className={FIELD}>End date<input type="date" value={brief.endDate} onChange={(event) => change("endDate", event.target.value)} className={INPUT} /></label>
      <label className={FIELD}>Estimated length<input value={brief.estimatedLength} onChange={(event) => change("estimatedLength", event.target.value)} className={INPUT} placeholder="e.g. 4 weeks" /></label>
      <label className={FIELD}>Budget<input value={brief.budget} onChange={(event) => change("budget", event.target.value)} className={INPUT} placeholder="e.g. NGN 2,000,000" /></label>
    </div>
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

/** Read-only view of a brief: used for Review and for Preview on the job page. */
export function BriefPreview({ brief }: { brief: JobBrief }) {
  return (
    <div className="grid gap-3">
      <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
        <h2 className="m-0 text-item-title font-semibold">About the job</h2>
        {richTextHasContent(brief.summary) ? <RichTextContent value={brief.summary} className="mt-3 text-body text-muted-foreground" /> : <p className="mb-0 mt-3 text-body text-muted-foreground">No description yet.</p>}
      </section>
      <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
        <h2 className="m-0 text-item-title font-semibold">Details</h2>
        <dl className="m-0 mt-3">
          <Row label="Category">{brief.category || "—"}</Row>
          <Row label="Work setup">{SETUP_LABELS[brief.workSetup] ?? (brief.workSetup || "—")}</Row>
          <Row label="Start">{brief.startDate ? longDate(brief.startDate) : "—"}</Row>
          <Row label="End">{brief.endDate ? longDate(brief.endDate) : "—"}</Row>
          <Row label="Est. length">{brief.estimatedLength || "—"}</Row>
          <Row label="Budget">{brief.budget || "—"}</Row>
        </dl>
      </section>
      {brief.tags.length ? (
        <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
          <h2 className="m-0 text-item-title font-semibold">Tags</h2>
          <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">{brief.tags.map((tag) => <li key={tag} className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{tag}</li>)}</ul>
        </section>
      ) : null}
    </div>
  );
}

/** "Post a job" asks how they want to do it: with Njeri, or step by step. */
export function PostJobButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90 ${className}`}>
        <Plus aria-hidden="true" className="h-4 w-4" />Post a job
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post a job</DialogTitle>
            <DialogDescription>How would you like to start?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/portal/njeri?start=job" onClick={() => setOpen(false)} className="rounded-xl border border-border p-4 text-foreground no-underline transition hover:border-primary">
              <Sparkles aria-hidden="true" className="h-5 w-5 text-primary" />
              <p className="m-0 mt-2 font-semibold">Create with Njeri</p>
              <p className="m-0 mt-1 text-sm text-muted-foreground">Tell Njeri what you need and it writes the brief with you.</p>
            </Link>
            <Link href="/portal/jobs/new" onClick={() => setOpen(false)} className="rounded-xl border border-border p-4 text-foreground no-underline transition hover:border-primary">
              <ClipboardList aria-hidden="true" className="h-5 w-5 text-primary" />
              <p className="m-0 mt-2 font-semibold">Fill in the steps</p>
              <p className="m-0 mt-1 text-sm text-muted-foreground">Answer a few short steps yourself.</p>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const STEPS = ["Basics", "Details", "Timing and budget", "Review"] as const;

/** Step-by-step post-a-job. Opens pre-filled when Njeri hands over a draft. */
export function PostJobSteps() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const portal = usePortalClient();
  const [brief, setBrief] = React.useState<JobBrief>(EMPTY_BRIEF);
  const [step, setStep] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (searchParams.get("from") !== "njeri") return;
    try {
      const raw = window.sessionStorage.getItem(NJERI_DRAFT_KEY);
      if (raw) setBrief({ ...EMPTY_BRIEF, ...JSON.parse(raw) });
      window.sessionStorage.removeItem(NJERI_DRAFT_KEY);
    } catch {
      // Start empty if the draft can't be read.
    }
  }, [searchParams]);

  const change: Change = (key, value) => setBrief((current) => ({ ...current, [key]: value }));

  const next = () => {
    if (step === 0 && !brief.title.trim()) return setError("Give the job a title.");
    if (step === 2 && brief.startDate && brief.endDate && brief.endDate < brief.startDate) return setError("The end date must be after the start date.");
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const post = async () => {
    if (!portal || !user || busy) return;
    if (!brief.title.trim()) { setStep(0); return setError("Give the job a title."); }
    setBusy(true);
    setError(null);
    try {
      const slug = await createClientJob(brief, { slug: portal.clientId, name: portal.client?.name ?? portal.clientId }, { uid: user.uid, name: user.name ?? user.email ?? null });
      router.push(`/portal/jobs/${encodeURIComponent(slug)}`);
    } catch (cause) {
      console.error("Unable to post job", cause);
      setError("Couldn’t post the job. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="grid max-w-3xl gap-4">
      <Link href="/portal/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Jobs</Link>
      <h1 className="m-0 text-page-title font-bold sm:text-page-title-lg">Post a job</h1>
      <ol className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 border-b border-border p-0 pb-3" aria-label="Steps">
        {STEPS.map((label, index) => (
          <li key={label} className={`text-sm ${index === step ? "font-semibold text-foreground" : index < step ? "text-foreground" : "text-muted-foreground"}`}>
            <span className={`mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full text-[11px] ${index <= step ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{index + 1}</span>{label}
          </li>
        ))}
      </ol>
      {step === 0 ? <BasicsFields brief={brief} change={change} /> : null}
      {step === 1 ? <DetailsFields brief={brief} change={change} /> : null}
      {step === 2 ? <TimingFields brief={brief} change={change} /> : null}
      {step === 3 ? <><p className="m-0 text-item-title font-semibold">{brief.title}</p><BriefPreview brief={brief} /></> : null}
      {error ? <p role="alert" className="m-0 text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-between gap-3 border-t border-border pt-4">
        {step > 0 ? <button type="button" onClick={() => { setError(null); setStep(step - 1); }} className="h-10 rounded-md border border-border px-4 text-sm font-semibold hover:border-foreground">Back</button> : <span />}
        {step < STEPS.length - 1
          ? <button type="button" onClick={next} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Continue</button>
          : <button type="button" onClick={() => void post()} disabled={busy} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Posting…" : "Post job"}</button>}
      </div>
    </div>
  );
}
