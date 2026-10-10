"use client";

import * as React from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/ui";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { firebaseDb } from "@/lib/firebase/client";
import {
  DIGESTS,
  INSTANT_EMAILS,
  NOTIFICATION_SETTINGS_DOC,
  SECTIONS,
  withDefaults,
  type Channels,
  type DigestKey,
  type NotificationSettings,
} from "@/lib/notifications";

function Switch({ checked, label, onChange }: { checked: boolean; label: string; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-background shadow transition ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const { role, loading: authLoading } = useAuth();
  const [settings, setSettings] = React.useState<NotificationSettings | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const isAdmin = role === "admin";

  React.useEffect(() => {
    if (authLoading || !isAdmin) return;
    getDoc(doc(firebaseDb, NOTIFICATION_SETTINGS_DOC.collection, NOTIFICATION_SETTINGS_DOC.id))
      .then((snapshot) => setSettings(withDefaults(snapshot.exists() ? snapshot.data() as Partial<NotificationSettings> : null)))
      .catch((cause) => {
        console.error("Unable to load notification settings", cause);
        setSettings(withDefaults(null));
        setMessage({ tone: "error", text: "Couldn’t load saved settings. Showing defaults." });
      });
  }, [authLoading, isAdmin]);

  if (authLoading || (isAdmin && !settings)) return <UsersTableSkeleton />;
  if (!isAdmin || !settings) return <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-8 sm:px-8"><PageHeader title="Notifications" /><p className="mt-8 text-sm text-muted-foreground">Only admins can change notification settings.</p></main>;

  const setChannel = (key: DigestKey, channel: keyof Channels, value: boolean) => {
    setMessage(null);
    setSettings({ ...settings, digests: { ...settings.digests, [key]: { ...settings.digests[key], [channel]: value } } });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(firebaseDb, NOTIFICATION_SETTINGS_DOC.collection, NOTIFICATION_SETTINGS_DOC.id), { ...settings, updatedAt: new Date().toISOString() });
      setMessage({ tone: "ok", text: "Saved." });
    } catch (cause) {
      console.error("Unable to save notification settings", cause);
      setMessage({ tone: "error", text: "Couldn’t save. Try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-2 sm:px-8">
      <PageHeader title="Notifications" />
      <p className="mt-2 text-sm text-muted-foreground">People get one summary a week and one a month, plus instant emails only for things they need to act on. Times are Lagos time.</p>

      <section aria-labelledby="summaries" className="mt-6">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-2">
          <h2 id="summaries" className="m-0 text-[15px] font-semibold">Summaries</h2>
          <div className="flex gap-4 text-[12px] font-medium text-muted-foreground">
            <span className="w-9 text-center">In-app</span>
            <span className="w-9 text-center">Email</span>
          </div>
        </div>
        <ul className="m-0 list-none divide-y divide-border p-0">
          {DIGESTS.map((digest) => (
            <li key={digest.key} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="m-0 text-[14px] font-semibold">{digest.label}</p>
                <p className="m-0 mt-0.5 text-[13px] text-muted-foreground">{digest.description}</p>
              </div>
              <div className="flex shrink-0 gap-4">
                <Switch checked={settings.digests[digest.key].inApp} label={`${digest.label} in-app`} onChange={(value) => setChannel(digest.key, "inApp", value)} />
                <Switch checked={settings.digests[digest.key].email} label={`${digest.label} email`} onChange={(value) => setChannel(digest.key, "email", value)} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sections" className="mt-8">
        <h2 id="sections" className="m-0 border-b border-border pb-2 text-[15px] font-semibold">What summaries cover</h2>
        <ul className="m-0 list-none divide-y divide-border p-0">
          {SECTIONS.map((section) => (
            <li key={section.key} className="flex items-center justify-between gap-4 py-3">
              <p className="m-0 text-[14px] font-semibold">{section.label}</p>
              <Switch
                checked={settings.sections[section.key]}
                label={`Include ${section.label}`}
                onChange={(value) => { setMessage(null); setSettings({ ...settings, sections: { ...settings.sections, [section.key]: value } }); }}
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="instant" className="mt-8">
        <h2 id="instant" className="m-0 border-b border-border pb-2 text-[15px] font-semibold">Instant emails</h2>
        <p className="m-0 mt-2 text-[13px] text-muted-foreground">Sent straight away, only for things someone needs to act on.</p>
        <ul className="m-0 list-none divide-y divide-border p-0">
          {INSTANT_EMAILS.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="m-0 text-[14px] font-semibold">{item.label}</p>
                <p className="m-0 mt-0.5 text-[13px] text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={settings.instant[item.key]}
                label={`${item.label} email`}
                onChange={(value) => { setMessage(null); setSettings({ ...settings, instant: { ...settings.instant, [item.key]: value } }); }}
              />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex items-center gap-3">
        <button type="button" onClick={() => void save()} disabled={saving} className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        {message ? <p role="status" className={`m-0 text-[13px] ${message.tone === "ok" ? "text-muted-foreground" : "text-destructive"}`}>{message.text}</p> : null}
      </div>
    </main>
  );
}
