"use client";

import { Check } from "lucide-react";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

/** Searchable single-select list; picks one option by key. */
export function CreatorPicker({
  options,
  value,
  onChange,
  placeholder = "Search creators",
  emptyText = "No creators found.",
  autoFocus = true,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  autoFocus?: boolean;
}) {
  return (
    <Command className="rounded-md border border-border">
      <CommandInput placeholder={placeholder} autoFocus={autoFocus} />
      <CommandList className="max-h-64">
        <CommandEmpty>{emptyText}</CommandEmpty>
        {options.map((option) => (
          <CommandItem key={option.value} value={`${option.label} ${option.value}`} onSelect={() => onChange(option.value)}>
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {option.value === value ? <Check aria-hidden="true" className="h-4 w-4 text-primary" /> : null}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}

/** Searchable multi-select list. Selected people show as removable chips above the list. */
export function CreatorMultiPicker({
  options,
  values,
  onChange,
  placeholder = "Search people",
  emptyText = "No people found.",
  autoFocus = false,
  disabled = false,
}: {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const toggle = (value: string) => onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  const selected = values.map((value) => ({ value, label: options.find((option) => option.value === value)?.label ?? value }));
  return (
    <div className={`space-y-2 ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      {selected.length ? (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {selected.map((item) => (
            <li key={item.value}>
              <button type="button" onClick={() => toggle(item.value)} aria-label={`Remove ${item.label}`} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[13px] font-medium text-foreground transition hover:bg-muted-foreground/20">
                {item.label}
                <span aria-hidden="true" className="text-muted-foreground">×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Command className="rounded-md border border-border">
        <CommandInput placeholder={placeholder} autoFocus={autoFocus} />
        <CommandList className="max-h-52">
          <CommandEmpty>{emptyText}</CommandEmpty>
          {options.map((option) => (
            <CommandItem key={option.value} value={`${option.label} ${option.value}`} onSelect={() => toggle(option.value)}>
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {values.includes(option.value) ? <Check aria-hidden="true" className="h-4 w-4 text-primary" /> : null}
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </div>
  );
}
