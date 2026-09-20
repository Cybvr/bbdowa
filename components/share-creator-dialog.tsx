"use client";

import { useEffect, useState } from "react";
import { FaFacebookF, FaLinkedinIn, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { FiCheck, FiCopy, FiMail, FiShare2 } from "react-icons/fi";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ShareCreatorDialogProps = {
  creatorName: string;
  path: string;
  className?: string;
  showLabel?: boolean;
};

function absoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function ShareCreatorDialog({ creatorName, path, className, showLabel = false }: ShareCreatorDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nativeShareAvailable, setNativeShareAvailable] = useState(false);

  useEffect(() => {
    setNativeShareAvailable(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const url = absoluteUrl(path);
  const shareText = `${creatorName} — BBDO West Africa creator profile`;

  const handleCopy = async () => {
    try {
      await copyText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: shareText, text: shareText, url });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  };

  const stopPropagation = (event: { stopPropagation: () => void }) => event.stopPropagation();

  return (
    <>
      <button
        type="button"
        aria-label={`Share ${creatorName}`}
        title="Share"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className={className ?? "inline-flex h-9 items-center gap-2 rounded-lg bg-muted px-3 text-[13px] font-medium text-foreground transition hover:bg-muted/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"}
      >
        <FiShare2 aria-hidden="true" className="h-4 w-4" />
        {showLabel ? <span className="hidden nav:inline">Share</span> : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined} className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="pr-8 text-lg sm:text-xl">Share {creatorName}</DialogTitle>
            <DialogDescription>Send this creator profile to your team or share it externally.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleCopy}
              onPointerDown={stopPropagation}
              className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg bg-foreground px-3.5 py-2.5 text-left text-[13px] font-medium text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span className="flex min-w-0 items-center gap-2">
                {copied ? <FiCheck aria-hidden="true" className="h-4 w-4 flex-none" /> : <FiCopy aria-hidden="true" className="h-4 w-4 flex-none" />}
                <span>{copied ? "Link copied" : "Copy link"}</span>
              </span>
              <span className="max-w-[220px] truncate text-[11px] font-normal text-background/65">{url}</span>
            </button>

            {nativeShareAvailable ? (
              <button
                type="button"
                onClick={handleNativeShare}
                onPointerDown={stopPropagation}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-muted px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground transition hover:bg-muted/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <FiShare2 aria-hidden="true" className="h-4 w-4" />
                Share using device options
              </button>
            ) : null}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="flex min-h-11 items-center gap-2 rounded-lg bg-muted px-3 py-2 text-[13px] font-medium text-foreground no-underline transition hover:bg-muted/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <FaWhatsapp aria-hidden="true" className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="flex min-h-11 items-center gap-2 rounded-lg bg-muted px-3 py-2 text-[13px] font-medium text-foreground no-underline transition hover:bg-muted/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <FaLinkedinIn aria-hidden="true" className="h-4 w-4" />
                LinkedIn
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="flex min-h-11 items-center gap-2 rounded-lg bg-muted px-3 py-2 text-[13px] font-medium text-foreground no-underline transition hover:bg-muted/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <FaXTwitter aria-hidden="true" className="h-4 w-4" />
                X
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="flex min-h-11 items-center gap-2 rounded-lg bg-muted px-3 py-2 text-[13px] font-medium text-foreground no-underline transition hover:bg-muted/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <FaFacebookF aria-hidden="true" className="h-4 w-4" />
                Facebook
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`}
                onClick={(event) => event.stopPropagation()}
                className="flex min-h-11 items-center gap-2 rounded-lg bg-muted px-3 py-2 text-[13px] font-medium text-foreground no-underline transition hover:bg-muted/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <FiMail aria-hidden="true" className="h-4 w-4" />
                Email
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
