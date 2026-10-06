"use client";

import * as React from "react";
import { Pencil, Upload } from "lucide-react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
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
import { firebaseStorage } from "@/lib/firebase/client";

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

export class FormValidationError extends Error {}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className={LABEL}>{label}</span>
      {children}
    </div>
  );
}

export function ImageUploadField({
  label,
  value,
  onChange,
  variant = "cover",
  hideLabel = false,
  compact = false,
  disabled = false,
  accept = "image/*",
  uploadPath = "dashboard/images",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  variant?: "avatar" | "cover";
  hideLabel?: boolean;
  compact?: boolean;
  disabled?: boolean;
  accept?: string;
  /** Storage prefix for the uploaded file. Pass null to keep a local data URI. */
  uploadPath?: string | null;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);

  const readImage = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Choose an image smaller than 8 MB.");
      return;
    }

    setError(null);

    try {
      const sourceUrl = URL.createObjectURL(file);
      try {
        const image = new Image();
        image.decoding = "async";
        image.src = sourceUrl;
        await image.decode();

        const maxDimension = variant === "avatar" ? 512 : 1200;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Keep avatars comfortably below Firestore's document-size limit while
        // preserving enough detail for the directory and profile pages.
        let optimized = canvas.toDataURL("image/webp", 0.82);
        if (optimized.length > 240_000) optimized = canvas.toDataURL("image/jpeg", 0.72);
        if (optimized.length > 300_000) throw new Error("Image could not be compressed enough");

        setPreview(optimized);
        if (!uploadPath) {
          onChange(optimized);
          setPreview(null);
          setError(null);
          return;
        }

        setUploading(true);
        const uploadId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const imageBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/webp", 0.82);
        });
        if (!imageBlob) throw new Error("Unable to create image file");

        const uploaded = await uploadBytes(
          ref(firebaseStorage, `${uploadPath}/${uploadId}.webp`),
          imageBlob,
          { contentType: "image/webp", cacheControl: "public,max-age=31536000" },
        );
        onChange(await getDownloadURL(uploaded.ref));
        setPreview(null);
        setError(null);
      } finally {
        URL.revokeObjectURL(sourceUrl);
      }
    } catch (cause) {
      console.error("Unable to process image", cause);
      setError("Couldn’t process that image. Try another file.");
    } finally {
      setUploading(false);
    }
  };

  const isDisabled = disabled || uploading;
  const displayedImage = preview || value;
  const uploadControl = (
    <>
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={compact ? "Change avatar" : undefined}
        aria-disabled={isDisabled}
        aria-busy={uploading}
        onClick={() => {
          if (!isDisabled) inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (!isDisabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDisabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!isDisabled) void readImage(event.dataTransfer.files[0]);
        }}
        className={`relative cursor-pointer overflow-hidden border border-dashed transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${compact ? "h-24 w-24 rounded-full p-0" : variant === "avatar" ? "rounded-xl p-3" : "rounded-lg p-3"} ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-foreground/50"} ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={isDisabled}
          onChange={(event) => {
            void readImage(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
          className="sr-only"
        />
        {displayedImage ? (
          compact ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={displayedImage} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className={`flex items-center gap-3 ${variant === "avatar" ? "" : "min-h-28"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayedImage}
                alt=""
                className={variant === "avatar" ? "h-20 w-20 rounded-full object-cover" : "h-28 w-40 rounded-md object-cover"}
              />
              <div className="min-w-0">
                <p className="m-0 text-[13px] font-semibold text-foreground">{uploading ? "Uploading image…" : "Replace image"}</p>
                <p className="m-0 mt-1 text-xs text-muted-foreground">{uploading ? "Saving to Firebase Storage." : "Select a new image or drop one here."}</p>
              </div>
            </div>
          )
        ) : compact ? (
          <div className="grid h-full w-full place-items-center bg-muted text-primary">
            <Upload aria-hidden="true" className="h-5 w-5" />
          </div>
        ) : (
          <div className="flex min-h-24 flex-col items-center justify-center gap-2 text-center">
            <Upload aria-hidden="true" className="h-5 w-5 text-primary" />
            <p className="m-0 text-[13px] font-semibold text-foreground">Select or drop an image</p>
            <p className="m-0 text-xs text-muted-foreground">PNG, JPG, GIF or WebP · optimized automatically</p>
          </div>
        )}
      </div>
      {error ? <p className="m-0 text-xs font-medium text-destructive">{error}</p> : null}
    </>
  );

  return hideLabel ? uploadControl : <Field label={label}>{uploadControl}</Field>;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  id,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <Field label={label}>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} />
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
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const uniqueOptions = options.filter((option, index) => options.findIndex((candidate) => candidate.value === option.value) === index);

  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {uniqueOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

const ADD_NEW_OPTION = "__add_new__";

/**
 * Like SelectField, but the last option lets the admin type a value that
 * isn't in the list yet — for fields like creator category that grow over
 * time instead of staying a fixed enum.
 */
export function CreatableSelectField({
  label,
  value,
  onChange,
  options,
  addLabel = "Add new…",
  placeholder = "Type a new value",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  addLabel?: string;
  placeholder?: string;
}) {
  const [customMode, setCustomMode] = React.useState(false);
  const knownOptions = Array.from(new Set(value && !options.includes(value) ? [value, ...options] : options));

  if (customMode) {
    return (
      <Field label={label}>
        <div className="flex items-center gap-2">
          <Input autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
          {options.length ? (
            <button
              type="button"
              onClick={() => setCustomMode(false)}
              className="shrink-0 text-[12px] font-semibold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
            >
              Choose existing
            </button>
          ) : null}
        </div>
      </Field>
    );
  }

  return (
    <Field label={label}>
      <Select
        value={value || undefined}
        onValueChange={(next) => {
          if (next === ADD_NEW_OPTION) {
            onChange("");
            setCustomMode(true);
            return;
          }
          onChange(next);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {knownOptions.map((option, index) => (
            <SelectItem key={`known-option-${index}`} value={option}>
              {option}
            </SelectItem>
          ))}
          <SelectItem value={ADD_NEW_OPTION}>+ {addLabel}</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

/**
 * The edit button + slide-over shell. Callers own the field state and pass
 * `onSave` / `onDelete`; this component owns busy + error state and the layout.
 * Renders nothing unless the caller grants edit permission or the viewer is an admin.
 */
export function EditSheet({
  title,
  description,
  triggerLabel = "Edit",
  deleteLabel = "Delete",
  deleteConfirm = "Delete this record? This can’t be undone.",
  onSave,
  onDelete,
  canEdit,
  trigger,
  children,
}: {
  title: string;
  description?: string;
  triggerLabel?: string;
  deleteLabel?: string;
  deleteConfirm?: string;
  onSave: () => Promise<void>;
  onDelete?: () => Promise<void>;
  canEdit?: boolean;
  trigger?: (open: () => void, remove: () => void) => React.ReactNode;
  children: React.ReactNode;
}) {
  const { isAdmin } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<null | "save" | "delete">(null);
  const [error, setError] = React.useState<string | null>(null);

  if (!(canEdit ?? isAdmin)) return null;

  const save = async () => {
    setBusy("save");
    setError(null);
    try {
      await onSave();
      setOpen(false);
    } catch (cause) {
      if (cause instanceof FormValidationError) {
        setError(cause.message);
      } else {
        console.error("Unable to save", cause);
        setError("Couldn’t save that. Try again.");
      }
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
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
      <span className="hidden nav:inline">{triggerLabel}</span>
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
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={busy !== null}
                  className="text-[13px] font-semibold text-primary transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "delete" ? "Deleting…" : deleteLabel}
                </button>
              ) : <span />}
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
