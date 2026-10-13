"use client";

import * as React from "react";
import Link from "next/link";
import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { Copy, ExternalLink } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/dashboard/ui";
import { ClientWorkspaceHeading } from "@/components/client-workspace-heading";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { useFirestoreDocuments, useFirestoreUsers } from "@/lib/firebase/client-content";
import { getMasterNdaId, loadNdaState, sendMasterNda, setMasterNdaId, type NdaState } from "@/lib/firebase/master-nda";
import { EMPTY_JOB_TERMS, JOB_TERMS_COLLECTION, type JobTerms } from "@/lib/job-terms";
import { sendAppEmail } from "@/lib/app-email";
import { notify } from "@/lib/email/notify";
import { formatAmount } from "@/lib/payments";
import { jobTeamKey } from "@/lib/users";
import type { Job } from "@/lib/jobs";
import {
  APPLICATION_STATUS_LABELS,
  DURATION_OPTIONS,
  JOB_APPLICATIONS_COLLECTION,
  JOB_POSTINGS_COLLECTION,
  JOB_POSTING_LINKS_COLLECTION,
  newPostingId,
  normalizePosting,
  postingHref,
  type ApplicationStatus,
  type JobApplication,
  type JobPosting,
} from "@/lib/job-postings";

const FIELD = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40";
const LABEL = "block space-y-1.5 text-sm font-medium";

/** The job's estimated length mapped onto the posting's duration options. */
function durationFromJob(job: Job): string {
  const length = job.estimatedLength ?? "";
  if (/6\+/.test(length)) return "6+ months";
  if (/3-6/.test(length)) return "3 to 6 months";
  if (/1-3 Months/i.test(length)) return "1 to 3 months";
  return length ? "Less than 1 month" : "";
}

function postingFromJob(job: Job, id: string, uid: string): JobPosting {
  const now = new Date().toISOString();
  return {
    id,
    status: "closed",
    headline: "",
    clientLabel: "",
    brief: job.summary ?? "",
    deliverables: [],
    budget: job.fee && job.fee !== "To be confirmed" ? job.fee : "",
    duration: durationFromJob(job),
    workSetup: job.workSetup ? job.workSetup[0].toUpperCase() + job.workSetup.slice(1) : "",
    skills: job.requiredSkills ?? [],
    questions: [],
    createdBy: uid,
    createdAt: now,
    updatedAt: now,
  };
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
}

function PostingEditor({ posting, onSaved }: { posting: JobPosting; onSaved: (posting: JobPosting) => void }) {
  const [fields, setFields] = React.useState(posting);
  const [questions, setQuestions] = React.useState(() => [...posting.questions, "", "", ""].slice(0, 3));
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const update = <K extends keyof JobPosting>(key: K, value: JobPosting[K]) => { setFields((current) => ({ ...current, [key]: value })); setMessage(null); };
  const shareUrl = typeof window === "undefined" ? postingHref(posting.id) : `${window.location.origin}${postingHref(posting.id)}`;

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (fields.status === "open" && !fields.headline.trim()) { setError("Add a headline before opening the posting."); return; }
    setSaving(true);
    setError(null);
    try {
      const next: JobPosting = {
        ...fields,
        headline: fields.headline.trim(),
        clientLabel: fields.clientLabel.trim(),
        budget: fields.budget.trim(),
        workSetup: fields.workSetup.trim(),
        questions: questions.map((question) => question.trim()).filter(Boolean),
        updatedAt: new Date().toISOString(),
      };
      const { id, ...record } = next;
      await setDoc(doc(firebaseDb, JOB_POSTINGS_COLLECTION, id), record);
      onSaved(next);
      setMessage("Posting saved.");
    } catch (cause) {
      console.error("Unable to save posting", cause);
      setError("Couldn't save the posting.");
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={save} className="mt-4 grid gap-5 rounded-xl border border-border bg-background p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h3 className="m-0 text-item-title font-semibold">Share link</h3>
        <p className="m-0 mt-1 truncate text-xs text-muted-foreground">{shareUrl}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => void copyText(shareUrl).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); })}><Copy aria-hidden="true" className="h-3.5 w-3.5" />{copied ? "Copied" : "Copy link"}</Button>
        <a href={postingHref(posting.id)} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-1.5 rounded-md border border-border px-4 text-[14px] font-medium hover:border-foreground sm:h-9 sm:px-3 sm:text-[13px]"><ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />Preview</a>
      </div>
    </div>
    <p className="m-0 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">Anyone with the link can read this. Don&apos;t name the client or brand. They see that after signing the NDA.</p>

    <div className="grid gap-4 sm:grid-cols-2">
      <label className={`${LABEL} sm:col-span-2`}>Headline<input value={fields.headline} onChange={(event) => update("headline", event.target.value)} placeholder="e.g. Launch film for a drinks brand" className={FIELD} /></label>
      <label className={LABEL}>Client described as<input value={fields.clientLabel} onChange={(event) => update("clientLabel", event.target.value)} placeholder="e.g. Global drinks brand" className={FIELD} /></label>
      <label className={LABEL}>Status<select value={fields.status} onChange={(event) => update("status", event.target.value as JobPosting["status"])} className={FIELD}><option value="open">Open: taking applications</option><option value="closed">Closed</option></select></label>
      <label className={LABEL}>Budget<input value={fields.budget} onChange={(event) => update("budget", event.target.value)} placeholder="e.g. ₦500,000 to ₦800,000" className={FIELD} /></label>
      <label className={LABEL}>Duration<select value={fields.duration} onChange={(event) => update("duration", event.target.value)} className={FIELD}><option value="">Not set</option>{DURATION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      <label className={LABEL}>Work setup<select value={fields.workSetup} onChange={(event) => update("workSetup", event.target.value)} className={FIELD}><option value="">Not set</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option><option value="Onsite">On-site</option></select></label>
    </div>
    <RichTextEditor label="Brief" value={fields.brief} onChange={(value) => update("brief", value)} placeholder="The client's problem and what you need. No brand names." />
    <TagInput label="Deliverables" value={fields.deliverables} onChange={(value) => update("deliverables", value)} placeholder="e.g. 3 x 15s cutdowns, then press Enter" />
    <TagInput label="Skills" value={fields.skills} onChange={(value) => update("skills", value)} placeholder="e.g. Motion design, then press Enter" />
    <fieldset className="grid gap-2">
      <legend className="mb-1.5 text-sm font-medium">Screening questions <span className="font-normal text-muted-foreground">(up to 3)</span></legend>
      {questions.map((question, index) => <input key={index} value={question} onChange={(event) => { setQuestions((current) => current.map((item, at) => at === index ? event.target.value : item)); setMessage(null); }} placeholder={index === 0 ? "e.g. Have you shot for a drinks brand before?" : "Optional"} aria-label={`Question ${index + 1}`} className={FIELD} />)}
    </fieldset>
    {error ? <p role="alert" className="m-0 text-sm text-destructive">{error}</p> : null}
    <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
      {message ? <span role="status" className="text-sm text-muted-foreground">{message}</span> : null}
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save posting"}</Button>
    </div>
  </form>;
}

function MasterNdaPicker({ masterId, onChange }: { masterId: string | null; onChange: (id: string | null) => void }) {
  const { role } = useAuth();
  const { documents } = useFirestoreDocuments();
  const [saving, setSaving] = React.useState(false);
  const templates = documents.filter((document) => document.status === "draft" || document.id === masterId);
  const current = documents.find((document) => document.id === masterId);
  if (role !== "admin") return <p className="m-0 text-sm text-muted-foreground">Master NDA: {current?.title ?? (masterId ? "Set" : "Not set. Ask an admin to pick one.")}</p>;
  return <label className="flex flex-wrap items-center gap-2 text-sm font-medium">Master NDA
    <select value={masterId ?? ""} disabled={saving} onChange={(event) => {
      const next = event.target.value || null;
      setSaving(true);
      void setMasterNdaId(next).then(() => onChange(next)).catch((cause) => console.error("Unable to set master NDA", cause)).finally(() => setSaving(false));
    }} className={`${FIELD} w-auto min-w-56`}>
      <option value="">Not set</option>
      {templates.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
    </select>
    <span className="font-normal text-xs text-muted-foreground">A draft in Documents. Each freelancer signs it once.</span>
  </label>;
}

function ApplicationRow({ application, masterId, busy, onAction }: { application: JobApplication; masterId: string | null; busy: boolean; onAction: (application: JobApplication, status: ApplicationStatus) => void }) {
  const [open, setOpen] = React.useState(false);
  const [nda, setNda] = React.useState<NdaState | null>(null);
  React.useEffect(() => {
    let active = true;
    loadNdaState(application.uid, masterId).then((state) => { if (active) setNda(state); }).catch(() => { if (active) setNda(null); });
    return () => { active = false; };
  }, [application.uid, application.status, masterId]);
  const ndaReady = !masterId || nda?.status === "signed";
  const rate = application.rateAmount != null ? `${formatAmount(application.rateAmount, application.rateCurrency)}${application.rateUnit === "hour" ? " / hour" : " fixed"}` : "—";
  const ndaLabel = !masterId ? null : nda?.status === "signed" ? "NDA signed" : nda?.status === "pending" ? "NDA sent" : "No NDA";

  return <li className="py-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="min-w-0 text-left">
        <span className="block font-semibold">{application.name || application.email || "Applicant"}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{rate} · {application.duration || "—"}{ndaLabel ? ` · ${ndaLabel}` : ""}</span>
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={application.status === "declined" ? "neutral" : application.status === "hired" ? "inverse" : "active"}>{APPLICATION_STATUS_LABELS[application.status]}</Badge>
        {application.status === "submitted" || application.status === "declined" ? <Button type="button" size="sm" disabled={busy} onClick={() => onAction(application, "shortlisted")}>Shortlist</Button> : null}
        {application.status === "shortlisted" ? <Button type="button" size="sm" disabled={busy || !ndaReady} title={ndaReady ? undefined : "They need to sign the NDA first"} onClick={() => onAction(application, "hired")}>Hire</Button> : null}
        {application.status === "submitted" || application.status === "shortlisted" ? <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onAction(application, "declined")}>Decline</Button> : null}
      </div>
    </div>
    {open ? <div className="mt-3 grid gap-4 rounded-lg bg-muted/40 p-4 text-sm">
      <section><h4 className="m-0 font-semibold">Cover letter</h4>{[application.coverIntro, application.coverApproach, application.coverNext].filter(Boolean).map((part, index) => <p key={index} className="mb-0 mt-2 whitespace-pre-line">{part}</p>)}</section>
      {application.answers.length ? <section><h4 className="m-0 font-semibold">Screening answers</h4>{application.answers.map((item) => <div key={item.question} className="mt-2"><p className="m-0 text-muted-foreground">{item.question}</p><p className="m-0 mt-1 whitespace-pre-line">{item.answer}</p></div>)}</section> : null}
      {[["Portfolio", application.portfolio], ["Samples", application.samples]].map(([label, links]) => (links as JobApplication["portfolio"]).length ? <section key={label as string}><h4 className="m-0 font-semibold">{label as string}</h4><ul className="m-0 mt-2 grid gap-1 pl-5">{(links as JobApplication["portfolio"]).map((link) => <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-primary">{link.title || link.url}</a></li>)}</ul></section> : null)}
      {application.testimonial ? <section><h4 className="m-0 font-semibold">Testimonial</h4><p className="mb-0 mt-2">&ldquo;{application.testimonial.quote}&rdquo; – {[application.testimonial.name, application.testimonial.company].filter(Boolean).join(", ")}</p></section> : null}
      <p className="m-0 text-xs text-muted-foreground">{application.email ?? ""}{nda?.documentId ? <> · <Link href={`/admin/documents/${encodeURIComponent(nda.documentId)}`} className="underline underline-offset-4">View NDA</Link></> : null}</p>
    </div> : null}
  </li>;
}

/** Admin job tab: the brandless share posting, master NDA and the people who applied. */
export function JobApplicantsPanel({ job, onTeamChanged }: { job: Job; onTeamChanged?: () => void }) {
  const { user, actualUser } = useAuth();
  const { users } = useFirestoreUsers();
  const [posting, setPosting] = React.useState<JobPosting | null>(null);
  const [applications, setApplications] = React.useState<JobApplication[]>([]);
  const [masterId, setMasterId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const staff = actualUser ?? user;

  const load = React.useCallback(async () => {
    const [link, master] = await Promise.all([getDoc(doc(firebaseDb, JOB_POSTING_LINKS_COLLECTION, job.slug)), getMasterNdaId()]);
    setMasterId(master);
    const postingId = link.data()?.postingId;
    if (typeof postingId !== "string") { setPosting(null); setApplications([]); return; }
    const [postingSnapshot, applicationSnapshot] = await Promise.all([
      getDoc(doc(firebaseDb, JOB_POSTINGS_COLLECTION, postingId)),
      getDocs(query(collection(firebaseDb, JOB_APPLICATIONS_COLLECTION), where("postingId", "==", postingId))),
    ]);
    setPosting(postingSnapshot.exists() ? normalizePosting(postingSnapshot.id, postingSnapshot.data()) : null);
    setApplications(applicationSnapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<JobApplication, "id">) })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, [job.slug]);

  React.useEffect(() => {
    void load().catch((cause) => { console.error("Unable to load applicants", cause); setError("Couldn't load the posting."); }).finally(() => setLoading(false));
  }, [load]);

  const createPosting = async () => {
    if (!staff) return;
    setError(null);
    try {
      const id = newPostingId();
      const draft = postingFromJob(job, id, staff.uid);
      const { id: _id, ...record } = draft;
      await setDoc(doc(firebaseDb, JOB_POSTINGS_COLLECTION, id), record);
      await setDoc(doc(firebaseDb, JOB_POSTING_LINKS_COLLECTION, job.slug), { postingId: id, jobSlug: job.slug, createdAt: draft.createdAt });
      setPosting(draft);
    } catch (cause) {
      console.error("Unable to create posting", cause);
      setError("Couldn't create the posting.");
    }
  };

  /** Hiring puts the person on the job's team, the same as the Team tab. */
  const addToTeam = async (uid: string) => {
    const person = users.find((candidate) => candidate.uid === uid);
    const key = person ? jobTeamKey(person) : `uid:${uid}`;
    const termsRef = doc(firebaseDb, JOB_TERMS_COLLECTION, job.slug);
    const terms = await getDoc(termsRef);
    if (terms.exists()) await updateDoc(termsRef, { teamUids: arrayUnion(uid), updatedAt: new Date().toISOString() });
    else await setDoc(termsRef, { ...EMPTY_JOB_TERMS, teamUids: [uid], updatedAt: new Date().toISOString() } satisfies JobTerms);
    if (key && !(job.creatorSlugs ?? []).includes(key)) await updateDoc(doc(firebaseDb, await jobsCollection(), job.slug), { creatorSlugs: arrayUnion(key) });
    void sendAppEmail({ type: "job", jobSlug: job.slug, uids: [uid] });
    void notify({ event: "job.assigned", id: job.slug, uids: [uid] });
  };

  const act = async (application: JobApplication, status: ApplicationStatus) => {
    if (!staff || busyId) return;
    setBusyId(application.id);
    setError(null);
    try {
      if (status === "shortlisted" && masterId) {
        await sendMasterNda(masterId, { uid: application.uid, name: application.name }, { uid: staff.uid, name: staff.name ?? staff.email });
      }
      if (status === "hired") await addToTeam(application.uid);
      const jobSlug = status === "declined" ? application.jobSlug : job.slug;
      await updateDoc(doc(firebaseDb, JOB_APPLICATIONS_COLLECTION, application.id), { status, jobSlug, updatedAt: new Date().toISOString() });
      setApplications((current) => current.map((item) => item.id === application.id ? { ...item, status, jobSlug } : item));
      if (status === "hired") onTeamChanged?.();
    } catch (cause) {
      console.error("Unable to update application", cause);
      setError(cause instanceof Error && cause.message.includes("master NDA") ? cause.message : "Couldn't update this application.");
    } finally {
      setBusyId(null);
    }
  };

  return <section className="pt-6">
    <ClientWorkspaceHeading title="Applicants" actions={!loading && !posting ? <Button type="button" onClick={() => void createPosting()}>Create share link</Button> : null} />
    <div className="mt-4"><MasterNdaPicker masterId={masterId} onChange={setMasterId} /></div>
    {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}
    {loading ? <p className="py-10 text-sm text-muted-foreground">Loading…</p> : !posting ? <p className="py-10 text-sm text-muted-foreground">No share link yet. Create one to post this job without the brand and take applications.</p> : <>
      <PostingEditor key={posting.id} posting={posting} onSaved={setPosting} />
      <h3 className="mb-0 mt-8 text-item-title font-semibold">{applications.length} {applications.length === 1 ? "application" : "applications"}</h3>
      {applications.length ? <ul className="m-0 mt-2 list-none divide-y divide-border border-y border-border p-0">
        {applications.map((application) => <ApplicationRow key={application.id} application={application} masterId={masterId} busy={busyId === application.id} onAction={(item, status) => void act(item, status)} />)}
      </ul> : <p className="mt-2 text-sm text-muted-foreground">No one has applied yet.</p>}
    </>}
  </section>;
}
