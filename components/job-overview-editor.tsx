"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TagInput } from "@/components/tag-input";
import { firebaseDb } from "@/lib/firebase/client";
import { useClientOptions } from "@/lib/firebase/client-content";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { JOB_STATUS_LABELS, jobPostedDate, type Job } from "@/lib/jobs";
import { longDate } from "@/lib/format";

const FIELD = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40";
const parseList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

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
  const [fee, setFee] = React.useState(job.fee ?? "");
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
        <RichTextEditor label="Description" value={description} onChange={setDescription} placeholder="Describe the job…" tall />
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">Job title<input value={title} onChange={(event) => setTitle(event.target.value)} className={FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">Campaign title<input value={campaignTitle} onChange={(event) => setCampaignTitle(event.target.value)} className={FIELD} placeholder="Client-facing campaign name" /></label>
        {scope === "staff" ? <label className="space-y-1.5 text-sm font-medium">Client<select value={clientId} onChange={(event) => setClientId(event.target.value)} className={FIELD}>{clientOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> : <label className="space-y-1.5 text-sm font-medium">Client<input value={job.clientName} readOnly className={`${FIELD} text-muted-foreground`} /></label>}
        <label className="space-y-1.5 text-sm font-medium">Category<input value={category} onChange={(event) => setCategory(event.target.value)} className={FIELD} /></label>
        {scope === "staff" ? <label className="space-y-1.5 text-sm font-medium">Status<select value={status} onChange={(event) => setStatus(event.target.value as Job["status"])} className={FIELD}><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label> : <label className="space-y-1.5 text-sm font-medium">Status<input value={JOB_STATUS_LABELS[job.status]} readOnly className={`${FIELD} text-muted-foreground`} /></label>}
        <label className="space-y-1.5 text-sm font-medium">Work setup<select value={workSetup} onChange={(event) => setWorkSetup(event.target.value)} className={FIELD}><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></label>
        <label className="space-y-1.5 text-sm font-medium">Estimated length<input value={estimatedLength} onChange={(event) => setEstimatedLength(event.target.value)} className={FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">Languages<input value={languages} onChange={(event) => setLanguages(event.target.value)} className={FIELD} placeholder="English, French" /></label>
        <label className="space-y-1.5 text-sm font-medium">Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">End date<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">Desired start<input type="date" value={desiredStartDate} onChange={(event) => setDesiredStartDate(event.target.value)} className={FIELD} /></label>
        <label className="space-y-1.5 text-sm font-medium">Fee<input value={fee} onChange={(event) => setFee(event.target.value)} className={FIELD} /></label>
        <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2"><TagInput label="Tags" value={requiredSkills} onChange={setRequiredSkills} placeholder="e.g. Framer, then press Enter" /></div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <span className="text-muted-foreground">Created</span>
          <time dateTime={jobPostedDate(job) ?? undefined} className="font-medium">{longDate(jobPostedDate(job))}</time>
        </div>
      </div>
    </div>
    <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
      {saved ? <span role="status" className="text-sm text-muted-foreground">Changes saved.</span> : null}
      <button type="submit" disabled={saving} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
    </div>
  </form>;
}
