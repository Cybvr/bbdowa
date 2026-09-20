"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { copyContent, deleteContent, renameContent, type ContentCollection } from "@/lib/firebase/content-mutations";

export function DashboardCard({
  children,
  actions,
  className = "",
}: {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <article className={`relative overflow-hidden rounded-xl border border-border bg-background ${className}`}>
      {children}
      {actions ? <div className="absolute right-3 top-3 z-10">{actions}</div> : null}
    </article>
  );
}

export function DashboardCardActions({
  collection,
  slug,
  titleField,
  title,
  onMutated,
  showCopy = true,
}: {
  collection: ContentCollection;
  slug: string;
  titleField: string;
  title: string;
  onMutated?: () => void | Promise<void>;
  showCopy?: boolean;
}) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [busy, setBusy] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState(title);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAdmin) return null;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      await onMutated?.();
      router.refresh();
    } catch (error) {
      console.error("Dashboard card action failed", error);
      setErrorMessage(error instanceof Error ? error.message : "That action could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const handleRenameOpen = () => {
    setRenameTitle(title);
    setRenameOpen(true);
  };

  const handleCopy = () => {
    void run(() => copyContent(collection, slug, titleField, title));
  };

  const handleRenameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTitle = renameTitle.trim();
    if (!nextTitle || nextTitle === title) {
      setRenameOpen(false);
      return;
    }

    setRenameOpen(false);
    void run(() => renameContent(collection, slug, titleField, nextTitle));
  };

  const handleDeleteConfirm = () => {
    setDeleteOpen(false);
    void run(() => deleteContent(collection, slug));
  };

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Card actions"
          disabled={busy}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-wait disabled:opacity-50"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem disabled={busy} onSelect={handleRenameOpen}><Pencil className="h-4 w-4" />Rename</DropdownMenuItem>
        {showCopy ? <DropdownMenuItem disabled={busy} onSelect={handleCopy}><Copy className="h-4 w-4" />Copy</DropdownMenuItem> : null}
        <DropdownMenuItem disabled={busy} variant="destructive" onSelect={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>

    <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename item</DialogTitle>
          <DialogDescription>Update the name shown on this card.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRenameSubmit} className="space-y-5">
          <Input
            autoFocus
            value={renameTitle}
            onChange={(event) => setRenameTitle(event.target.value)}
            aria-label="Item name"
            disabled={busy}
          />
          <DialogFooter>
            <button type="button" onClick={() => setRenameOpen(false)} className="h-9 rounded-md border border-border px-4 text-xs font-semibold text-foreground transition hover:border-foreground" disabled={busy}>Cancel</button>
            <button type="submit" className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || !renameTitle.trim()}>Save</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete item?</DialogTitle>
          <DialogDescription>“{title}” will be permanently deleted. This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button type="button" onClick={() => setDeleteOpen(false)} className="h-9 rounded-md border border-border px-4 text-xs font-semibold text-foreground transition hover:border-foreground" disabled={busy}>Cancel</button>
          <button type="button" onClick={handleDeleteConfirm} className="h-9 rounded-md bg-destructive px-4 text-xs font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy}>Delete</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={Boolean(errorMessage)} onOpenChange={(open) => { if (!open) setErrorMessage(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Action failed</DialogTitle>
          <DialogDescription>{errorMessage}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button type="button" onClick={() => setErrorMessage(null)} className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90">Close</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
