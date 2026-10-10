"use client";

import * as React from "react";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { confirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/dashboard/ui";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { firebaseAuth, firebaseDb } from "@/lib/firebase/client";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import {
  MESSAGE_AUDIENCES,
  SENT_MESSAGES_COLLECTION,
  type MessageAudience,
  type SentMessage,
} from "@/lib/notifications";

async function postMessage(body: Record<string, unknown>) {
  const token = await firebaseAuth.currentUser?.getIdToken();
  const response = await fetch("/api/message", {
    method: "POST",
    headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; people?: number; emails?: number; notified?: number; emailed?: number };
  if (!response.ok) throw new Error(data.error || "Couldn’t send the message.");
  return data;
}

const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export default function SendMessagePage() {
  const { role, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [audience, setAudience] = React.useState<MessageAudience>("everyone");
  const [chosen, setChosen] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [byEmail, setByEmail] = React.useState(true);
  const [inApp, setInApp] = React.useState(true);
  const [count, setCount] = React.useState<{ people: number; emails: number } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [history, setHistory] = React.useState<SentMessage[]>([]);
  const isStaff = role === "admin" || role === "manager";

  const loadHistory = React.useCallback(() => {
    getDocs(collection(firebaseDb, SENT_MESSAGES_COLLECTION))
      .then((snapshot) => setHistory(snapshot.docs
        .map((item) => ({ id: item.id, ...(item.data() as Omit<SentMessage, "id">) }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch((cause) => console.error("Unable to load sent messages", cause));
  }, []);

  React.useEffect(() => {
    if (!authLoading && isStaff) loadHistory();
  }, [authLoading, isStaff, loadHistory]);

  // How many people the current choice reaches, worked out the same way as sending.
  const chosenKey = chosen.join(",");
  React.useEffect(() => {
    if (authLoading || !isStaff) return;
    let active = true;
    setCount(null);
    const timer = window.setTimeout(() => {
      postMessage({ audience, uids: chosenKey ? chosenKey.split(",") : [], preview: true })
        .then((data) => { if (active) setCount({ people: data.people ?? 0, emails: data.emails ?? 0 }); })
        .catch(() => { if (active) setCount(null); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [audience, chosenKey, authLoading, isStaff]);

  if (authLoading || usersLoading) return <UsersTableSkeleton />;
  if (!isStaff) return <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-8 sm:px-8"><PageHeader title="Send message" /><p className="mt-8 text-sm text-muted-foreground">Only admins and managers can send messages.</p></main>;

  const people = users
    .filter((user) => user.uid && user.role !== "pending")
    .map((user) => ({ uid: user.uid as string, name: user.preferredName || user.name || user.email || "Unnamed", role: user.role }))
    .filter((person, index, all) => all.findIndex((other) => other.uid === person.uid) === index)
    .sort((a, b) => a.name.localeCompare(b.name));
  const needle = search.trim().toLowerCase();
  const shownPeople = people.filter((person) => !needle || person.name.toLowerCase().includes(needle));
  const canSend = Boolean(subject.trim() && message.trim() && (byEmail || inApp) && count?.people && !busy);

  const send = async () => {
    if (!canSend || !count) return;
    const how = byEmail && inApp ? "by email and in-app" : byEmail ? "by email" : "in-app";
    if (!await confirmDialog(`Send “${subject.trim()}” to ${count.people} ${count.people === 1 ? "person" : "people"} ${how}?`, "Send")) return;
    setBusy(true);
    setStatus(null);
    try {
      const result = await postMessage({ audience, uids: chosen, subject, message, email: byEmail, inApp });
      const parts = [result.notified ? `${result.notified} in-app` : null, result.emailed ? `${result.emailed} ${result.emailed === 1 ? "email" : "emails"}` : null].filter(Boolean);
      setStatus({ tone: "ok", text: `Sent: ${parts.join(", ")}.` });
      setSubject("");
      setMessage("");
      loadHistory();
    } catch (cause) {
      setStatus({ tone: "error", text: cause instanceof Error ? cause.message : "Couldn’t send the message." });
    } finally {
      setBusy(false);
    }
  };

  const audienceLabel = (key: MessageAudience) => MESSAGE_AUDIENCES.find((item) => item.key === key)?.label ?? key;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-2 sm:px-8">
      <PageHeader title="Send message" />

      <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="mt-4 space-y-6">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">To</legend>
          <div className="flex flex-wrap gap-2">
            {MESSAGE_AUDIENCES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setAudience(item.key)}
                aria-pressed={audience === item.key}
                className={`rounded-md border px-3 py-1.5 text-[13px] font-medium ${audience === item.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {audience === "people" ? (
            <div className="mt-2 rounded-xl border border-border">
              <div className="border-b border-border p-2">
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people" className="h-9 text-sm" />
              </div>
              <ul className="m-0 max-h-64 list-none overflow-y-auto p-1">
                {shownPeople.map((person) => {
                  const checked = chosen.includes(person.uid);
                  return (
                    <li key={person.uid}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setChosen((current) => checked ? current.filter((uid) => uid !== person.uid) : [...current, person.uid])}
                          className="h-4 w-4 accent-[var(--primary)]"
                        />
                        <span className="min-w-0 flex-1 truncate">{person.name}</span>
                        <span className="shrink-0 text-xs capitalize text-muted-foreground">{person.role}</span>
                      </label>
                    </li>
                  );
                })}
                {!shownPeople.length ? <li className="px-3 py-4 text-center text-sm text-muted-foreground">No one matches.</li> : null}
              </ul>
            </div>
          ) : null}
          <p className="m-0 text-[13px] text-muted-foreground">
            {count ? `${count.people} ${count.people === 1 ? "person" : "people"}${byEmail ? `, ${count.emails} with an email address` : ""}.` : "Counting…"} Only people who have signed in get messages.
          </p>
        </fieldset>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Subject</span>
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} disabled={busy} className="h-11" />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Message</span>
          <Textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={5000} rows={8} disabled={busy} />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Send as</legend>
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={byEmail} onChange={(event) => setByEmail(event.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />Email</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={inApp} onChange={(event) => setInApp(event.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />In-app notification</label>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={!canSend} className="h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">{busy ? "Sending…" : "Send"}</button>
          {status ? <p role="status" className={`m-0 text-[13px] ${status.tone === "ok" ? "text-muted-foreground" : "text-destructive"}`}>{status.text}</p> : null}
        </div>
      </form>

      <section aria-labelledby="sent" className="mt-12">
        <h2 id="sent" className="m-0 border-b border-border pb-2 text-[15px] font-semibold">Sent</h2>
        {history.length ? (
          <ul className="m-0 list-none divide-y divide-border p-0">
            {history.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="m-0 text-[14px] font-semibold">{item.subject}</p>
                  <span className="shrink-0 text-[12px] text-muted-foreground">{dateLabel(item.createdAt)}</span>
                </div>
                <p className="m-0 mt-1 line-clamp-2 whitespace-pre-line text-[13px] text-muted-foreground">{item.message}</p>
                <p className="m-0 mt-1 text-[12px] text-muted-foreground">
                  {audienceLabel(item.audience)} · {item.people} {item.people === 1 ? "person" : "people"}
                  {item.emailed ? ` · ${item.emailed} emailed` : ""}{item.notified ? " · in-app" : ""} · by {item.sentByName}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 mt-3 text-sm text-muted-foreground">Nothing sent yet.</p>
        )}
      </section>
    </main>
  );
}
