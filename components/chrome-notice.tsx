"use client";

import { useEffect, useState } from "react";

/** Stands in for a page while the account is checked or redirected, so people never see a blank screen. */
export function ChromeNotice({ message, email, onSignOut }: { message: string; email?: string | null; onSignOut?: () => void | Promise<void> }) {
  // Only offer the way out if this screen hangs around.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="m-0 text-sm text-muted-foreground">{message}</p>
        {slow ? <>
          {email ? <p className="m-0 mt-3 text-sm">Signed in as <span className="font-semibold">{email}</span></p> : null}
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => window.location.reload()} className="h-9 rounded-md border border-border px-4 text-sm font-semibold hover:border-foreground">Reload</button>
            {onSignOut ? <button type="button" onClick={() => void onSignOut()} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">Use another account</button> : null}
          </div>
        </> : null}
      </div>
    </main>
  );
}
