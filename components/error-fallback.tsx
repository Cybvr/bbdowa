"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Shown in place of a page that crashed, so people get a way back instead of a blank screen. */
export function ErrorFallback({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
      <section className="border-t border-border py-16 sm:py-24">
        <h1 className="mb-4 mt-0 max-w-[16ch] text-[32px] font-bold leading-tight tracking-tight sm:text-[44px]">
          Something went wrong
        </h1>
        <p className="mb-5 mt-0 max-w-[52ch] text-[16px] leading-[1.5] text-muted-foreground">
          This page couldn’t load. Try again, or go back home.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="text-[14px] font-semibold text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary"
          >
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
