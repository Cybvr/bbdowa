"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { useClientOptions, useFirestoreUsers } from "@/lib/firebase/client-content";
import { EditSheet, ImageUploadField, SelectField, TextField, TextareaField } from "@/components/detail-editor";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { jobDisplayTitle, type Job } from "@/lib/jobs";
import { EMPTY_JOB_TERMS, JOB_TERMS_COLLECTION, jobAssignees, type JobTerms } from "@/lib/job-terms";

const listValue = (value?: string[] | null) => (value ?? []).join(", ");
const parseList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

function SheetSection({ children }: { children: React.ReactNode }) {
  return <h3 className="m-0 border-t border-border pt-5 text-sm font-semibold">{children}</h3>;
}

export function JobActions({ job, compactMenu = false, onSaved }: { job: Job; compactMenu?: boolean; onSaved?: () => void }) {
  const router = useRouter();
  const { role } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const { users } = useFirestoreUsers();
  const leadOptions = React.useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  const [name, setName] = React.useState(job.name ?? "");
  const [title, setTitle] = React.useState(job.title ?? "");
  const [campaignTitle, setCampaignTitle] = React.useState(job.campaignTitle ?? job.title ?? job.name ?? "");
  const [clientId, setClientId] = React.useState(job.clientId ?? "");
  const clientOptions = useClientOptions({ clientId: job.clientId, clientName: job.clientName });
  const [category, setCategory] = React.useState(job.category ?? "");
  const [status, setStatus] = React.useState(job.status ?? "active");
  const [year, setYear] = React.useState(job.year != null ? String(job.year) : "");
  const [leadUserId, setLeadUserId] = React.useState(job.leadUserId ?? "");
  const [fee, setFee] = React.useState(job.fee ?? "");
  const [image, setImage] = React.useState(job.image ?? "");
  const [imageAlt, setImageAlt] = React.useState(job.imageAlt ?? "");
  const [summary, setSummary] = React.useState(job.summary ?? "");
  const [startDate, setStartDate] = React.useState(job.startDate ?? "");
  const [endDate, setEndDate] = React.useState(job.endDate ?? "");
  const [specialization, setSpecialization] = React.useState(job.specialization ?? "");
  const [workSetup, setWorkSetup] = React.useState(job.workSetup ?? "remote");
  const [estimatedLength, setEstimatedLength] = React.useState(job.estimatedLength ?? "");
  const [languages, setLanguages] = React.useState(listValue(job.languages));
  const [desiredStartDate, setDesiredStartDate] = React.useState(job.desiredStartDate ?? "");
  const [requiredSkills, setRequiredSkills] = React.useState(listValue(job.requiredSkills));

  // Pay and assignment are private, so they load separately from the public job record.
  const [terms, setTerms] = React.useState<JobTerms | null>(null);
  const [assignedUids, setAssignedUids] = React.useState<string[]>([]);
  const [rateAmount, setRateAmount] = React.useState("");
  const [rateCurrency, setRateCurrency] = React.useState<JobTerms["rateCurrency"]>("NGN");
  const [rateUnit, setRateUnit] = React.useState<JobTerms["rateUnit"]>("hour");
  const [billingCycle, setBillingCycle] = React.useState<JobTerms["billingCycle"]>("monthly");
  const [commitment, setCommitment] = React.useState("");
  const [workdayOverlap, setWorkdayOverlap] = React.useState("");

  React.useEffect(() => {
    if (!isStaff) return;
    let active = true;
    getDoc(doc(firebaseDb, JOB_TERMS_COLLECTION, job.slug))
      .then((snapshot) => {
        if (!active) return;
        const loaded = snapshot.exists() ? { ...EMPTY_JOB_TERMS, ...(snapshot.data() as Partial<JobTerms>) } : EMPTY_JOB_TERMS;
        setTerms(loaded);
        setAssignedUids(jobAssignees(loaded).map((person) => person.uid));
        setRateAmount(loaded.rateAmount == null ? "" : String(loaded.rateAmount));
        setRateCurrency(loaded.rateCurrency);
        setRateUnit(loaded.rateUnit);
        setBillingCycle(loaded.billingCycle);
        setCommitment(loaded.commitment ?? "");
        setWorkdayOverlap(loaded.workdayOverlap ?? "");
      })
      .catch((cause) => console.error("Unable to load job terms", cause));
    return () => { active = false; };
  }, [job.slug, isStaff]);

  const save = async () => {
    const parsedYear = year.trim() ? Number(year) : null;
    const amount = rateAmount.trim() ? Number(rateAmount) : null;
    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) throw new Error("Enter a rate above zero.");
    if (startDate && endDate && endDate < startDate) throw new Error("The end date must be after the start date.");
    const knownAssignees = terms ? jobAssignees(terms) : [];
    const assignees = assignedUids.map((uid) => ({ uid, name: users.find((person) => person.uid === uid)?.name ?? knownAssignees.find((person) => person.uid === uid)?.name ?? "Assignee" }));
    await updateDoc(doc(firebaseDb, await jobsCollection(), job.slug), {
      name: name.trim(),
      title: title.trim() || name.trim(),
      campaignTitle: campaignTitle.trim() || title.trim() || name.trim(),
      clientId,
      clientName: clientOptions.find((option) => option.value === clientId)?.label ?? job.clientName,
      category: category.trim(),
      status,
      year: Number.isFinite(parsedYear as number) ? parsedYear : null,
      leadUserId: leadUserId.trim() || null,
      fee: fee.trim(),
      image: image.trim(),
      imageAlt: imageAlt.trim(),
      summary: summary.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
      specialization: specialization.trim() || null,
      workSetup: workSetup || null,
      estimatedLength: estimatedLength.trim() || null,
      languages: parseList(languages),
      desiredStartDate: desiredStartDate || null,
      requiredSkills: parseList(requiredSkills),
      placeholder: false,
      updatedAt: serverTimestamp(),
    });
    if (terms) {
      // Assignees are always on the team, so they keep access alongside everyone else on it.
      const teamUids = [...new Set([...(terms.teamUids ?? []), ...assignedUids])];
      const assigneeSlugs = assignedUids.map((uid) => users.find((person) => person.uid === uid)?.slug).filter((slug): slug is string => Boolean(slug));
      const missingSlugs = assigneeSlugs.filter((slug) => !(job.creatorSlugs ?? []).includes(slug));
      if (missingSlugs.length) {
        await updateDoc(doc(firebaseDb, await jobsCollection(), job.slug), { creatorSlugs: [...(job.creatorSlugs ?? []), ...missingSlugs] });
      }
      await setDoc(doc(firebaseDb, JOB_TERMS_COLLECTION, job.slug), {
        teamUids,
        assignedTo: assignees[0]?.uid ?? null,
        assignedToName: assignees[0]?.name ?? null,
        assignees,
        rateAmount: amount,
        rateCurrency,
        rateUnit,
        billingCycle,
        commitment: commitment.trim() || null,
        workdayOverlap: workdayOverlap.trim() || null,
        updatedAt: new Date().toISOString(),
      } satisfies JobTerms);
    }
    router.refresh();
    onSaved?.();
  };

  const remove = async () => {
    await deleteDoc(doc(firebaseDb, await jobsCollection(), job.slug));
    await deleteDoc(doc(firebaseDb, JOB_TERMS_COLLECTION, job.slug));
    router.push("/admin/jobs");
  };

  return (
    <EditSheet
      title="Edit job"
      description={jobDisplayTitle(job)}
      onSave={save}
      onDelete={remove}
      deleteConfirm="Delete this job? This can’t be undone."
      canEdit={isStaff}
      trigger={compactMenu ? (open, removeFromMenu) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${jobDisplayTitle(job)}`}
              className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onSelect={open}><Pencil className="h-4 w-4" />Edit</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={removeFromMenu}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : undefined}
    >
      <ImageUploadField label="Cover image" value={image} onChange={setImage} />
      <TextField label="Client (brand)" value={name} onChange={setName} />
      <TextField label="Job title" value={title} onChange={setTitle} />
      <TextField label="Campaign title" value={campaignTitle} onChange={setCampaignTitle} placeholder="Client-facing campaign name" />
      <SelectField label="Client" value={clientId} onChange={setClientId} options={clientOptions} />
      <TextField label="Category" value={category} onChange={setCategory} />
      <SelectField
        label="Status"
        value={status}
        onChange={(value) => setStatus(value as Job["status"])}
        options={[
          { value: "active", label: "Active" },
          { value: "completed", label: "Completed" },
          { value: "archived", label: "Archived" },
        ]}
      />
      <TextField label="Year" value={year} onChange={setYear} type="number" />
      <SelectField
        label="Lead"
        value={leadUserId || "unassigned"}
        onChange={(value) => setLeadUserId(value === "unassigned" ? "" : value)}
        options={[
          { value: "unassigned", label: "Unassigned" },
          ...leadOptions.map((person) => ({ value: person.slug, label: person.name })),
        ]}
      />
      <TextField label="Fee" value={fee} onChange={setFee} />
      <TextField label="Cover image alt text" value={imageAlt} onChange={setImageAlt} />
      <RichTextEditor label="Description" value={summary} onChange={setSummary} placeholder="Describe the job…" compact />

      <SheetSection>Job details</SheetSection>
      <TextField label="Start date" value={startDate} onChange={setStartDate} type="date" />
      <TextField label="End date" value={endDate} onChange={setEndDate} type="date" />
      <TextField label="Specialization" value={specialization} onChange={setSpecialization} placeholder="Digital design" />
      <SelectField
        label="Work setup"
        value={workSetup}
        onChange={setWorkSetup}
        options={[
          { value: "remote", label: "Remote" },
          { value: "hybrid", label: "Hybrid" },
          { value: "onsite", label: "On-site" },
        ]}
      />
      <TextField label="Estimated length" value={estimatedLength} onChange={setEstimatedLength} placeholder="1–2 weeks" />
      <TextField label="Languages (comma separated)" value={languages} onChange={setLanguages} placeholder="English, French" />
      <TextField label="Desired start date" value={desiredStartDate} onChange={setDesiredStartDate} type="date" />
      <TextField label="Required skills (comma separated)" value={requiredSkills} onChange={setRequiredSkills} placeholder="Framer, UI Design" />

      {terms ? (
        <>
          <SheetSection>Assignment and pay (private)</SheetSection>
          <fieldset className="m-0 space-y-2 border-0 p-0">
            <legend className="mb-2 text-sm font-medium">Assigned to</legend>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-input p-2">
              {[
                ...jobAssignees(terms).filter((person) => !users.some((user) => user.uid === person.uid)).map((person) => ({ uid: person.uid, name: person.name })),
                ...leadOptions.filter((person) => person.uid).map((person) => ({ uid: person.uid!, name: person.name })),
              ].map((person) => (
                <label key={person.uid} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={assignedUids.includes(person.uid)}
                    onChange={(event) => setAssignedUids((current) => event.target.checked ? [...current, person.uid] : current.filter((uid) => uid !== person.uid))}
                    className="h-4 w-4 accent-primary"
                  />
                  {person.name}
                </label>
              ))}
            </div>
            <p className="m-0 text-xs text-muted-foreground">{assignedUids.length ? `${assignedUids.length} assigned. The first one picked is the default payee.` : "Unassigned"}</p>
          </fieldset>
          <TextField label="Rate" value={rateAmount} onChange={setRateAmount} type="number" placeholder="Optional" />
          <SelectField
            label="Currency"
            value={rateCurrency}
            onChange={(value) => setRateCurrency(value as JobTerms["rateCurrency"])}
            options={[{ value: "NGN", label: "NGN" }, { value: "USD", label: "USD" }]}
          />
          <SelectField
            label="Rate per"
            value={rateUnit}
            onChange={(value) => setRateUnit(value as JobTerms["rateUnit"])}
            options={[{ value: "hour", label: "Hour" }, { value: "day", label: "Day" }, { value: "fixed", label: "Job" }]}
          />
          <SelectField
            label="Billing cycle"
            value={billingCycle}
            onChange={(value) => setBillingCycle(value as JobTerms["billingCycle"])}
            options={[
              { value: "weekly", label: "Weekly" },
              { value: "biweekly", label: "Bi-weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "milestone", label: "By milestone" },
            ]}
          />
          <TextField label="Commitment" value={commitment} onChange={setCommitment} placeholder="e.g. 5 hrs/week" />
          <TextField label="Workday overlap" value={workdayOverlap} onChange={setWorkdayOverlap} placeholder="2 hrs" />
        </>
      ) : null}
    </EditSheet>
  );
}
