"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TagInput } from "@/components/tag-input";
import { firebaseDb } from "@/lib/firebase/client";
import { useClientOptions, useFirestoreUsers } from "@/lib/firebase/client-content";
import { EMPTY_JOB_TERMS, JOB_TERMS_COLLECTION, jobAssignees, type JobTerms } from "@/lib/job-terms";
import { jobTeamKey } from "@/lib/users";
import { sendAppEmail } from "@/lib/app-email";
import { notify } from "@/lib/email/notify";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { JOB_STATUS_LABELS, jobPostedDate, type Job } from "@/lib/jobs";
import { longDate } from "@/lib/format";

const FIELD = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40";
const parseList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const ESTIMATED_LENGTHS = ["1-3 Days", "1 Week", "1-3 Months", "3-6 Months", "6+ Months"];
const LANGUAGE_OPTIONS = ["English", "French", "English, French"];

/** The same job overview editor in Admin Jobs and the client portal. */
export function JobOverviewEditor({ job, scope = "staff" }: { job: Job; scope?: "staff" | "client" }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(job.title ?? job.name);
  const [campaignTitle, setCampaignTitle] = React.useState(job.campaignTitle ?? job.title ?? job.name ?? "");
  const [clientId, setClientId] = React.useState(job.clientId ?? "");
  const clientOptions = useClientOptions({ clientId: job.clientId, clientName: job.clientName });
  const [category, setCategory] = React.useState(job.category ?? "");
  const [status, setStatus] = React.useState(job.status);
  const [description, setDescription] = React.useState(job.summary ?? "");
  const [workSetup, setWorkSetup] = React.useState(job.workSetup ?? "remote");
  const [estimatedLength, setEstimatedLength] = React.useState(job.estimatedLength ?? "");
  const [languages, setLanguages] = React.useState((job.languages ?? []).join(", "));
  const [desiredStartDate, setDesiredStartDate] = React.useState(job.desiredStartDate ?? "");
  const [requiredSkills, setRequiredSkills] = React.useState<string[]>(job.requiredSkills ?? []);
  const [startDate, setStartDate] = React.useState(job.startDate ?? "");
  const [endDate, setEndDate] = React.useState(job.endDate ?? "");
  const [fee, setFee] = React.useState(job.fee === "To be confirmed" ? "" : job.fee ?? "");
  const { users } = useFirestoreUsers();
  const [leadUserId, setLeadUserId] = React.useState(job.leadUserId ?? "");
  // Assignment is private, so it lives in jobTerms and loads separately.
  const [terms, setTerms] = React.useState<JobTerms | null>(null);
  const [assignedUids, setAssignedUids] = React.useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = React.useState("");
  React.useEffect(() => {
    if (scope !== "staff") return;
    let active = true;
    getDoc(doc(firebaseDb, JOB_TERMS_COLLECTION, job.slug))
      .then((snapshot) => {
        if (!active) return;
        const loaded = snapshot.exists() ? { ...EMPTY_JOB_TERMS, ...(snapshot.data() as Partial<JobTerms>) } : EMPTY_JOB_TERMS;
        setTerms(loaded);
        setAssignedUids(jobAssignees(loaded).map((person) => person.uid));
      })
      .catch((cause) => console.error("Unable to load job assignment", cause));
    return () => { active = false; };
  }, [job.slug, scope]);
  const people = React.useMemo(() => {
    const known = users
      .map((person) => ({ key: jobTeamKey(person) ?? "", uid: person.uid ?? null, name: person.name || person.email || "Unnamed" }))
      .filter((person) => person.key);
    const missing = (terms ? jobAssignees(terms) : []).filter((person) => !known.some((option) => option.uid === person.uid)).map((person) => ({ key: `uid:${person.uid}`, uid: person.uid, name: person.name }));
    return [...known, ...missing].sort((a, b) => a.name.localeCompare(b.name));
  }, [terms, users]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (startDate && endDate && endDate < startDate) {
      setError("The end date must be after the start date.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateDoc(doc(firebaseDb, await jobsCollection(), job.slug), {
        title: title.trim() || job.name,
        campaignTitle: campaignTitle.trim() || title.trim() || job.name,
        ...(scope === "staff" ? {
          clientId,
          clientName: clientOptions.find((option) => option.value === clientId)?.label ?? job.clientName,
          status,
          leadUserId: leadUserId || null,
        } : {}),
        category: category.trim(),
        summary: description.trim(),
        workSetup: workSetup || null,
        estimatedLength: estimatedLength.trim() || null,
        languages: parseList(languages),
        desiredStartDate: desiredStartDate || null,
        requiredSkills,
        startDate: startDate || null,
        endDate: endDate || null,
        fee: fee.trim(),
        updatedAt: serverTimestamp(),
      });
      if (scope === "staff" && terms) {
        const assignees = assignedUids.map((uid) => ({ uid, name: people.find((person) => person.uid === uid)?.name ?? "Assignee" }));
        // Assignees are always on the team, so they keep access alongside everyone else on it.
        const teamUids = [...new Set([...(terms.teamUids ?? []), ...assignedUids])];
        const missingSlugs = assignedUids
          .map((uid) => people.find((person) => person.uid === uid)?.key)
          .filter((key): key is string => Boolean(key) && !(job.creatorSlugs ?? []).includes(key!));
        if (missingSlugs.length) {
          await updateDoc(doc(firebaseDb, await jobsCollection(), job.slug), { creatorSlugs: [...(job.creatorSlugs ?? []), ...missingSlugs] });
        }
        await setDoc(doc(firebaseDb, JOB_TERMS_COLLECTION, job.slug), {
          teamUids,
          assignedTo: assignees[0]?.uid ?? null,
          assignedToName: assignees[0]?.name ?? null,
          assignees,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        const before = new Set([terms.assignedTo, ...(terms.teamUids ?? [])].filter(Boolean));
        const added = teamUids.filter((uid) => !before.has(uid));
        if (added.length) {
          void sendAppEmail({ type: "job", jobSlug: job.slug, uids: added });
          void notify({ event: "job.assigned", id: job.slug, uids: added });
        }
        setTerms({ ...terms, teamUids, assignedTo: assignees[0]?.uid ?? null, assignedToName: assignees[0]?.name ?? null, assignees });
      }
      setSaved(true);
      router.refresh();
    } catch (cause) {
      console.error("Unable to save job overview", cause);
      setError("Couldn’t save the job overview.");
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={save} onChangeCapture={() => setSaved(false)} className="space-y-6 pt-6">
    {error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <div className="min-w-0">
        <label className="mb-6 block space-y-1.5 text-sm font-medium">Job title<input value={title} onChange={(event) => setTitle(event.target.value)} className={FIELD} /></label>
        <RichTextEditor label="Description" value={description} onChange={setDescription} placeholder="Describe the job…" tall />
      </div>
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">Campaign title<input value={campaignTitle} onChange={(event) => setCampaignTitle(event.target.value)} className={FIELD} placeholder="Client-facing campaign name" /></label>
        {scope === "staff" ? <label className="space-y-1.5 text-sm font-medium">Client<select value={clientId} onChange={(event) => setClientId(event.target.value)} className={FIELD}>{clientOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> : <label className="space-y-1.5 text-sm font-medium">Client<input value={job.clientName} readOnly className={`${FIELD} text-muted-foreground`} /></label>}
        {scope === "staff" ? <label className="space-y-1.5 text-sm font-medium">Status<select value={status} onChange={(event) => setStatus(event.target.value as Job["status"])} className={FIELD}><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label> : <label className="space-y-1.5 text-sm font-medium">Status<input value={JOB_STATUS_LABELS[job.status]} readOnly className={`${FIELD} text-muted-foreground`} /></label>}
        <label className="space-y-1.5 text-sm font-medium">Work setup<select value={workSetup} onChange={(event) => setWorkSetup(event.target.value)} className={FIELD}><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></label>
        <label className="space-y-1.5 text-sm font-medium">Estimated length<select value={estimatedLength} onChange={(event) => setEstimatedLength(event.target.value)} className={FIELD}>
          <option value="">Not set</option>
          {[...(estimatedLength && !ESTIMATED_LENGTHS.includes(estimatedLength) ? [estimatedLength] : []), ...ESTIMATED_LENGTHS].map((option) => <option key={option} value={option}>{option}</option>)}
        </select></label>
        <label className="space-y-1.5 text-sm font-medium">Languages<select value={languages} onChange={(event) => setLanguages(event.target.value)} className={FIELD}>
          <option value="">Not set</option>
          {[...(languages && !LANGUAGE_OPTIONS.includes(languages) ? [languages] : []), ...LANGUAGE_OPTIONS].map((option) => <option key={option} value={option}>{option}</option>)}
        </select></label>
        <label className="space-y-1.5 text-sm font-medium">Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">End date<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">Desired start<input type="date" value={desiredStartDate} onChange={(event) => setDesiredStartDate(event.target.value)} className={FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">Fee<input value={fee} onChange={(event) => setFee(event.target.value)} className={FIELD} /></label>
        {scope === "staff" ? <>
          <label className="space-y-1.5 text-sm font-medium">Team lead<select value={leadUserId} onChange={(event) => setLeadUserId(event.target.value)} className={FIELD}>
            <option value="">Not set</option>
            {people.map((person) => <option key={person.key} value={person.key}>{person.name}</option>)}
          </select></label>
          <fieldset className="space-y-1.5 text-sm font-medium sm:col-span-2 lg:col-span-1 xl:col-span-2"><legend className="mb-1.5">Assigned to</legend>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-input bg-background p-2">
              <input type="search" value={assigneeSearch} onChange={(event) => setAssigneeSearch(event.target.value)} placeholder="Search people" aria-label="Search people" className="mb-1 h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm font-normal outline-none focus:border-primary" />
              {people.filter((person) => person.uid && (assignedUids.includes(person.uid) || person.name.toLowerCase().includes(assigneeSearch.trim().toLowerCase()))).map((person) => (
                <label key={person.uid} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 font-normal hover:bg-muted">
                  <input type="checkbox" checked={assignedUids.includes(person.uid!)} onChange={(event) => setAssignedUids((current) => event.target.checked ? [...current, person.uid!] : current.filter((uid) => uid !== person.uid))} className="h-4 w-4 accent-[var(--primary)]" />
                  {person.name}
                </label>
              ))}
            </div>
            <p className="m-0 text-xs font-normal text-muted-foreground">{assignedUids.length ? `${assignedUids.length} assigned. The first one picked is the default payee.` : "Unassigned"}</p>
          </fieldset>
        </> : null}
        <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2"><TagInput label="Category" value={category ? [category] : []} onChange={(values) => setCategory(values[values.length - 1] ?? "")} placeholder="e.g. Agency, then press Enter" /></div>
        <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2"><TagInput label="Tags" value={requiredSkills} onChange={setRequiredSkills} placeholder="e.g. Framer, then press Enter" /></div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <span className="text-muted-foreground">Created</span>
          <time dateTime={jobPostedDate(job) ?? undefined} className="font-medium">{longDate(jobPostedDate(job))}</time>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border pt-4">
        {saved ? <span role="status" className="text-sm text-muted-foreground">Changes saved.</span> : null}
        <button type="submit" disabled={saving} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
      </div>
      </div>
    </div>
  </form>;
}
