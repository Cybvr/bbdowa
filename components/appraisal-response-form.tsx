"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { Save, Send } from "lucide-react";
import { AppraisalStatus } from "@/components/appraisal-status";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  APPRAISAL_COLLECTION,
  APPRAISAL_SECTIONS,
  JOB_RELEVANCE_SCALE,
  PERFORMANCE_SCALE,
  QUALITATIVE_QUESTIONS,
  formatOverall,
  itemScore,
  overallLabel,
  scoreAppraisal,
  type Appraisal,
  type AppraisalRating,
} from "@/lib/appraisals";
import { firebaseDb } from "@/lib/firebase/client";

const LABEL_CLASS = "mb-1.5 block text-[13px] font-semibold";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className={LABEL_CLASS}>{label}</span>{children}</label>;
}

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-5"><h2 className="m-0 border-b border-border pb-2 text-[17px] font-bold">{title}</h2>{children}</section>;
}

export function AppraisalResponseForm({ appraisal }: { appraisal: Appraisal }) {
  const router = useRouter();
  const [ratings, setRatings] = React.useState<Record<string, AppraisalRating>>(appraisal.ratings);
  const [comments, setComments] = React.useState<Record<string, string>>(appraisal.comments);
  const [qualitative, setQualitative] = React.useState<Record<string, string>>(appraisal.qualitative);
  const [busy, setBusy] = React.useState<"save" | "submit" | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  const score = scoreAppraisal(ratings);

  const setRating = (itemId: string, key: keyof AppraisalRating, raw: string) => {
    setRatings((current) => ({
      ...current,
      [itemId]: {
        job: current[itemId]?.job ?? null,
        performance: current[itemId]?.performance ?? null,
        [key]: raw ? Number(raw) : null,
      },
    }));
  };

  const save = async (submit: boolean) => {
    if (busy) return;
    setBusy(submit ? "submit" : "save");
    setMessage(null);
    setFailed(false);
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(firebaseDb, APPRAISAL_COLLECTION, appraisal.id), {
        ratings,
        comments,
        qualitative,
        status: submit ? "submitted" : "assigned",
        submittedAt: submit ? now : "",
        updatedAt: now,
      });
      if (submit) {
        router.push("/dashboard/appraisals");
        router.refresh();
      } else {
        setMessage("Progress saved.");
      }
    } catch (cause) {
      console.error("Unable to save appraisal", cause);
      setFailed(true);
      setMessage(submit ? "Couldn’t submit your appraisal. Please try again." : "Couldn’t save your progress. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return <div className="space-y-8">
    <section className="space-y-3 border-b border-border pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-page-title font-bold leading-tight">{appraisal.period || "Performance appraisal"}</h1>
          <p className="mb-0 mt-1 text-[14px] text-muted-foreground">Assigned by {appraisal.createdByName || appraisal.preparerName || "BBDO West Africa"}</p>
        </div>
        <AppraisalStatus status={appraisal.status} />
      </div>
      {appraisal.message ? <p className="m-0 max-w-[70ch] whitespace-pre-wrap text-[14px] leading-relaxed">{appraisal.message}</p> : null}
    </section>

    <Part title="Part I: Rate your performance">
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
                  <Select value={rating?.job ? String(rating.job) : "__none__"} onValueChange={(selected) => setRating(item.id, "job", selected === "__none__" ? "" : selected)} disabled={Boolean(busy)}>
                    <SelectTrigger><SelectValue placeholder="Not applicable" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not applicable</SelectItem>
                      {JOB_RELEVANCE_SCALE.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.value} · {option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Performance">
                  <Select value={rating?.performance ? String(rating.performance) : "__none__"} onValueChange={(selected) => setRating(item.id, "performance", selected === "__none__" ? "" : selected)} disabled={Boolean(busy)}>
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
            <Field label="Comments"><Textarea rows={3} value={comments[section.id] ?? ""} onChange={(event) => setComments((current) => ({ ...current, [section.id]: event.target.value }))} disabled={Boolean(busy)} /></Field>
          </div>
        </div>;
      })}

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <h3 className="m-0 mb-3 text-[15px] font-semibold">Overall score</h3>
        <dl className="m-0 grid gap-3 text-[14px] sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Job score total</dt><dd className="m-0 font-semibold">{score.jobTotal}</dd></div>
          <div><dt className="text-muted-foreground">Performance score total</dt><dd className="m-0 font-semibold">{score.performanceTotal}</dd></div>
          <div><dt className="text-muted-foreground">Overall</dt><dd className="m-0 font-semibold">{formatOverall(score.overall)}{score.overall !== null ? ` · ${overallLabel(score.overall)}` : ""}</dd></div>
        </dl>
      </div>
    </Part>

    <Part title="Part II: Reflect on your work">
      {QUALITATIVE_QUESTIONS.map((question, index) => <Field key={question.id} label={`${index + 1}. ${question.label}`}>
        <Textarea rows={4} value={qualitative[question.id] ?? ""} onChange={(event) => setQualitative((current) => ({ ...current, [question.id]: event.target.value }))} disabled={Boolean(busy)} />
      </Field>)}
    </Part>

    <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-border bg-background py-4">
      <button type="button" disabled={Boolean(busy)} onClick={() => void save(false)} className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-[13px] font-semibold disabled:opacity-50">
        <Save className="h-4 w-4" aria-hidden="true" />{busy === "save" ? "Saving…" : "Save progress"}
      </button>
      <button type="button" disabled={Boolean(busy)} onClick={() => void save(true)} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground disabled:opacity-50">
        <Send className="h-4 w-4" aria-hidden="true" />{busy === "submit" ? "Submitting…" : "Submit appraisal"}
      </button>
      {message ? <p role={failed ? "alert" : "status"} className={`m-0 text-[13px] ${failed ? "text-destructive" : "text-muted-foreground"}`}>{message}</p> : null}
    </div>
  </div>;
}
