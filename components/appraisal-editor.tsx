"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { ArrowLeft, Save, Share2 } from "lucide-react";
import { firebaseDb } from "@/lib/firebase/client";
import {
  APPRAISAL_COLLECTION, APPRAISAL_SECTIONS, EMPTY_SIGNOFF, JOB_RELEVANCE_SCALE, PERFORMANCE_SCALE, QUALITATIVE_QUESTIONS,
  RESPONSE_QUESTIONS, formatOverall, itemScore, overallLabel, scoreAppraisal,
  type Appraisal, type AppraisalRating, type AppraisalSignoff,
} from "@/lib/appraisals";
import type { User } from "@/lib/users";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppraisalStatus } from "@/components/appraisal-status";
import { MobileHeaderActions, MobileHeaderTitle } from "@/components/dashboard/mobile-header";

const LABEL_CLASS = "mb-1.5 block text-[13px] font-semibold";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className={LABEL_CLASS}>{label}</span>{children}</label>;
}

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-5"><h2 className="m-0 border-b border-border pb-2 text-[17px] font-bold">{title}</h2>{children}</section>;
}

export function AppraisalEditor({ appraisal, user, users }: { appraisal?: Appraisal; user: { uid: string; name: string | null }; users: User[] }) {
  const router = useRouter();
  const [employeeUid, setEmployeeUid] = React.useState(appraisal?.employeeUid ?? "");
  const [employeeName, setEmployeeName] = React.useState(appraisal?.employeeName ?? "");
  const [employeeTitle, setEmployeeTitle] = React.useState(appraisal?.employeeTitle ?? "");
  const [preparerName, setPreparerName] = React.useState(appraisal?.preparerName ?? user.name ?? "");
  const [preparerTitle, setPreparerTitle] = React.useState(appraisal?.preparerTitle ?? "");
  const [period, setPeriod] = React.useState(appraisal?.period ?? "");
  const [ratings, setRatings] = React.useState<Record<string, AppraisalRating>>(appraisal?.ratings ?? {});
  const [comments, setComments] = React.useState<Record<string, string>>(appraisal?.comments ?? {});
  const [qualitative, setQualitative] = React.useState<Record<string, string>>(appraisal?.qualitative ?? {});
  const [signoff, setSignoff] = React.useState<AppraisalSignoff>(appraisal?.signoff ?? EMPTY_SIGNOFF);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const people = users
    .filter((candidate) => candidate.uid)
    .sort((a, b) => a.name.localeCompare(b.name));
  const score = scoreAppraisal(ratings);
  const valid = employeeName.trim().length > 0;
  const canShare = valid && employeeUid.length > 0;
  const response = appraisal?.response ?? {};

  const pickEmployee = (uid: string) => {
    setEmployeeUid(uid);
    const person = people.find((candidate) => candidate.uid === uid);
    if (person) {
      setEmployeeName(person.name);
      if (!employeeTitle.trim()) setEmployeeTitle(person.title ?? "");
    }
  };

  const setRating = (itemId: string, key: keyof AppraisalRating, raw: string) => {
    setRatings((current) => ({
      ...current,
      [itemId]: { job: current[itemId]?.job ?? null, performance: current[itemId]?.performance ?? null, [key]: raw ? Number(raw) : null },
    }));
  };

  const save = async (share: boolean) => {
    if (busy || !valid || (share && !canShare)) return;
    setBusy(true);
    setError(null);
    const now = new Date().toISOString();
    const fields = {
      status: share ? "shared" : (appraisal?.status ?? "draft"),
      employeeUid: employeeUid || null,
      employeeName: employeeName.trim(),
      employeeTitle: employeeTitle.trim(),
      preparerName: preparerName.trim(),
      preparerTitle: preparerTitle.trim(),
      period: period.trim(),
      ratings, comments, qualitative, signoff,
      updatedAt: now,
    };
    try {
      if (appraisal) {
        await updateDoc(doc(firebaseDb, APPRAISAL_COLLECTION, appraisal.id), fields);
      } else {
        await addDoc(collection(firebaseDb, APPRAISAL_COLLECTION), {
          ...fields, response: {}, createdBy: user.uid, createdByName: user.name, createdAt: now,
        });
      }
      router.push("/admin/appraisals");
      router.refresh();
    } catch (cause) {
      console.error("Unable to save appraisal", cause);
      setError(share ? "Couldn’t share the appraisal. Please try again." : "Couldn’t save the appraisal. Please try again.");
      setBusy(false);
    }
  };

  const actionButtons = <>
    <button type="button" onClick={() => router.push("/admin/appraisals")} aria-label="Back" title="Back" className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-semibold">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Back</span>
    </button>
    <button type="button" disabled={!valid || busy} onClick={() => void save(false)} aria-label="Save" title="Save" className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-semibold disabled:opacity-50">
      <Save className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">{busy ? "Saving…" : "Save"}</span>
    </button>
    {appraisal?.status !== "shared" && <button type="button" disabled={!canShare || busy} onClick={() => void save(true)} aria-label="Share with employee" title="Share with employee" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-50">
      <Share2 className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Share</span>
    </button>}
  </>;

  return <div className="space-y-8">
    <MobileHeaderTitle title={appraisal ? "Edit appraisal" : "New appraisal"} />
    <MobileHeaderActions>{actionButtons}</MobileHeaderActions>
    <header className="hidden flex-wrap items-center justify-between gap-3 border-b border-border pb-4 nav:flex">
      <div>
        <h1 className="m-0 text-[22px] font-bold">{appraisal ? "Edit appraisal" : "New appraisal"}</h1>
        {appraisal && <div className="mt-2"><AppraisalStatus status={appraisal.status} /></div>}
      </div>
      <div className="flex items-center gap-2">{actionButtons}</div>
    </header>
    {error && <p className="text-[13px] text-destructive">{error}</p>}

    <Part title="Employee">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Employee account">
          <Select value={employeeUid || "__none__"} onValueChange={(value) => pickEmployee(value === "__none__" ? "" : value)}>
            <SelectTrigger><SelectValue placeholder="Choose a person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Choose a person</SelectItem>
              {people.map((person) => <SelectItem key={person.uid as string} value={person.uid as string}>{person.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Review period"><Input value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="e.g. January – June 2026" /></Field>
        <Field label="Employee’s name"><Input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} /></Field>
        <Field label="Title"><Input value={employeeTitle} onChange={(event) => setEmployeeTitle(event.target.value)} /></Field>
        <Field label="Preparer’s name"><Input value={preparerName} onChange={(event) => setPreparerName(event.target.value)} /></Field>
        <Field label="Title"><Input value={preparerTitle} onChange={(event) => setPreparerTitle(event.target.value)} /></Field>
      </div>
    </Part>

    <Part title="Part I: Appraisal of performance">
      {APPRAISAL_SECTIONS.map((section) => {
        const sectionScore = score.sections[section.id];
        return <div key={section.id} className="rounded-xl border border-border">
          <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
            <h3 className="m-0 text-[15px] font-semibold">{section.title}</h3>
            <span className="text-[13px] text-muted-foreground">Score {sectionScore.performanceTotal}</span>
          </div>
          <div className="divide-y divide-border">
            {section.items.map((item) => {
              const rating = ratings[item.id];
              const value = itemScore(rating);
              return <div key={item.id} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_190px_160px_56px] md:items-end">
                <p className="m-0 text-[14px]">{item.label}</p>
                <Field label="Job relevance">
                  <Select value={rating?.job ? String(rating.job) : "__none__"} onValueChange={(value) => setRating(item.id, "job", value === "__none__" ? "" : value)}>
                    <SelectTrigger><SelectValue placeholder="Not applicable" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not applicable</SelectItem>
                      {JOB_RELEVANCE_SCALE.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.value} · {option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Performance">
                  <Select value={rating?.performance ? String(rating.performance) : "__none__"} onValueChange={(value) => setRating(item.id, "performance", value === "__none__" ? "" : value)}>
                    <SelectTrigger><SelectValue placeholder="Not applicable" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not applicable</SelectItem>
                      {PERFORMANCE_SCALE.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.value} · {option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <div><span className={LABEL_CLASS}>Score</span><p className="m-0 flex h-10 items-center text-[14px] font-semibold">{value ?? "—"}</p></div>
              </div>;
            })}
          </div>
          <div className="border-t border-border px-4 py-3">
            <Field label="Comments"><Textarea rows={3} value={comments[section.id] ?? ""} onChange={(event) => setComments((current) => ({ ...current, [section.id]: event.target.value }))} /></Field>
          </div>
        </div>;
      })}

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <h3 className="m-0 mb-3 text-[15px] font-semibold">Overall score</h3>
        <dl className="m-0 grid gap-3 text-[14px] sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Job score total</dt><dd className="m-0 font-semibold">{score.jobTotal}</dd></div>
          <div><dt className="text-muted-foreground">Performance score total</dt><dd className="m-0 font-semibold">{score.performanceTotal}</dd></div>
          <div><dt className="text-muted-foreground">Overall (performance ÷ job)</dt><dd className="m-0 font-semibold">{formatOverall(score.overall)}{score.overall !== null ? ` · ${overallLabel(score.overall)}` : ""}</dd></div>
        </dl>
      </div>
    </Part>

    <Part title="Part II: Qualitative summary">
      {QUALITATIVE_QUESTIONS.map((question, index) => <Field key={question.id} label={`${index + 1}. ${question.label}`}>
        <Textarea rows={4} value={qualitative[question.id] ?? ""} onChange={(event) => setQualitative((current) => ({ ...current, [question.id]: event.target.value }))} />
      </Field>)}
    </Part>

    {appraisal && <Part title="Part III: Employee response">
      {RESPONSE_QUESTIONS.map((question, index) => <div key={question.id}>
        <p className={LABEL_CLASS}>{index + 1}. {question.label}</p>
        <p className="m-0 whitespace-pre-wrap text-[14px] text-muted-foreground">{response[question.id]?.trim() || "No response yet."}</p>
      </div>)}
    </Part>}

    <Part title="Sign-off">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Appraisal discussed with employee"><Input type="date" value={signoff.discussedOn} onChange={(event) => setSignoff((current) => ({ ...current, discussedOn: event.target.value }))} /></Field>
        <Field label="Preparer’s signature date"><Input type="date" value={signoff.preparerDate} onChange={(event) => setSignoff((current) => ({ ...current, preparerDate: event.target.value }))} /></Field>
        <Field label="Employee’s signature date"><Input type="date" value={signoff.employeeDate} onChange={(event) => setSignoff((current) => ({ ...current, employeeDate: event.target.value }))} /></Field>
        <Field label="MD’s signature date"><Input type="date" value={signoff.mdDate} onChange={(event) => setSignoff((current) => ({ ...current, mdDate: event.target.value }))} /></Field>
      </div>
    </Part>
  </div>;
}
