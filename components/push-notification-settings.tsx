"use client";

import * as React from "react";
import { BellRing } from "lucide-react";
import { currentPushState, disablePush, enablePush, type PushSupport } from "@/lib/push/client";

const COPY: Record<PushSupport, { title: string; body: string }> = {
  enabled: { title: "Browser notifications are on", body: "This device can show message alerts and reminders, even when Bantaba is not open." },
  disabled: { title: "Browser notifications are off", body: "Turn them on for message alerts and reminders on this device." },
  blocked: { title: "Notifications are blocked", body: "Allow notifications for this site in your browser settings, then reload this page." },
  unsupported: { title: "Notifications are not supported", body: "This browser cannot receive web push notifications. Email and in-app notifications still work." },
  unconfigured: { title: "Push needs setup", body: "Email and in-app notifications work, but the site administrator still needs to add the web push keys." },
};

export function PushNotificationSettings({ uid }: { uid: string }) {
  const [state, setState] = React.useState<PushSupport | "loading">("loading");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void currentPushState(uid)
      .then((next) => { if (active) setState(next); })
      .catch(() => { if (active) { setState("disabled"); setError("Couldn’t check notifications on this device. Reload and try again."); } });
    return () => { active = false; };
  }, [uid]);

  const toggle = async () => {
    if (state === "loading" || state === "blocked" || state === "unsupported" || state === "unconfigured" || busy) return;
    setBusy(true);
    setError(null);
    try {
      setState(state === "enabled" ? await disablePush(uid) : await enablePush(uid));
    } catch (cause) {
      console.error("Unable to change browser notifications", cause);
      setError("Couldn’t change notifications. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const copy = state === "loading"
    ? { title: "Checking browser notifications…", body: "This only takes a moment." }
    : COPY[state];
  const canToggle = state === "enabled" || state === "disabled";

  return (
    <div className="flex items-start gap-3 border-t border-border pt-5">
      <span aria-hidden="true" className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <BellRing className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="m-0 text-[13px] font-semibold">{copy.title}</h3>
            <p className="m-0 mt-1 max-w-[62ch] text-[13px] leading-5 text-muted-foreground">{copy.body}</p>
          </div>
          {canToggle ? (
            <button
              type="button"
              onClick={() => void toggle()}
              disabled={busy}
              className={`h-9 shrink-0 rounded-md px-3 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 ${state === "enabled" ? "border border-border text-foreground hover:bg-muted" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
            >
              {busy ? "Saving…" : state === "enabled" ? "Turn off" : "Turn on"}
            </button>
          ) : null}
        </div>
        {error ? <p role="alert" className="m-0 mt-2 text-[13px] text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
