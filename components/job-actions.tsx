"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { EditSheet, ImageUploadField, SelectField, TextField, TextareaField } from "@/components/detail-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Job } from "@/lib/jobs";
import { EMPTY_JOB_TERMS, JOB_TERMS_COLLECTION, type JobTerms } from "@/lib/job-terms";

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
  const [clientName, setClientName] = React.useState(job.clientName ?? "");
  const [category, setCategory] = React.useState(job.category ?? "");
  const [status, setStatus] = React.useState(job.status ?? "pitch");
  const [year, setYear] = React.useState(job.year != null ? String(job.year) : "");
  const [leadUserId, setLeadUserId] = React.useState(job.leadUserId ?? "");
  const [fee, setFee] = React.useState(job.fee ?? "");
  const [target, setTarget] = React.useState(job.target ?? "");
  const [result, setResult] = React.useState(job.result ?? "");
  const [image, setImage] = React.useState(job.image ?? "");
  const [imageAlt, setImageAlt] = React.useState(job.imageAlt ?? "");
  const [summary, setSummary] = React.useState(job.summary ?? "");
  const [challenge, setChallenge] = React.useState(job.challenge ?? "");
  const [insight, setInsight] = React.useState(job.insight ?? "");
  const [strategy, setStrategy] = React.useState(job.strategy ?? "");
  const [platform, setPlatform] = React.useState((job.platform ?? []).join(", "));
  const [execution, setExecution] = React.useState(job.execution ?? "");
  const [outcome, setOutcome] = React.useState(job.outcome ?? "");
  const [startDate, setStartDate] = React.useState(job.startDate ?? "");
  const [endDate, setEndDate] = React.useState(job.endDate ?? "");
  const [specialization, setSpecialization] = React.useState(job.specialization ?? "");
  const [workSetup, setWorkSetup] = React.useState(job.workSetup ?? "remote");
  const [estimatedLength, setEstimatedLength] = React.useState(job.estimatedLength ?? "");
  const [languages, setLanguages] = React.useState(listValue(job.languages));
  const [desiredStartDate, setDesiredStartDate] = React.useState(job.desiredStartDate ?? "");
  const [jobPostedAt, setJobPostedAt] = React.useState(job.jobPostedAt ?? "");
  const [requiredSkills, setRequiredSkills] = React.useState(listValue(job.requiredSkills));

  // Pay and assignment are private, so they load separately from the public job record.
  const [terms, setTerms] = React.useState<JobTerms | null>(null);
  const [assignedTo, setAssignedTo] = React.useState("");
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
        setAssignedTo(loaded.assignedTo ?? "");
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
    const assignee = users.find((person) => person.uid === assignedTo);
    await updateDoc(doc(firebaseDb, await jobsCollection(), job.slug), {
      name: name.trim(),
      title: title.trim() || name.trim(),
      clientName: clientName.trim(),
      category: category.trim(),
      status,
      year: Number.isFinite(parsedYear as number) ? parsedYear : null,
      leadUserId: leadUserId.trim() || null,
      fee: fee.trim(),
      target: target.trim(),
      result: result.trim(),
      image: image.trim(),
      imageAlt: imageAlt.trim(),
      summary: summary.trim(),
      challenge: challenge.trim(),
      insight: insight.trim(),
      strategy: strategy.trim(),
      platform: platform.split(",").map((item) => item.trim()).filter(Boolean),
      execution: execution.trim(),
      outcome: outcome.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
      specialization: specialization.trim() || null,
      workSetup: workSetup || null,
      estimatedLength: estimatedLength.trim() || null,
      languages: parseList(languages),
      desiredStartDate: desiredStartDate || null,
      jobPostedAt: jobPostedAt || null,
      requiredSkills: parseList(requiredSkills),
      placeholder: false,
      updatedAt: serverTimestamp(),
    });
    if (terms) {
      await setDoc(doc(firebaseDb, JOB_TERMS_COLLECTION, job.slug), {
        assignedTo: assignedTo || null,
        assignedToName: assignedTo ? assignee?.name ?? terms.assignedToName : null,
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
      description={job.title ?? job.name}
      onSave={save}
      onDelete={remove}
      deleteConfirm="Delete this job? This can’t be undone."
      canEdit={isStaff}
      trigger={compactMenu ? (open, removeFromMenu) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${job.title ?? job.name}`}
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
      <TextField label="Client name" value={clientName} onChange={setClientName} />
      <TextField label="Category" value={category} onChange={setCategory} />
      <SelectField
        label="Status"
        value={status}
        onChange={(value) => setStatus(value as Job["status"])}
        options={[
          { value: "live", label: "Live" },
          { value: "pitch", label: "Pitch" },
          { value: "completed", label: "Completed" },
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
      <TextField label="Target" value={target} onChange={setTarget} />
      <TextField label="Result so far" value={result} onChange={setResult} />
      <TextField label="Cover image alt text" value={imageAlt} onChange={setImageAlt} />
      <TextareaField label="Summary" value={summary} onChange={setSummary} />
      <TextareaField label="Challenge" value={challenge} onChange={setChallenge} />
      <TextareaField label="Insight" value={insight} onChange={setInsight} />
      <TextareaField label="Strategy" value={strategy} onChange={setStrategy} />
      <TextField label="Platform (comma separated)" value={platform} onChange={setPlatform} />
      <TextareaField label="Execution" value={execution} onChange={setExecution} />
      <TextareaField label="Outcome" value={outcome} onChange={setOutcome} />

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
      <TextField label="Job posted" value={jobPostedAt} onChange={setJobPostedAt} type="date" />
      <TextField label="Required skills (comma separated)" value={requiredSkills} onChange={setRequiredSkills} placeholder="Framer, UI Design" />

      {terms ? (
        <>
          <SheetSection>Assignment and pay (private)</SheetSection>
          <SelectField
            label="Assigned to"
            value={assignedTo || "unassigned"}
            onChange={(value) => setAssignedTo(value === "unassigned" ? "" : value)}
            options={[
              { value: "unassigned", label: "Unassigned" },
              ...(terms.assignedTo && !users.some((person) => person.uid === terms.assignedTo)
                ? [{ value: terms.assignedTo, label: terms.assignedToName ?? "Current assignee" }]
                : []),
              ...leadOptions.filter((person) => person.uid).map((person) => ({ value: person.uid!, label: person.name })),
            ]}
          />
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
