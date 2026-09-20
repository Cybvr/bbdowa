"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";

/**
 * Shared editing kit for the dashboard detail pages. Each entity page renders
 * its own <EditSheet> with the fields that matter for that record; this file
 * holds the pieces they have in common — the admin-only trigger button, the
 * slide-over shell with Save / Delete, and labelled field inputs.
 *
 * Editing is admin-only (mirrors the Firestore rules), so nothing here renders
 * for a signed-out or non-admin viewer.
 */

const LABEL = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className={LABEL}>{label}</span>
      {children}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <Field label={label}>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </Field>
  );
}

export function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} placeholder={placeholder} />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/**
 * The edit button + slide-over shell. Callers own the field state and pass
 * `onSave` / `onDelete`; this component owns busy + error state and the layout.
 * Renders nothing unless the viewer is an admin.
 */
export function EditSheet({
  title,
  description,
  triggerLabel = "Edit",
  deleteLabel = "Delete",
  deleteConfirm = "Delete this record? This can’t be undone.",
  onSave,
  onDelete,
  trigger,
  children,
}: {
  title: string;
  description?: string;
  triggerLabel?: string;
  deleteLabel?: string;
  deleteConfirm?: string;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  trigger?: (open: () => void, remove: () => void) => React.ReactNode;
  children: React.ReactNode;
}) {
  const { isAdmin } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<null | "save" | "delete">(null);
  const [error, setError] = React.useState<string | null>(null);

  if (!isAdmin) return null;

  const save = async () => {
    setBusy("save");
    setError(null);
    try {
      await onSave();
      setOpen(false);
    } catch (cause) {
      console.error("Unable to save", cause);
      setError("Couldn’t save that. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm(deleteConfirm)) return;
    setBusy("delete");
    setError(null);
    try {
      await onDelete();
      setOpen(false);
    } catch (cause) {
      console.error("Unable to delete", cause);
      setError("Couldn’t delete that. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const triggerContent = trigger ? (
    trigger(() => setOpen(true), () => void remove())
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[13px] font-semibold text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
      {triggerLabel}
    </button>
  );

  return (
    <>
      {triggerContent}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[min(520px,94vw)] bg-background text-foreground sm:max-w-none">
          <SheetHeader className="border-b border-border pr-10">
            <SheetTitle className="text-[17px]">{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            {error ? (
              <p className="mb-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-[13px] text-primary">{error}</p>
            ) : null}
            <div className="space-y-4 pb-4">{children}</div>
          </div>

          <SheetFooter className="border-t border-border">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => void remove()}
                disabled={busy !== null}
                className="text-[13px] font-semibold text-primary transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "delete" ? "Deleting…" : deleteLabel}
              </button>
              <div className="flex items-center gap-2">
                <SheetClose asChild>
                  <button
                    type="button"
                    disabled={busy !== null}
                    className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-[13px] font-semibold text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </SheetClose>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={busy !== null}
                  className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "save" ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
