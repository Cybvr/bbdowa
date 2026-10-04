"use client";

import * as React from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { TaskClientCampaignFields, useTaskLinkOptions } from "@/components/task-link-fields";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import { WORK_JOBS_COLLECTION, type WorkJob } from "@/lib/work-jobs";

const labelClass = "block space-y-1.5 text-sm font-medium";
const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const listValue = (value?: string[] | null) => (value ?? []).join(", ");
const parseList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export function WorkJobFormDialog({ job, open, onOpenChange, onSaved }: {
  job?: WorkJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (id: string) => void;
}) {
  const { user, actualUser } = useAuth();
  const { users } = useFirestoreUsers();
  const { clients, campaigns, loading: linksLoading } = useTaskLinkOptions();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState("");
  const [status, setStatus] = React.useState<WorkJob["status"]>("active");
  const [clientId, setClientId] = React.useState<string | null>(null);
  const [campaignId, setCampaignId] = React.useState<string | null>(null);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [billingCycle, setBillingCycle] = React.useState<WorkJob["billingCycle"]>("monthly");
  const [rateAmount, setRateAmount] = React.useState("");
  const [rateCurrency, setRateCurrency] = React.useState<WorkJob["rateCurrency"]>("NGN");
  const [rateUnit, setRateUnit] = React.useState<WorkJob["rateUnit"]>("hour");
  const [commitment, setCommitment] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactRole, setContactRole] = React.useState("");
  const [contactOutOfOfficeUntil, setContactOutOfOfficeUntil] = React.useState("");
  const [contactNote, setContactNote] = React.useState("");
  const [companyTeamSize, setCompanyTeamSize] = React.useState("");
  const [companyYearFounded, setCompanyYearFounded] = React.useState("");
  const [companyIndustry, setCompanyIndustry] = React.useState("");
  const [companyLocation, setCompanyLocation] = React.useState("");
  const [companyWebsite, setCompanyWebsite] = React.useState("");
  const [companyLinkedIn, setCompanyLinkedIn] = React.useState("");
  const [specialization, setSpecialization] = React.useState("");
  const [workSetup, setWorkSetup] = React.useState("remote");
  const [clientHours, setClientHours] = React.useState("");
  const [clientHoursTimezone, setClientHoursTimezone] = React.useState("");
  const [workdayOverlap, setWorkdayOverlap] = React.useState("");
  const [clientTimezone, setClientTimezone] = React.useState("");
  const [estimatedLength, setEstimatedLength] = React.useState("");
  const [languages, setLanguages] = React.useState("");
  const [desiredStartDate, setDesiredStartDate] = React.useState("");
  const [jobPostedAt, setJobPostedAt] = React.useState("");
  const [requiredSkills, setRequiredSkills] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setTitle(job?.title ?? "");
    setDescription(job?.description ?? "");
    setAssignedTo(job?.assignedTo ?? "");
    setStatus(job?.status ?? "active");
    setClientId(job?.clientId ?? null);
    setCampaignId(job?.campaignId ?? null);
    setStartDate(job?.startDate ?? "");
    setEndDate(job?.endDate ?? "");
    setBillingCycle(job?.billingCycle ?? "monthly");
    setRateAmount(job?.rateAmount == null ? "" : String(job.rateAmount));
    setRateCurrency(job?.rateCurrency ?? "NGN");
    setRateUnit(job?.rateUnit ?? "hour");
    setCommitment(job?.commitment ?? "");
    setContactName(job?.contactName ?? "");
    setContactEmail(job?.contactEmail ?? "");
    setContactRole(job?.contactRole ?? "");
    setContactOutOfOfficeUntil(job?.contactOutOfOfficeUntil ?? "");
    setContactNote(job?.contactNote ?? "");
    setCompanyTeamSize(job?.companyTeamSize == null ? "" : String(job.companyTeamSize));
    setCompanyYearFounded(job?.companyYearFounded == null ? "" : String(job.companyYearFounded));
    setCompanyIndustry(job?.companyIndustry ?? "");
    setCompanyLocation(job?.companyLocation ?? "");
    setCompanyWebsite(job?.companyWebsite ?? "");
    setCompanyLinkedIn(job?.companyLinkedIn ?? "");
    setSpecialization(job?.specialization ?? "");
    setWorkSetup(job?.workSetup ?? "remote");
    setClientHours(job?.clientHours ?? "");
    setClientHoursTimezone(job?.clientHoursTimezone ?? "");
    setWorkdayOverlap(job?.workdayOverlap ?? "");
    setClientTimezone(job?.clientTimezone ?? "");
    setEstimatedLength(job?.estimatedLength ?? "");
    setLanguages(listValue(job?.languages));
    setDesiredStartDate(job?.desiredStartDate ?? "");
    setJobPostedAt(job?.jobPostedAt ?? "");
    setRequiredSkills(listValue(job?.requiredSkills));
    setError(null);
  }, [open, job?.id]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || saving) return;
    const assignee = users.find((candidate) => candidate.uid === assignedTo)
      ?? (job?.assignedTo === assignedTo ? { uid: job.assignedTo, name: job.assignedToName } : null);
    const amount = rateAmount.trim() ? Number(rateAmount) : null;
    const teamSize = companyTeamSize.trim() ? Number(companyTeamSize) : null;
    const founded = companyYearFounded.trim() ? Number(companyYearFounded) : null;
    if (!title.trim() || !assignee) { setError("Enter a title and choose an assignee."); return; }
    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) { setError("Enter a rate above zero."); return; }
    if (teamSize !== null && (!Number.isInteger(teamSize) || teamSize < 0)) { setError("Enter a valid team size."); return; }
    if (founded !== null && (!Number.isInteger(founded) || founded < 1800 || founded > new Date().getFullYear())) { setError("Enter a valid founding year."); return; }
    if (startDate && endDate && endDate < startDate) { setError("The end date must be after the start date."); return; }
    setSaving(true);
    setError(null);
    try {
      const client = clients.find((item) => item.slug === clientId);
      const campaign = campaigns.find((item) => item.slug === campaignId && item.clientId === clientId);
      const selectedClient = clientId ? client ?? { slug: clientId, name: job?.clientName ?? clientId } : null;
      const selectedCampaign = campaignId ? campaign ?? { slug: campaignId, name: job?.campaignName ?? campaignId } : null;
      const now = new Date().toISOString();
      const fields = {
        title: title.trim(), description: description.trim(), status,
        assignedTo: assignee.uid, assignedToName: assignee.name,
        clientId: selectedClient?.slug ?? null,
        clientName: selectedClient?.name ?? null,
        campaignId: selectedCampaign?.slug ?? null,
        campaignName: selectedCampaign?.name ?? null,
        startDate: startDate || null, endDate: endDate || null,
        billingCycle, rateAmount: amount, rateCurrency, rateUnit,
        commitment: commitment.trim(), contactName: contactName.trim(), contactEmail: contactEmail.trim(),
        contactRole: contactRole.trim() || null, contactOutOfOfficeUntil: contactOutOfOfficeUntil || null, contactNote: contactNote.trim() || null,
        companyTeamSize: teamSize, companyYearFounded: founded, companyIndustry: companyIndustry.trim() || null,
        companyLocation: companyLocation.trim() || null, companyWebsite: companyWebsite.trim() || null, companyLinkedIn: companyLinkedIn.trim() || null,
        specialization: specialization.trim() || null, workSetup: workSetup || null, clientHours: clientHours.trim() || null,
        clientHoursTimezone: clientHoursTimezone.trim() || null, workdayOverlap: workdayOverlap.trim() || null, clientTimezone: clientTimezone.trim() || null,
        estimatedLength: estimatedLength.trim() || null, languages: parseList(languages), desiredStartDate: desiredStartDate || null,
        jobPostedAt: jobPostedAt || null, requiredSkills: parseList(requiredSkills),
        updatedAt: now,
      };
      if (job) {
        await updateDoc(doc(firebaseDb, WORK_JOBS_COLLECTION, job.id), fields);
        onSaved(job.id);
      } else {
        const result = await addDoc(collection(firebaseDb, WORK_JOBS_COLLECTION), { ...fields, createdBy: actualUser?.uid ?? user.uid, createdAt: now });
        onSaved(result.id);
      }
      onOpenChange(false);
    } catch (cause) {
      console.error("Unable to save job", cause);
      setError("Couldn’t save this job. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{job ? "Edit job" : "New job"}</DialogTitle><DialogDescription>Set up the paid assignment and its terms.</DialogDescription></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <label className={labelClass}>Job title<Input value={title} onChange={(event) => setTitle(event.target.value)} required disabled={saving} placeholder="What is the assignment?" /></label>
        <label className={labelClass}>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} disabled={saving} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Assigned to<select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} required disabled={saving || Boolean(job)} className={selectClass}><option value="">Choose a person</option>{job && !users.some((candidate) => candidate.uid === job.assignedTo) ? <option value={job.assignedTo}>{job.assignedToName}</option> : null}{users.filter((candidate) => candidate.uid).map((candidate) => <option key={candidate.uid!} value={candidate.uid!}>{candidate.name}</option>)}</select></label>
          <label className={labelClass}>Status<select value={status} onChange={(event) => setStatus(event.target.value as WorkJob["status"])} disabled={saving} className={selectClass}><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select></label>
          <TaskClientCampaignFields clientId={clientId} campaignId={campaignId} clients={clients} campaigns={campaigns} disabled={saving || linksLoading} onClientChange={(value) => { setClientId(value); setCampaignId(null); }} onCampaignChange={setCampaignId} />
          <label className={labelClass}>Start date<Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={saving} /></label>
          <label className={labelClass}>End date<Input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} disabled={saving} /></label>
          <label className={labelClass}>Billing cycle<select value={billingCycle} onChange={(event) => setBillingCycle(event.target.value as WorkJob["billingCycle"])} disabled={saving} className={selectClass}><option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="monthly">Monthly</option><option value="milestone">By milestone</option></select></label>
          <label className={labelClass}>Commitment<Input value={commitment} onChange={(event) => setCommitment(event.target.value)} disabled={saving} placeholder="e.g. 5 hrs/week" /></label>
          <label className={labelClass}>Rate<Input type="number" min="0.01" step="0.01" value={rateAmount} onChange={(event) => setRateAmount(event.target.value)} disabled={saving} placeholder="Optional" /></label>
          <div className="grid grid-cols-2 gap-3"><label className={labelClass}>Currency<select value={rateCurrency} onChange={(event) => setRateCurrency(event.target.value as WorkJob["rateCurrency"])} disabled={saving} className={selectClass}><option value="NGN">NGN</option><option value="USD">USD</option></select></label><label className={labelClass}>Per<select value={rateUnit} onChange={(event) => setRateUnit(event.target.value as WorkJob["rateUnit"])} disabled={saving} className={selectClass}><option value="hour">Hour</option><option value="day">Day</option><option value="fixed">Job</option></select></label></div>
        </div>
        <fieldset className="space-y-4 rounded-lg border border-border p-4"><legend className="px-1 text-sm font-semibold">Company information</legend><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Team size<Input type="number" min="0" step="1" value={companyTeamSize} onChange={(event) => setCompanyTeamSize(event.target.value)} disabled={saving} placeholder="e.g. 7" /></label><label className={labelClass}>Year founded<Input type="number" min="1800" max={new Date().getFullYear()} step="1" value={companyYearFounded} onChange={(event) => setCompanyYearFounded(event.target.value)} disabled={saving} placeholder="e.g. 2017" /></label><label className={labelClass}>Industry<Input value={companyIndustry} onChange={(event) => setCompanyIndustry(event.target.value)} disabled={saving} placeholder="Business services" /></label><label className={labelClass}>City / Country<Input value={companyLocation} onChange={(event) => setCompanyLocation(event.target.value)} disabled={saving} placeholder="Lagos, Nigeria" /></label><label className={labelClass}>Website<Input type="url" value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} disabled={saving} placeholder="https://" /></label><label className={labelClass}>LinkedIn<Input type="url" value={companyLinkedIn} onChange={(event) => setCompanyLinkedIn(event.target.value)} disabled={saving} placeholder="https://linkedin.com/company/" /></label></div></fieldset>
        <fieldset className="space-y-4 rounded-lg border border-border p-4"><legend className="px-1 text-sm font-semibold">Job details</legend><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Specialization<Input value={specialization} onChange={(event) => setSpecialization(event.target.value)} disabled={saving} placeholder="Digital design" /></label><label className={labelClass}>Work setup<select value={workSetup} onChange={(event) => setWorkSetup(event.target.value)} disabled={saving} className={selectClass}><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></label><label className={labelClass}>Client hours<Input value={clientHours} onChange={(event) => setClientHours(event.target.value)} disabled={saving} placeholder="~ 17:00 – 01:00" /></label><label className={labelClass}>Client hours converted to<Input value={clientHoursTimezone} onChange={(event) => setClientHoursTimezone(event.target.value)} disabled={saving} placeholder="Africa / Lagos" /></label><label className={labelClass}>Workday overlap<Input value={workdayOverlap} onChange={(event) => setWorkdayOverlap(event.target.value)} disabled={saving} placeholder="8 hrs (2 hrs recommended)" /></label><label className={labelClass}>Client time zone<Input value={clientTimezone} onChange={(event) => setClientTimezone(event.target.value)} disabled={saving} placeholder="Los Angeles (8 hrs behind)" /></label><label className={labelClass}>Estimated length<Input value={estimatedLength} onChange={(event) => setEstimatedLength(event.target.value)} disabled={saving} placeholder="1–2 weeks" /></label><label className={labelClass}>Languages<Input value={languages} onChange={(event) => setLanguages(event.target.value)} disabled={saving} placeholder="English, French" /></label><label className={labelClass}>Desired start date<Input type="date" value={desiredStartDate} onChange={(event) => setDesiredStartDate(event.target.value)} disabled={saving} /></label><label className={labelClass}>Job posted<Input type="date" value={jobPostedAt} onChange={(event) => setJobPostedAt(event.target.value)} disabled={saving} /></label><label className={`${labelClass} sm:col-span-2`}>Required skills<Input value={requiredSkills} onChange={(event) => setRequiredSkills(event.target.value)} disabled={saving} placeholder="Framer, UI Design, UX Design, Web Design" /></label></div></fieldset>
        <fieldset className="space-y-4 rounded-lg border border-border p-4"><legend className="px-1 text-sm font-semibold">Point of contact</legend><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Name<Input value={contactName} onChange={(event) => setContactName(event.target.value)} disabled={saving} placeholder="Primary contact" /></label><label className={labelClass}>Email<Input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} disabled={saving} placeholder="Optional" /></label><label className={labelClass}>Role<Input value={contactRole} onChange={(event) => setContactRole(event.target.value)} disabled={saving} placeholder="Primary matcher" /></label><label className={labelClass}>Out of office until<Input type="date" value={contactOutOfOfficeUntil} onChange={(event) => setContactOutOfOfficeUntil(event.target.value)} disabled={saving} /></label><label className={`${labelClass} sm:col-span-2`}>Contact note<textarea value={contactNote} onChange={(event) => setContactNote(event.target.value)} disabled={saving} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Availability or handoff note" /></label></div></fieldset>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => onOpenChange(false)} disabled={saving} className="h-9 rounded-md border border-border px-4 text-sm">Cancel</button><button type="submit" disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : job ? "Save changes" : "Create job"}</button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
