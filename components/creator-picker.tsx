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
