"use client";

import { useEffect, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiFileText, FiRotateCcw } from "react-icons/fi";

type Question = { prompt: string; options: string[] };

type Applicant = {
  name: string;
  email: string;
  resume: File | null;
};

const QUESTIONS: Question[] = [
  { prompt: "Would you rather receive a clear brief or have the freedom to figure things out?", options: ["A clear brief", "Freedom to figure it out"] },
  { prompt: "Would you rather inherit a messy project or start from scratch?", options: ["Inherit a messy project", "Start from scratch"] },
  { prompt: "Would you rather work on five quick projects or spend longer on one project?", options: ["Five quick projects", "One project deeply"] },
  { prompt: "When do you prefer to receive feedback: while you're working or after you've developed the idea properly?", options: ["While working", "Once it's developed"] },
  { prompt: "You've been stuck for 30 minutes. What would you usually do next?", options: ["Stay with it a little longer", "Ask someone to look at it"] },
  { prompt: "A deadline moves forward by two days. How would you be more likely to respond?", options: ["Reduce the scope", "Rework my time and work longer"] },
  { prompt: "A client gives you vague feedback. What would you be more likely to do?", options: ["Ask a follow-up question", "Make a reasonable interpretation and continue"] },
  { prompt: "A senior person suggests an idea you don't think will work. What would you most likely do?", options: ["Say what concerns me", "Think it through before responding", "Try it their way first"] },
  { prompt: "Would you rather receive very direct criticism or criticism that's carefully explained?", options: ["Very direct", "Carefully explained"] },
  { prompt: "Your manager says, ‘I don't like it,’ but can't explain why. What would your instinctive reaction be?", options: ["Ask them to point to the issue", "Revise based on my best read", "Keep going and note it for next time"] },
  { prompt: "You disagree with the team, but you're outvoted. What would you usually need before committing to their direction?", options: ["I can commit once the decision is made", "I need a little time to reset", "I keep looking for a chance to revisit it"] },
  { prompt: "When a teammate's idea beats yours, which reaction sounds more like you?", options: ["I can get behind it once I understand the thinking", "I need a moment to let go of my version"] },
  { prompt: "Which would you rather have: a great idea with average execution, or an average idea executed excellently?", options: ["A great idea", "Excellent execution"] },
  { prompt: "Would you rather present three concepts or one concept you strongly believe in?", options: ["Three concepts", "One strong concept"] },
  { prompt: "The client loves the work, but you don't. What would you be more likely to do?", options: ["Ship it and learn from it", "Ask for one more push before shipping"] },
  { prompt: "A campaign performs well, but you think the creative is mediocre. How would you describe the project?", options: ["The result makes it successful", "The result doesn't make up for weak creative"] },
  { prompt: "A beautiful campaign gets poor results. How would you describe it?", options: ["A creative success with a business problem", "A business failure despite its craft"] },
  { prompt: "A project is 90% there. What would you be more likely to do?", options: ["Keep polishing until it feels right", "Ship it and improve on the next round"] },
  { prompt: "Which would bother you more: missing a deadline or submitting work you don't think is good enough?", options: ["Missing a deadline", "Submitting work I don't believe in"] },
  { prompt: "Would you rather work with a difficult client on interesting work or an easy client on boring work?", options: ["Difficult client, interesting work", "Easy client, boring work"] },
  { prompt: "You've finished your work early. What would you be most likely to do next?", options: ["Keep improving the work", "See who needs help", "Look for the next priority", "Take the time back"] },
  { prompt: "Would you rather take on more responsibility with some chaos or have clearly defined responsibility with stability?", options: ["Some chaos", "Clear stability"] },
  { prompt: "Would you rather be known as reliable or brilliant?", options: ["Reliable", "Brilliant"] },
  { prompt: "Would you rather become exceptionally good at your current discipline or take responsibility across disciplines?", options: ["Go deeper", "Go wider"] },
  { prompt: "In 18 months, what would feel more like progress to you?", options: ["Being much better at the work, with the same title", "Having a better title, while still growing into the work"] },
];

const APPLICATION_FIELDS = ["Name", "Email", "Resume"] as const;
const TOTAL_STEPS = APPLICATION_FIELDS.length + QUESTIONS.length;
const OPTION = "group flex min-h-[72px] cursor-pointer items-center justify-between gap-4 border border-border px-5 py-4 text-left text-[17px] leading-[1.25] transition-colors hover:border-foreground hover:bg-foreground hover:text-white focus-visible:outline-none";
const FIELD = "min-h-[50px] w-full border border-border bg-transparent px-4 py-3 text-[16px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus-visible:outline-none";
const LABEL = "font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground";

function readStepFromUrl(): number {
  if (typeof window === "undefined") return 0;
  const step = Number(new URLSearchParams(window.location.search).get("step"));
  return Number.isInteger(step) && step >= 0 && step <= TOTAL_STEPS ? step : 0;
}

export function WorkStyleForm() {
  const [step, setStep] = useState(readStepFromUrl);
  const [applicant, setApplicant] = useState<Applicant>({ name: "", email: "", resume: null });
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const isComplete = step === TOTAL_STEPS;
  const isApplicantField = step < APPLICATION_FIELDS.length;
  const questionIndex = step - APPLICATION_FIELDS.length;
  const question = !isApplicantField && questionIndex < QUESTIONS.length ? QUESTIONS[questionIndex] : null;
  const selected = question ? answers[questionIndex] : undefined;
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant.email.trim());
  const canContinue = step === 0 ? Boolean(applicant.name.trim()) : step === 1 ? emailIsValid : step === 2 ? Boolean(applicant.resume) : Boolean(selected);
  const progress = isComplete ? 100 : (step / TOTAL_STEPS) * 100;

  useEffect(() => {
    const syncStep = () => setStep(readStepFromUrl());
    window.addEventListener("popstate", syncStep);
    return () => window.removeEventListener("popstate", syncStep);
  }, []);

  const navigateToStep = (nextStep: number, replace = false) => {
    const url = new URL(window.location.href);
    if (nextStep === 0) url.searchParams.delete("step");
    else url.searchParams.set("step", String(nextStep));
    const historyState = { ...window.history.state, applicationStep: nextStep };
    if (replace) window.history.replaceState(historyState, "", `${url.pathname}${url.search}${url.hash}`);
    else window.history.pushState(historyState, "", `${url.pathname}${url.search}${url.hash}`);
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    if (canContinue) navigateToStep(Math.min(TOTAL_STEPS, step + 1));
  };

  const choose = (option: string) => {
    setAnswers((existing) => ({ ...existing, [questionIndex]: option }));
  };

  const restart = () => {
    setApplicant({ name: "", email: "", resume: null });
    setAnswers({});
    navigateToStep(0, true);
  };

  if (isComplete) {
    return (
      <section className="min-h-[520px]">
        <div className="flex max-w-[900px] flex-col justify-center gap-8 p-[clamp(24px,6vw,88px)]">
          <div><span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Application complete</span><h2 className="mb-0 mt-3 max-w-[22ch] text-[clamp(26px,3vw,38px)] leading-[1.08] tracking-[-0.02em]">Thanks{applicant.name ? `, ${applicant.name.split(" ")[0]}.` : " for applying."}</h2></div>
          <p className="mb-0 max-w-[48ch] text-[17px] leading-[1.45] text-muted-foreground">We’ve got your details and your responses. Our team will review your application and get in touch if there’s a fit.</p>
          <button type="button" onClick={restart} className="inline-flex min-h-[48px] w-fit cursor-pointer items-center gap-2 border-2 border-foreground bg-transparent px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-foreground hover:text-white focus-visible:outline-none"><FiRotateCcw aria-hidden="true" className="h-4 w-4" />Start again</button>
        </div>
      </section>
    );
  }

  return (
    <>
      {step === 0 ? (
        <div className="mx-auto mb-[clamp(34px,5vw,60px)] mt-8 max-w-[760px] text-center">
          <h1 className="m-0 text-[clamp(26px,3vw,38px)] leading-[1.08] tracking-[-0.02em]">Apply</h1>
          <p className="mx-auto mb-0 mt-5 max-w-[52ch] text-[clamp(17px,2vw,23px)] leading-[1.35] text-muted-foreground">
            Start with your details, then give us a quick read on how you work.
          </p>
        </div>
      ) : null}
      <section aria-label="Job application">
        <div className="mx-auto h-1.5 max-w-[1100px] bg-border" aria-hidden="true"><div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
        <div className="mx-auto flex min-h-[580px] w-full max-w-[1100px] flex-col justify-between gap-10 p-[clamp(24px,6vw,88px)]">
        <div>
          <span className="block text-center font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Step {step + 1} of {TOTAL_STEPS}</span>
          {isApplicantField ? (
            <>
              <h1 className="mx-auto mb-0 mt-5 max-w-[28ch] text-center text-[clamp(24px,3vw,38px)] leading-[1.08] tracking-[-0.02em]">{step === 0 ? "What should we call you?" : step === 1 ? "Where can we reach you?" : "Add your resume."}</h1>
              <div className="mx-auto mt-10 w-full max-w-[760px]">
                {step === 0 ? <label className="grid gap-2"><span className={LABEL}>Name</span><input autoFocus required autoComplete="name" value={applicant.name} onChange={(event) => setApplicant((value) => ({ ...value, name: event.target.value }))} placeholder="Your name" className={FIELD} /></label> : null}
                {step === 1 ? <label className="grid gap-2"><span className={LABEL}>Email</span><input autoFocus required type="email" autoComplete="email" value={applicant.email} onChange={(event) => setApplicant((value) => ({ ...value, email: event.target.value }))} placeholder="you@email.com" className={FIELD} /></label> : null}
                {step === 2 ? <label htmlFor="resume-upload" className="grid cursor-pointer gap-2"><span className={LABEL}>Resume</span><span className={`${FIELD} flex items-center gap-3`}><FiFileText aria-hidden="true" className="h-5 w-5 flex-none text-primary" /><span className="min-w-0 flex-1 truncate text-muted-foreground">{applicant.resume?.name ?? "Add a PDF or Word document"}</span><span className="flex-none border border-foreground px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-foreground">Browse</span></span><input id="resume-upload" required type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setApplicant((value) => ({ ...value, resume: event.target.files?.[0] ?? null }))} className="sr-only" /></label> : null}
              </div>
            </>
          ) : (
            <h1 className="mx-auto mb-0 mt-4 max-w-[34ch] text-center text-[clamp(24px,3vw,40px)] leading-[1.1] tracking-[-0.02em]">{question?.prompt}</h1>
          )}
        </div>

        {!isApplicantField && question ? <div className="grid max-w-[1100px] gap-3" role="radiogroup" aria-label={question.prompt}>{question.options.map((option) => { const isSelected = selected === option; return <button key={option} type="button" role="radio" aria-checked={isSelected} onClick={() => choose(option)} className={`${OPTION} ${isSelected ? "border-primary bg-primary text-white" : ""}`}><span>{option}</span><span aria-hidden="true" className={`grid h-5 w-5 flex-none place-items-center rounded-full border ${isSelected ? "border-white" : "border-foreground/40 group-hover:border-white"}`}><span className={`h-2 w-2 rounded-full ${isSelected ? "bg-white" : "bg-transparent"}`} /></span></button>; })}</div> : null}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5"><button type="button" onClick={() => navigateToStep(Math.max(0, step - 1))} disabled={step === 0} className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 border-2 border-border bg-transparent px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none"><FiArrowLeft aria-hidden="true" />Back</button><button type="button" onClick={next} disabled={!canContinue} className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 bg-foreground px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-primary disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none">{step < APPLICATION_FIELDS.length ? "Continue" : step === TOTAL_STEPS - 1 ? "Finish" : "Next"}<FiArrowRight aria-hidden="true" /></button></div>
        </div>
      </section>
    </>
  );
}
