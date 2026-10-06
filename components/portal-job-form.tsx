"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { usePortalClient } from "@/components/portal-shell";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TagInput } from "@/components/tag-input";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { newJobRecord } from "@/lib/job-records";
import { normalizeJob, type Job } from "@/lib/jobs";

const FIELD = "block space-y-1.5 text-sm font-medium";
const INPUT = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/40";

function slugFor(title: string) {
  const base = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "job";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

/** A client posts a new job for their company, or edits one of theirs (`jobId`). */
export function PortalJobForm({ jobId }: { jobId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const portal = usePortalClient();
  const [loaded, setLoaded] = React.useState(!jobId);
  const [missing, setMissing] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [workSetup, setWorkSetup] = React.useState("remote");
  const [estimatedLength, setEstimatedLength] = React.useState("");
  const [desiredStartDate, setDesiredStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [fee, setFee] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!jobId) return;
    let active = true;
    jobsCollection()
      .then((name) => getDoc(doc(firebaseDb, name, jobId)))
      .then((snapshot) => {
        if (!active) return;
        const job: Job | null = snapshot.exists() ? normalizeJob(snapshot.data() as Record<string, unknown>, snapshot.id) : null;
        if (!job || job.clientId !== portal?.clientId) {
          setMissing(true);
        } else {
          setTitle(job.title ?? job.name ?? "");
          setSummary(job.summary ?? "");
          setCategory(job.category ?? "");
          setTags(job.requiredSkills ?? []);
          setWorkSetup(job.workSetup ?? "remote");
          setEstimatedLength(job.estimatedLength ?? "");
          setDesiredStartDate(job.desiredStartDate ?? "");
          setEndDate(job.endDate ?? "");
          setFee(job.fee && job.fee !== "To be confirmed" ? job.fee : "");
        }
        setLoaded(true);
      })
      .catch(() => { if (active) { setMissing(true); setLoaded(true); } });
    return () => { active = false; };
  }, [jobId, portal?.clientId]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !portal || !user) return;
    if (!title.trim()) return setError("Give the job a title.");
    if (endDate && desiredStartDate && endDate < desiredStartDate) return setError("The end date must be after the start date.");
    setSaving(true);
    setError(null);
    const brief = {
      name: title.trim(),
      title: title.trim(),
      campaignTitle: title.trim(),
      summary,
      category: category.trim() || "General",
      requiredSkills: tags,
      workSetup,
      estimatedLength: estimatedLength.trim() || null,
      desiredStartDate: desiredStartDate || null,
      startDate: desiredStartDate || null,
      endDate: endDate || null,
      fee: fee.trim() || "To be confirmed",
      updatedAt: serverTimestamp(),
    };
    try {
      const collectionName = await jobsCollection();
      if (jobId) {
        await updateDoc(doc(firebaseDb, collectionName, jobId), brief);
        router.push(`/portal/jobs/${encodeURIComponent(jobId)}`);
      } else {
        const slug = slugFor(title);
        await setDoc(doc(firebaseDb, collectionName, slug), {
          ...newJobRecord({ slug, title: title.trim(), client: { slug: portal.clientId, name: portal.client?.name ?? portal.clientId } }),
          ...brief,
          placeholder: false,
          languages: [],
          postedBy: user.uid,
          postedByName: user.name ?? user.email ?? null,
        });
        router.push(`/portal/jobs/${encodeURIComponent(slug)}`);
      }
    } catch (cause) {
      console.error("Unable to save job", cause);
      setError("Couldn’t save this job. Try again.");
      setSaving(false);
    }
  };

  const back = <Link href={jobId ? `/portal/jobs/${encodeURIComponent(jobId)}` : "/portal/jobs"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft aria-hidden="true" className="h-4 w-4" />{jobId ? "Back to job" : "Jobs"}</Link>;
  if (!loaded) return <div>{back}<p className="mt-6 text-sm text-muted-foreground">Loading…</p></div>;
  if (missing) return <div>{back}<p className="mt-6 text-sm text-muted-foreground">This job doesn’t exist or isn’t yours.</p></div>;

  return (
    <form onSubmit={save} className="grid max-w-3xl gap-4">
      {back}
      <h1 className="m-0 text-page-title font-bold sm:text-page-title-lg">{jobId ? "Edit job" : "Post a job"}</h1>
      <label className={FIELD}>Job title<input value={title} onChange={(event) => setTitle(event.target.value)} className={INPUT} placeholder="e.g. Social media content for our October launch" required /></label>
      <RichTextEditor label="Description" value={summary} onChange={setSummary} placeholder="What do you need, who is it for, and what does success look like?" compact />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={FIELD}>Category<input value={category} onChange={(event) => setCategory(event.target.value)} className={INPUT} placeholder="e.g. Social media" /></label>
        <label className={FIELD}>Work setup
          <select value={workSetup} onChange={(event) => setWorkSetup(event.target.value)} className={INPUT}>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
        </label>
        <label className={FIELD}>Start date<input type="date" value={desiredStartDate} onChange={(event) => setDesiredStartDate(event.target.value)} className={INPUT} /></label>
        <label className={FIELD}>End date<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={INPUT} /></label>
        <label className={FIELD}>Estimated length<input value={estimatedLength} onChange={(event) => setEstimatedLength(event.target.value)} className={INPUT} placeholder="e.g. 4 weeks" /></label>
        <label className={FIELD}>Budget<input value={fee} onChange={(event) => setFee(event.target.value)} className={INPUT} placeholder="e.g. NGN 2,000,000" /></label>
      </div>
      <TagInput label="Tags" value={tags} onChange={setTags} placeholder="e.g. TikTok, then press Enter" />
      {error ? <p role="alert" className="m-0 text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : jobId ? "Save changes" : "Post job"}</button>
      </div>
    </form>
  );
}
