"use client";

import * as React from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { LuCheck, LuChevronDown, LuSend, LuUsers, LuX } from "react-icons/lu";
import { useAuth } from "@/components/auth-provider";
import { confirmDialog } from "@/components/confirm-dialog";
import { UsersTableSkeleton } from "@/components/dashboard/loading-skeleton";
import { MobileHeaderTitle } from "@/components/dashboard/mobile-header";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichTextContent, RichTextEditor, richTextHasContent } from "@/components/rich-text-editor";
import { firebaseAuth, firebaseDb } from "@/lib/firebase/client";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { loadTemplates } from "@/lib/email/template-store";
import { MESSAGE_TEMPLATES as DEFAULT_MESSAGE_TEMPLATES, type MessageTemplate } from "@/lib/message-templates";
import { extractMessageCta, messageHtmlToPlainText } from "@/lib/message-html";
import {
  MESSAGE_GROUPS,
  SENT_MESSAGES_COLLECTION,
  type MessageGroup,
  type SentMessage,
} from "@/lib/notifications";

const MAX_MESSAGE = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Recipient =
  | { kind: "group"; key: MessageGroup; label: string }
  | { kind: "person"; uid: string; label: string }
  | { kind: "email"; address: string; label: string };

const recipientId = (item: Recipient) => (item.kind === "group" ? `g:${item.key}` : item.kind === "person" ? `p:${item.uid}` : `e:${item.address}`);

function initials(label: string) {
  const parts = label.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

async function postMessage(body: Record<string, unknown>) {
  const token = await firebaseAuth.currentUser?.getIdToken();
  const response = await fetch("/api/message", {
    method: "POST",
    headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; people?: number; notified?: number; emailed?: number; pushed?: number };
  if (!response.ok) throw new Error(data.error || "Couldn’t send the message.");
  return data;
}

const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

function ChannelChip({ checked, label, onChange }: { checked: boolean; label: string; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${checked ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
    >
      <span className={`grid h-4 w-4 place-items-center rounded ${checked ? "bg-primary text-primary-foreground" : "border border-muted-foreground/50"}`}>
        {checked ? <LuCheck aria-hidden="true" className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
      {label}
    </button>
  );
}

export default function SendMessagePage() {
  const { role, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [tab, setTab] = React.useState<"new" | "sent">("new");
  const [templateKey, setTemplateKey] = React.useState("blank");
  const [recipients, setRecipients] = React.useState<Recipient[]>([]);
  const [query, setQuery] = React.useState("");
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [byEmail, setByEmail] = React.useState(true);
  const [inApp, setInApp] = React.useState(true);
  const [byPush, setByPush] = React.useState(true);
  const [messageTemplates, setMessageTemplates] = React.useState<MessageTemplate[]>(DEFAULT_MESSAGE_TEMPLATES);
  const [reach, setReach] = React.useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [history, setHistory] = React.useState<SentMessage[]>([]);
  const pickerRef = React.useRef<HTMLDivElement>(null);
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

  React.useEffect(() => {
    if (authLoading || !isStaff) return;
    loadTemplates()
      .then((rows) => setMessageTemplates(rows.filter((row) => row.kind === "message" && row.published)))
      .catch(() => setStatus({ tone: "error", text: "Templates couldn’t load. Refresh the page to try again." }));
  }, [authLoading, isStaff]);

  // Close the people list when tapping elsewhere.
  React.useEffect(() => {
    if (!pickerOpen) return;
    const close = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [pickerOpen]);

  const groups = recipients.flatMap((item) => (item.kind === "group" ? [item.key] : []));
  const uids = recipients.flatMap((item) => (item.kind === "person" ? [item.uid] : []));
  const addresses = recipients.flatMap((item) => (item.kind === "email" ? [item.address] : []));
  const reachKey = JSON.stringify([groups, uids, addresses]);

  React.useEffect(() => {
    setReach(null);
    if (authLoading || !isStaff || reachKey === "[[],[],[]]") return;
    let active = true;
    const timer = window.setTimeout(() => {
      const [g, u, a] = JSON.parse(reachKey) as [string[], string[], string[]];
      postMessage({ preview: true, groups: g, uids: u, addresses: a })
        .then((data) => { if (active && typeof data.people === "number") setReach(data.people); })
        .catch(() => undefined);
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [reachKey, authLoading, isStaff]);

  if (authLoading || usersLoading) return <UsersTableSkeleton />;
  if (!isStaff) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-8 sm:px-8">
        <h1 className="m-0 text-page-title font-bold">Send message</h1>
        <p className="mt-6 text-sm text-muted-foreground">Only admins and managers can send messages.</p>
      </main>
    );
  }

  const people = users
    .filter((user) => user.uid && user.role !== "pending")
    .map((user) => ({ uid: user.uid as string, name: user.preferredName || user.name || user.email || "Unnamed", email: user.email ?? "", role: user.role }))
    .filter((person, index, all) => all.findIndex((other) => other.uid === person.uid) === index)
    .sort((a, b) => a.name.localeCompare(b.name));

  const chosenIds = new Set(recipients.map(recipientId));
  const needle = query.trim().toLowerCase();
  const groupOptions: Recipient[] = MESSAGE_GROUPS
    .filter((item) => !needle || item.label.toLowerCase().includes(needle))
    .map((item) => ({ kind: "group", key: item.key, label: item.label }));
  const personOptions: Recipient[] = people
    .filter((person) => !needle || person.name.toLowerCase().includes(needle) || person.email.toLowerCase().includes(needle))
    .slice(0, 8)
    .map((person) => ({ kind: "person", uid: person.uid, label: person.name }));
  const typedEmail = EMAIL_PATTERN.test(needle) && !people.some((person) => person.email.toLowerCase() === needle)
    ? [{ kind: "email", address: needle, label: needle } as Recipient]
    : [];
  const options = [...typedEmail, ...groupOptions, ...personOptions].filter((item) => !chosenIds.has(recipientId(item)));

  const addRecipient = (item: Recipient) => {
    setRecipients((current) => (current.some((other) => recipientId(other) === recipientId(item)) ? current : [...current, item]));
    setQuery("");
    setStatus(null);
  };

  const applyTemplate = (key: string) => {
    setTemplateKey(key);
    if (key === "blank") {
      setSubject("");
      setMessage("");
      setStatus(null);
      return;
    }
    const template = messageTemplates.find((item) => item.key === key);
    if (!template) return;
    setSubject(template.subject);
    setMessage(template.message);
    setByEmail(template.email);
    setInApp(template.inApp);
    setByPush(template.push);
    setStatus(null);
  };

  const template = messageTemplates.find((item) => item.key === templateKey);
  const messageAction = extractMessageCta(message);
  const hasValidAction = !messageAction || Boolean(messageAction.label && messageAction.href.startsWith("/") && !messageAction.href.startsWith("//"));
  const hasMessage = Boolean(subject.trim() && richTextHasContent(message));
  const canSend = hasMessage && hasValidAction && recipients.length > 0 && (byEmail || inApp || byPush) && !busy;

  const showResult = (result: Awaited<ReturnType<typeof postMessage>>, test: boolean) => {
    const parts = [
      result.notified ? `${result.notified} in-app` : null,
      result.emailed ? `${result.emailed} ${result.emailed === 1 ? "email" : "emails"}` : null,
      result.pushed ? `${result.pushed} push` : null,
    ].filter(Boolean);
    if (result.error) {
      setStatus({ tone: "error", text: parts.length ? `Sent ${parts.join(", ")}. ${result.error}` : result.error });
      return false;
    }
    setStatus({ tone: "ok", text: test ? `Test sent to you: ${parts.join(", ")}.` : `Sent: ${parts.join(", ")}.` });
    return true;
  };

  const send = async () => {
    if (!canSend) return;
    const who = reach ? `${reach} ${reach === 1 ? "person" : "people"}` : recipients.map((item) => item.label).join(", ");
    if (!await confirmDialog(`Send “${subject.trim()}” to ${who}?`, "Send")) return;
    setBusy(true);
    setStatus(null);
    try {
      const ok = showResult(await postMessage({ groups, uids, addresses, subject, message, email: byEmail, inApp, push: byPush }), false);
      if (ok) {
        setRecipients([]);
        setSubject("");
        setMessage("");
        setTemplateKey("blank");
      }
      loadHistory();
    } catch (cause) {
      setStatus({ tone: "error", text: cause instanceof Error ? cause.message : "Couldn’t send the message." });
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    if (!hasMessage || !hasValidAction || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      showResult(await postMessage({ test: true, subject, message, email: byEmail, inApp, push: byPush }), true);
    } catch (cause) {
      setStatus({ tone: "error", text: cause instanceof Error ? cause.message : "Couldn’t send the test." });
    } finally {
      setBusy(false);
    }
  };

  const row = "grid gap-2 border-b border-border px-5 py-4 sm:grid-cols-[110px_1fr] sm:items-start sm:gap-4";
  const rowLabel = "pt-2 text-sm text-muted-foreground";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-2 sm:px-8 nav:pt-6">
      <MobileHeaderTitle title="Send message" />
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="m-0 text-page-title font-bold max-nav:hidden">Send message</h1>
        <div className="flex flex-wrap items-center gap-3 max-nav:ml-auto">
          {role === "admin" ? <Link href="/admin/messages/designer" className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted">Message Designer</Link> : null}
          <div role="tablist" aria-label="Messages" className="inline-flex rounded-xl bg-muted p-1">
          {(["new", "sent"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`h-9 rounded-lg px-4 text-sm font-semibold transition-colors ${tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {key === "new" ? "New" : <>Sent <span className="ml-1 font-normal text-muted-foreground">{history.length}</span></>}
            </button>
          ))}
          </div>
        </div>
      </div>

      {tab === "new" ? (
        <>
          <form
            onSubmit={(event) => { event.preventDefault(); void send(); }}
            className="overflow-visible rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
          >
            <div className={row}>
              <label htmlFor="message-template" className={rowLabel}>Template</label>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="relative">
                  <select
                    id="message-template"
                    value={templateKey}
                    onChange={(event) => applyTemplate(event.target.value)}
                    disabled={busy}
                    className="h-11 appearance-none rounded-xl border border-border bg-background pl-4 pr-10 text-[15px] font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <option value="blank">Blank</option>
                    {messageTemplates.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                  </select>
                  <LuChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
                </div>
                {template ? <span className="text-sm text-muted-foreground">{template.description}</span> : null}
              </div>
            </div>

            <div className={row}>
              <span id="message-to" className={rowLabel}>To</span>
              <div ref={pickerRef} className="relative min-w-0">
                <div
                  className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl px-0 py-1"
                  onClick={() => setPickerOpen(true)}
                >
                  {recipients.map((item) => (
                    <span key={recipientId(item)} className="inline-flex h-9 max-w-full items-center gap-2 rounded-xl border border-border bg-background pl-1.5 pr-2 text-sm font-medium">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-card text-[10px] font-bold text-primary">
                        {item.kind === "group" ? <LuUsers aria-hidden="true" className="h-3.5 w-3.5" /> : initials(item.label)}
                      </span>
                      <span className="truncate">{item.label}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${item.label}`}
                        onClick={(event) => { event.stopPropagation(); setRecipients((current) => current.filter((other) => recipientId(other) !== recipientId(item))); }}
                        className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground"
                      >
                        <LuX aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    aria-labelledby="message-to"
                    value={query}
                    onChange={(event) => { setQuery(event.target.value); setPickerOpen(true); }}
                    onFocus={() => setPickerOpen(true)}
                    onKeyDown={(event) => {
                      if ((event.key === "Enter" || event.key === ",") && query.trim()) {
                        event.preventDefault();
                        if (options[0]) addRecipient(options[0]);
                      } else if (event.key === "Backspace" && !query && recipients.length) {
                        setRecipients((current) => current.slice(0, -1));
                      } else if (event.key === "Escape") {
                        setPickerOpen(false);
                      }
                    }}
                    disabled={busy}
                    className="h-9 min-w-[8rem] flex-1 bg-transparent text-[15px] text-foreground outline-none"
                  />
                </div>
                {pickerOpen && options.length ? (
                  <ul role="listbox" className="absolute left-0 right-0 top-full z-30 m-0 mt-1 max-h-72 list-none overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
                    {options.map((item) => (
                      <li key={recipientId(item)} role="option" aria-selected={false}>
                        <button
                          type="button"
                          onClick={() => addRecipient(item)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-[10px] font-bold text-primary">
                            {item.kind === "group" ? <LuUsers aria-hidden="true" className="h-3.5 w-3.5" /> : initials(item.label)}
                          </span>
                          <span className="flex min-w-0 flex-1 items-baseline gap-2">
                            <span className="shrink-0 truncate font-medium">{item.kind === "email" ? `Send to ${item.address}` : item.label}</span>
                            {item.kind === "person" ? (
                              <span className="min-w-0 truncate text-muted-foreground">{people.find((person) => person.uid === item.uid)?.email}</span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {reach ? <p className="m-0 mt-1 text-sm text-muted-foreground">Goes to {reach} {reach === 1 ? "person" : "people"}</p> : null}
              </div>
            </div>

            <div className={row}>
              <label htmlFor="message-subject" className={rowLabel}>Subject</label>
              <input
                id="message-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={200}
                disabled={busy}
                className="h-10 w-full min-w-0 bg-transparent text-[17px] font-semibold text-foreground outline-none"
              />
            </div>

            <div className="relative border-b border-border p-5">
              <RichTextEditor hideLabel label="Message" value={message} onChange={setMessage} disabled={busy} allowMessageButton placeholder="Write your message…" />
              <span className="mt-2 block text-right text-xs tabular-nums text-muted-foreground">{messageHtmlToPlainText(message).length} / {MAX_MESSAGE}</span>
              {!hasValidAction ? <p role="alert" className="m-0 mt-2 text-sm text-destructive">Complete the button text and use a Bantaba link beginning with /.</p> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm text-muted-foreground">Send as</span>
                <ChannelChip checked={byEmail} label="Email" onChange={setByEmail} />
                <ChannelChip checked={inApp} label="In-app" onChange={setInApp} />
                <ChannelChip checked={byPush} label="Push" onChange={setByPush} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setPreviewOpen(true)} disabled={!hasMessage} className="h-11 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50">Preview</button>
                <button type="button" onClick={() => void sendTest()} disabled={!hasMessage || !hasValidAction || busy || (!byEmail && !inApp && !byPush)} className="h-11 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground hover:border-foreground disabled:opacity-50">Send me a test</button>
                <button type="submit" disabled={!canSend} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  <LuSend aria-hidden="true" className="h-4 w-4" />
                  {busy ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </form>
          {status ? <p role="status" className={`m-0 mt-3 text-sm ${status.tone === "ok" ? "text-muted-foreground" : "text-destructive"}`}>{status.text}</p> : null}
        </>
      ) : (
        <section aria-label="Sent messages" className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
          {history.length ? (
            <ul className="m-0 list-none divide-y divide-border p-0">
              {history.map((item) => (
                <li key={item.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="m-0 text-[15px] font-semibold">{item.subject}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{dateLabel(item.createdAt)}</span>
                  </div>
                  <p className="m-0 mt-1 line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">{messageHtmlToPlainText(item.message)}</p>
                  <p className="m-0 mt-2 text-xs text-muted-foreground">
                    To {item.toLabel || "—"} · {item.people} {item.people === 1 ? "person" : "people"}
                    {item.emailed ? ` · ${item.emailed} emailed` : ""}{item.notified ? " · in-app" : ""}{item.pushed ? ` · ${item.pushed} pushed` : ""} · by {item.sentByName}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 px-5 py-10 text-center text-sm text-muted-foreground">Nothing sent yet.</p>
          )}
        </section>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pr-10">
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription className="sr-only">How the message will look.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-background p-5">
            <p className="m-0 text-[15px] font-semibold">{subject || "No subject"}</p>
            <RichTextContent value={message} className="mt-3 text-[15px] leading-relaxed [&_a[data-message-button]]:inline-flex [&_a[data-message-button]]:min-h-10 [&_a[data-message-button]]:items-center [&_a[data-message-button]]:rounded-lg [&_a[data-message-button]]:bg-primary [&_a[data-message-button]]:px-4 [&_a[data-message-button]]:font-semibold [&_a[data-message-button]]:text-primary-foreground [&_a[data-message-button]]:no-underline" />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
