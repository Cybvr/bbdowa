"use client";

import * as React from "react";
import { X } from "lucide-react";

/** Type a tag and press Enter (or comma) to add it as a chip. Backspace on an empty box removes the last one. */
export function TagInput({
  label,
  value,
  onChange,
  placeholder = "Type and press Enter",
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = React.useState("");
  const id = React.useId();

  const add = (raw: string) => {
    const tags = raw.split(",").map((tag) => tag.trim()).filter(Boolean);
    const next = [...value];
    tags.forEach((tag) => {
      if (!next.some((existing) => existing.toLowerCase() === tag.toLowerCase())) next.push(tag);
    });
    if (next.length !== value.length) onChange(next);
    setDraft("");
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] text-muted-foreground">{label}</label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40">
        {value.map((tag) => (
          <span key={tag} className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted py-0.5 pl-2.5 pr-1 text-[12px] font-medium text-foreground">
            <span className="truncate">{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(value.filter((existing) => existing !== tag))}
              className="grid h-4 w-4 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
            >
              <X aria-hidden="true" className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => {
            const next = event.target.value;
            if (next.includes(",")) add(next);
            else setDraft(next);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (draft.trim()) add(draft);
            } else if (event.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => { if (draft.trim()) add(draft); }}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
