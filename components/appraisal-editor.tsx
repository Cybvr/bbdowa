"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { ArrowLeft, Save, Send } from "lucide-react";
import { AppraisalReport } from "@/components/appraisal-report";
import { AppraisalStatus } from "@/components/appraisal-status";
import { MobileHeaderActions, MobileHeaderTitle } from "@/components/dashboard/mobile-header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APPRAISAL_COLLECTION, type Appraisal } from "@/lib/appraisals";
import { firebaseDb } from "@/lib/firebase/client";
import type { User } from "@/lib/users";

const LABEL_CLASS = "mb-1.5 block text-[13px] font-semibold";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className={LABEL_CLASS}>{label}</span>{children}</label>;
}

export function AppraisalEditor({ appraisal, user, users }: { appraisal?: Appraisal; user: { uid: string; name: string | null }; users: User[] }) {
  const router = useRouter();
  const [assignedTo, setAssignedTo] = React.useState(appraisal?.assignedTo ?? "");
  const [assignedToName, setAssignedToName] = React.useState(appraisal?.assignedToName ?? "");
  const [assignedToTitle, setAssignedToTitle] = React.useState(appraisal?.assignedToTitle ?? "");
  const [period, setPeriod] = React.useState(appraisal?.period ?? "");
  const [message, setMessage] = React.useState(appraisal?.message ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const people = users
    .filter((candidate) => candidate.uid && candidate.role !== "client")
    .sort((a, b) => a.name.localeCompare(b.name));
  const valid = assignedTo.length > 0 && assignedToName.trim().length > 0 && period.trim().length > 0;
  const submitted = appraisal?.status === "submitted";

  const pickUser = (uid: string) => {
    setAssignedTo(uid);
    const person = people.find((candidate) => candidate.uid === uid);
    setAssignedToName(person?.name ?? "");
    setAssignedToTitle(person?.title ?? "");
  };

  const save = async () => {
    if (busy || !valid || submitted) return;
    setBusy(true);
    setError(null);
    const now = new Date().toISOString();
    const fields = {
      status: "assigned" as const,
      assignedTo,
      assignedToName: assignedToName.trim(),
      assignedToTitle: assignedToTitle.trim(),
      period: period.trim(),
      message: message.trim(),
      updatedAt: now,
    };
    try {
      if (appraisal) {
        await updateDoc(doc(firebaseDb, APPRAISAL_COLLECTION, appraisal.id), fields);
      } else {
        await addDoc(collection(firebaseDb, APPRAISAL_COLLECTION), {
          ...fields,
          ratings: {},
          comments: {},
          qualitative: {},
          submittedAt: "",
          createdBy: user.uid,
          createdByName: user.name,
          createdAt: now,
        });
      }
      router.push("/admin/appraisals");
      router.refresh();
    } catch (cause) {
      console.error("Unable to assign appraisal", cause);
      setError("Couldn’t send the appraisal. Please try again.");
      setBusy(false);
    }
  };

  const actionButtons = <>
    <button type="button" onClick={() => router.push("/admin/appraisals")} aria-label="Back" title="Back" className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-semibold">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Back</span>
    </button>
    {!submitted ? <button type="button" disabled={!valid || busy} onClick={() => void save()} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-50">
      {appraisal ? <Save className="h-4 w-4" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
      <span>{busy ? "Sending…" : appraisal ? "Save assignment" : "Send appraisal"}</span>
    </button> : null}
  </>;

  return <div className="space-y-8">
    <MobileHeaderTitle title={submitted ? "Review appraisal" : appraisal ? "Edit assignment" : "Assign appraisal"} />
    <MobileHeaderActions>{actionButtons}</MobileHeaderActions>
    <header className="hidden flex-wrap items-center justify-between gap-3 border-b border-border pb-4 nav:flex">
      <div>
        <h1 className="m-0 text-[22px] font-bold">{submitted ? "Review appraisal" : appraisal ? "Edit assignment" : "Assign appraisal"}</h1>
        {appraisal ? <div className="mt-2"><AppraisalStatus status={appraisal.status} /></div> : null}
      </div>
      <div className="flex items-center gap-2">{actionButtons}</div>
    </header>
    {error ? <p role="alert" className="text-[13px] text-destructive">{error}</p> : null}

    {submitted && appraisal ? <AppraisalReport appraisal={appraisal} /> : (
      <section className="space-y-5">
        <div>
          <h2 className="m-0 text-[17px] font-bold">Who should complete this appraisal?</h2>
          <p className="mb-0 mt-1 text-[14px] text-muted-foreground">They’ll see it in their dashboard and complete the full appraisal themselves.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Team member">
            <Select value={assignedTo || "__none__"} onValueChange={(value) => pickUser(value === "__none__" ? "" : value)} disabled={busy}>
              <SelectTrigger><SelectValue placeholder="Choose a person" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Choose a person</SelectItem>
                {people.map((person) => <SelectItem key={person.uid as string} value={person.uid as string}>{person.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Review period">
            <Input value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="e.g. January – June 2026" disabled={busy} />
          </Field>
        </div>
        {assignedTo ? <dl className="m-0 grid gap-3 border-y border-border py-4 text-[14px] sm:grid-cols-2">
          <div><dt className="text-muted-foreground">User</dt><dd className="m-0 mt-1 font-semibold">{assignedToName}</dd></div>
          <div><dt className="text-muted-foreground">Title</dt><dd className="m-0 mt-1 font-semibold">{assignedToTitle || "—"}</dd></div>
        </dl> : null}
        <Field label="Message (optional)">
          <Textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add any context for this appraisal…" disabled={busy} />
        </Field>
      </section>
    )}
  </div>;
}
