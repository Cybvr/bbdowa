"use client";

import * as React from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/ui";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { Input } from "@/components/ui/input";
import { firebaseDb } from "@/lib/firebase/client";
import {
  NOTIFICATION_SETTINGS_DOC,
  REMINDER_GROUPS,
  withDefaults,
  type NotificationSettings,
  type ReminderChannels,
  type ReminderKey,
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

const NUMBER_FIELDS: Partial<Record<ReminderKey, { field: keyof NotificationSettings; label: string; min: number; max: number }>> = {
  taskDueSoon: { field: "taskDueSoonDays", label: "Days before", min: 1, max: 30 },
  jobEndingSoon: { field: "jobEndingSoonDays", label: "Days before", min: 1, max: 60 },
  trackerRunningLong: { field: "trackerRunningHours", label: "After hours", min: 1, max: 24 },
};

export default function NotificationSettingsPage() {
  const { role, loading: authLoading } = useAuth();
  const [settings, setSettings] = React.useState<NotificationSettings | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const isAdmin = role === "admin";
  const ref = doc(firebaseDb, NOTIFICATION_SETTINGS_DOC.collection, NOTIFICATION_SETTINGS_DOC.id);

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

  const setChannel = (key: ReminderKey, channel: keyof ReminderChannels, value: boolean) => {
    setMessage(null);
    setSettings({ ...settings, reminders: { ...settings.reminders, [key]: { ...settings.reminders[key], [channel]: value } } });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(ref, { ...settings, updatedAt: new Date().toISOString() });
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
      <p className="mt-2 text-sm text-muted-foreground">Choose which reminders go out and how. Checks run at 9am and 5pm (Lagos time).</p>

      <div className="mt-6 space-y-8">
        {REMINDER_GROUPS.map((group) => (
          <section key={group.title} aria-labelledby={`group-${group.title}`}>
            <div className="flex items-end justify-between gap-4 border-b border-border pb-2">
              <h2 id={`group-${group.title}`} className="m-0 text-[15px] font-semibold">{group.title}</h2>
              <div className="flex gap-4 text-[12px] font-medium text-muted-foreground">
                <span className="w-9 text-center">In-app</span>
                <span className="w-9 text-center">Email</span>
              </div>
            </div>
            <ul className="m-0 list-none divide-y divide-border p-0">
              {group.items.map((item) => {
                const channels = settings.reminders[item.key];
                const number = NUMBER_FIELDS[item.key];
                return (
                  <li key={item.key} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="m-0 text-[14px] font-semibold">{item.label}</p>
                      <p className="m-0 mt-0.5 text-[13px] text-muted-foreground">{item.description}</p>
                      {number ? (
                        <label className="mt-2 flex items-center gap-2 text-[13px] text-muted-foreground">
                          {number.label}
                          <Input
                            type="number"
                            min={number.min}
                            max={number.max}
                            value={String(settings[number.field])}
                            onChange={(event) => {
                              const next = Math.min(number.max, Math.max(number.min, Math.round(Number(event.target.value) || number.min)));
                              setMessage(null);
                              setSettings({ ...settings, [number.field]: next });
                            }}
                            className="h-8 w-20 text-sm"
                          />
                        </label>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-4">
                      <Switch checked={channels.inApp} label={`${item.label} in-app`} onChange={(value) => setChannel(item.key, "inApp", value)} />
                      <Switch checked={channels.email} label={`${item.label} email`} onChange={(value) => setChannel(item.key, "email", value)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button type="button" onClick={() => void save()} disabled={saving} className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        {message ? <p role="status" className={`m-0 text-[13px] ${message.tone === "ok" ? "text-muted-foreground" : "text-destructive"}`}>{message.text}</p> : null}
      </div>
    </main>
  );
}
