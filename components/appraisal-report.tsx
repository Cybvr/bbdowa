"use client";

import * as React from "react";
import { doc, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import {
  APPRAISAL_COLLECTION, APPRAISAL_SECTIONS, JOB_RELEVANCE_SCALE, PERFORMANCE_SCALE, QUALITATIVE_QUESTIONS, RESPONSE_QUESTIONS,
  formatOverall, itemScore, overallLabel, scoreAppraisal, type Appraisal,
} from "@/lib/appraisals";
import { formatDocumentDate } from "@/lib/documents";
import { Textarea } from "@/components/ui/textarea";

const labelFor = (scale: readonly { value: number; label: string }[], value: number | null | undefined) =>
  scale.find((option) => option.value === value)?.label ?? "—";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-4"><h2 className="m-0 border-b border-border pb-2 text-[17px] font-bold">{title}</h2>{children}</section>;
}

function Answer({ label, value }: { label: string; value: string | undefined }) {
  return <div><p className="m-0 mb-1 text-[13px] font-semibold">{label}</p><p className="m-0 whitespace-pre-wrap text-[14px] text-muted-foreground">{value?.trim() || "—"}</p></div>;
}

/** Read-only appraisal. When `canRespond` is set the employee can write Part III. */
export function AppraisalReport({ appraisal, canRespond, onSaved }: { appraisal: Appraisal; canRespond?: boolean; onSaved?: (response: Record<string, string>) => void }) {
  const score = scoreAppraisal(appraisal.ratings);
  const [response, setResponse] = React.useState<Record<string, string>>(appraisal.response);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);

  const saveResponse = async () => {
    setBusy(true);
    setMessage(null);
    setFailed(false);
    try {
      await updateDoc(doc(firebaseDb, APPRAISAL_COLLECTION, appraisal.id), { response, updatedAt: new Date().toISOString() });
      onSaved?.(response);
      setMessage("Response saved.");
    } catch (cause) {
      console.error("Unable to save appraisal response", cause);
      setFailed(true);
      setMessage("Couldn’t save your response. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="space-y-8">
    <dl className="m-0 grid gap-4 text-[14px] sm:grid-cols-2">
      <div><dt className="text-muted-foreground">Employee</dt><dd className="m-0 font-semibold">{appraisal.employeeName}{appraisal.employeeTitle ? ` · ${appraisal.employeeTitle}` : ""}</dd></div>
      <div><dt className="text-muted-foreground">Prepared by</dt><dd className="m-0 font-semibold">{appraisal.preparerName || "—"}{appraisal.preparerTitle ? ` · ${appraisal.preparerTitle}` : ""}</dd></div>
      <div><dt className="text-muted-foreground">Review period</dt><dd className="m-0 font-semibold">{appraisal.period || "—"}</dd></div>
      <div><dt className="text-muted-foreground">Overall score</dt><dd className="m-0 font-semibold">{formatOverall(score.overall)}{score.overall !== null ? ` · ${overallLabel(score.overall)}` : ""}</dd></div>
    </dl>

    <Block title="Part I: Appraisal of performance">
      {APPRAISAL_SECTIONS.map((section) => <div key={section.id} className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-border"><th className="px-4 py-3 text-[15px] font-semibold">{section.title}</th><th className="w-44 px-4 py-3 text-[13px] font-semibold text-muted-foreground">Job relevance</th><th className="w-36 px-4 py-3 text-[13px] font-semibold text-muted-foreground">Performance</th><th className="w-16 px-4 py-3 text-[13px] font-semibold text-muted-foreground">Score</th></tr>
          </thead>
          <tbody>
            {section.items.map((item) => {
              const rating = appraisal.ratings[item.id];
              return <tr key={item.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">{item.label}</td>
                <td className="px-4 py-3">{rating?.job ? `${rating.job} · ${labelFor(JOB_RELEVANCE_SCALE, rating.job)}` : "—"}</td>
                <td className="px-4 py-3">{rating?.performance ? `${rating.performance} · ${labelFor(PERFORMANCE_SCALE, rating.performance)}` : "—"}</td>
                <td className="px-4 py-3 font-semibold">{itemScore(rating) ?? "—"}</td>
              </tr>;
            })}
            {appraisal.comments[section.id]?.trim() ? <tr className="border-t border-border"><td colSpan={4} className="px-4 py-3"><span className="mb-1 block text-[13px] font-semibold">Comments</span><span className="whitespace-pre-wrap text-muted-foreground">{appraisal.comments[section.id]}</span></td></tr> : null}
          </tbody>
        </table>
      </div>)}
      <dl className="m-0 grid gap-3 rounded-xl border border-border bg-muted/40 p-4 text-[14px] sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Job score total</dt><dd className="m-0 font-semibold">{score.jobTotal}</dd></div>
        <div><dt className="text-muted-foreground">Performance score total</dt><dd className="m-0 font-semibold">{score.performanceTotal}</dd></div>
        <div><dt className="text-muted-foreground">Overall score</dt><dd className="m-0 font-semibold">{formatOverall(score.overall)}</dd></div>
      </dl>
    </Block>

    <Block title="Part II: Qualitative summary">
      {QUALITATIVE_QUESTIONS.map((question, index) => <Answer key={question.id} label={`${index + 1}. ${question.label}`} value={appraisal.qualitative[question.id]} />)}
    </Block>

    <Block title="Part III: Employee response">
      {canRespond ? <>
        {RESPONSE_QUESTIONS.map((question, index) => <label key={question.id} className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">{index + 1}. {question.label}</span>
          <Textarea rows={4} value={response[question.id] ?? ""} onChange={(event) => setResponse((current) => ({ ...current, [question.id]: event.target.value }))} />
        </label>)}
        <div className="flex items-center gap-3">
          <button type="button" disabled={busy} onClick={() => void saveResponse()} className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Saving…" : "Save response"}</button>
          {message && <p className={`m-0 text-[13px] ${failed ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>}
        </div>
      </> : RESPONSE_QUESTIONS.map((question, index) => <Answer key={question.id} label={`${index + 1}. ${question.label}`} value={appraisal.response[question.id]} />)}
    </Block>

    <Block title="Sign-off">
      <dl className="m-0 grid gap-3 text-[14px] sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Appraisal discussed with employee</dt><dd className="m-0 font-semibold">{formatDocumentDate(appraisal.signoff.discussedOn)}</dd></div>
        <div><dt className="text-muted-foreground">Preparer’s signature</dt><dd className="m-0 font-semibold">{formatDocumentDate(appraisal.signoff.preparerDate)}</dd></div>
        <div><dt className="text-muted-foreground">Employee’s signature</dt><dd className="m-0 font-semibold">{formatDocumentDate(appraisal.signoff.employeeDate)}</dd></div>
        <div><dt className="text-muted-foreground">MD’s signature</dt><dd className="m-0 font-semibold">{formatDocumentDate(appraisal.signoff.mdDate)}</dd></div>
      </dl>
    </Block>
  </div>;
}
