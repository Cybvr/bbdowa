"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Pending = { message: string; confirmLabel: string; resolve: (value: boolean) => void };

let open: ((message: string, confirmLabel?: string) => Promise<boolean>) | null = null;

/** Drop-in replacement for window.confirm that shows the site's own modal. Needs <ConfirmHost /> mounted once. */
export function confirmDialog(message: string, confirmLabel?: string): Promise<boolean> {
  if (!open) return Promise.resolve(window.confirm(message));
  return open(message, confirmLabel);
}

export function ConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    open = (message, confirmLabel) => new Promise<boolean>((resolve) => {
      setPending((current) => {
        current?.resolve(false);
        return { message, confirmLabel: confirmLabel ?? (/^(delete|remove)/i.test(message) ? message.split(/\s/)[0].replace(/^./, (c) => c.toUpperCase()) : "Confirm"), resolve };
      });
    });
    return () => { open = null; };
  }, []);

  const close = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  return (
    <Dialog open={Boolean(pending)} onOpenChange={(next) => { if (!next) close(false); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Are you sure?</DialogTitle>
          <DialogDescription className="text-base">{pending?.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <button type="button" onClick={() => close(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Cancel</button>
          <button type="button" onClick={() => close(true)} autoFocus className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">{pending?.confirmLabel}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
