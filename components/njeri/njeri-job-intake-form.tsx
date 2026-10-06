"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JOB_INTAKE_FIELDS, type JobIntakeAnswers, type JobIntakeForm } from "@/lib/njeri-job-form";

export function NjeriJobIntakeForm({
  form,
  id,
  submitted,
  disabled,
  onSubmit,
}: {
  form: JobIntakeForm;
  id: string;
  submitted?: boolean;
  disabled?: boolean;
  onSubmit: (answers: JobIntakeAnswers) => void;
}) {
  const [answers, setAnswers] = React.useState<JobIntakeAnswers>({});

  if (submitted) return <p className="m-0 mt-3 text-xs text-muted-foreground">Details submitted in this chat.</p>;

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(answers); }} className="mt-4 grid gap-4 border-t border-border pt-4 text-foreground">
      {form.fields.map((field) => {
        const config = JOB_INTAKE_FIELDS[field];
        return (
          <div key={field} className="grid gap-1.5">
            <label htmlFor={`njeri-job-${id}-${field}`} className="text-xs font-medium">{config.label}</label>
            {config.type === "select" ? (
              <Select value={answers[field] || ""} onValueChange={(value) => setAnswers((current) => ({ ...current, [field]: value }))} disabled={disabled}>
                <SelectTrigger id={`njeri-job-${id}-${field}`}><SelectValue placeholder="Choose if known" /></SelectTrigger>
                <SelectContent>
                  {config.options.map((option) => <SelectItem key={option} value={option}>{option === "onsite" ? "On-site" : option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`njeri-job-${id}-${field}`}
                type={config.type}
                value={answers[field] || ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [field]: event.target.value }))}
                placeholder={"placeholder" in config ? config.placeholder : undefined}
                maxLength={field === "title" ? 140 : 100}
                disabled={disabled}
              />
            )}
          </div>
        );
      })}
      <button type="submit" disabled={disabled} className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">Submit</button>
    </form>
  );
}
