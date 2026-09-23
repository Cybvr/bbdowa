"use client";

import { Check } from "lucide-react";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

/** Searchable creator list for share dialogs; picks one creator by key. */
export function CreatorPicker({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Command className="rounded-md border border-border">
      <CommandInput placeholder="Search creators" autoFocus />
      <CommandList className="max-h-64">
        <CommandEmpty>No creators found.</CommandEmpty>
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
