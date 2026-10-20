"use client";

import * as React from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { LuChevronDown, LuMail, LuPlus, LuSend, LuUsers, LuX } from "react-icons/lu";
import { useAuth } from "@/components/auth-provider";
import { EmptyState, PageHeader, PANEL } from "@/components/dashboard/ui";
import { RichTextContent, RichTextEditor, richTextHasContent } from "@/components/rich-text-editor";
import { firebaseAuth, firebaseDb } from "@/lib/firebase/client";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { loadTemplates } from "@/lib/email/template-store";
import type { SavedTemplate } from "@/lib/email/template-definitions";
import { messageHtmlToPlainText } from "@/lib/message-html";
import { MESSAGE_GROUPS, SENT_MESSAGES_COLLECTION, type MessageGroup, type SentMessage } from "@/lib/notifications";
import type { EmailTab } from "./types";

type Recipient =
  | { kind: "group"; key: MessageGroup; label: string }
  | { kind: "person"; uid: string; label: string; email: string }
  | { kind: "email"; address: string; label: string };

type MessageResult = { error?: string; emailed?: number };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 5000;

const TAB_LABELS: Record<EmailTab, string> = {
  inbox: "Inbox",
  updates: "Updates",
  drafts: "Drafts",
  messages: "Sent",
  bin: "Bin",
  templates: "Templates",
  lists: "Lists",
};

const TAB_HREFS: Record<EmailTab, string> = {
  inbox: "/admin/email/inbox",
  updates: "/admin/email/updates",
  drafts: "/admin/email/drafts",
  messages: "/admin/email/sent",
  bin: "/admin/email/bin",
  templates: "/admin/email/templates",
  lists: "/admin/email/lists",
};

const recipientId = (item: Recipient) => item.kind === "group" ? `g:${item.key}` : item.kind === "person" ? `p:${item.uid}` : `e:${item.address}`;

function initials(label: string) {
  const parts = label.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

async function postEmail(body: Record<string, unknown>) {
  const token = await firebaseAuth.currentUser?.getIdToken();
  const response = await fetch("/api/message", {
    method: "POST",
    headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => ({}))) as MessageResult;
  if (!response.ok) throw new Error(result.error || "Couldn’t send the email.");
  return result;
}

function tabDescription(tab: EmailTab) {
  if (tab === "inbox") return "Send and manage email from the BBDO West Africa workspace.";
  if (tab === "messages") return "Messages sent through the configured Resend sender.";
  if (tab === "templates") return "Reusable message templates already configured for Bantaba.";
  if (tab === "lists") return "Audience groups available to the email composer.";
  if (tab === "updates") return "Inbound mailbox sync is not connected to Bantaba yet.";
  if (tab === "drafts") return "Drafts stay in this browser until you send them.";
  return "Deleted messages will appear here once mailbox storage is connected.";
}

function RecipientChip({ item, onRemove }: { item: Recipient; onRemove: () => void }) {
  return (
    <span className="inline-flex h-9 max-w-full items-center gap-2 rounded-lg border border-border bg-background pl-1.5 pr-2 text-sm font-medium">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-card text-[10px] font-bold text-primary">
        {item.kind === "group" ? <LuUsers aria-hidden="true" className="h-3.5 w-3.5" /> : initials(item.label)}
      </span>
      <span className="truncate">{item.label}</span>
      <button type="button" aria-label={`Remove ${item.label}`} onClick={onRemove} className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground">
        <LuX aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function ComposeEmail({ templates, initialTemplate, onSent }: { templates: SavedTemplate[]; initialTemplate?: SavedTemplate | null; onSent: () => void }) {
  const { users } = useFirestoreUsers();
  const [recipients, setRecipients] = React.useState<Recipient[]>([]);
  const [query, setQuery] = React.useState("");
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [templateKey, setTemplateKey] = React.useState("blank");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const pickerRef = React.useRef<HTMLDivElement>(null);
  const messageTemplates = templates.filter((item) => item.kind === "message" && item.published);

  React.useEffect(() => {
    if (!initialTemplate) return;
    setTemplateKey(initialTemplate.key);
    setSubject(initialTemplate.subject);
    setMessage(initialTemplate.message);
  }, [initialTemplate]);

  React.useEffect(() => {
    if (!pickerOpen) return;
    const close = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [pickerOpen]);

  const people = React.useMemo(() => users
    .filter((person) => person.uid && person.role !== "pending" && person.email)
    .map((person) => ({ uid: person.uid as string, name: person.preferredName || person.name || person.email || "Unnamed", email: person.email as string }))
    .filter((person, index, all) => all.findIndex((other) => other.uid === person.uid) === index)
    .sort((a, b) => a.name.localeCompare(b.name)), [users]);

  const groups = recipients.flatMap((item) => item.kind === "group" ? [item.key] : []);
  const uids = recipients.flatMap((item) => item.kind === "person" ? [item.uid] : []);
  const addresses = recipients.flatMap((item) => item.kind === "email" ? [item.address] : []);
  const needle = query.trim().toLowerCase();
  const chosen = new Set(recipients.map(recipientId));
  const options: Recipient[] = [
    ...(EMAIL_PATTERN.test(needle) ? [{ kind: "email", address: needle, label: needle } as Recipient] : []),
    ...MESSAGE_GROUPS.filter((item) => !needle || item.label.toLowerCase().includes(needle)).map((item) => ({ kind: "group" as const, key: item.key, label: item.label })),
    ...people.filter((person) => !needle || person.name.toLowerCase().includes(needle) || person.email.toLowerCase().includes(needle)).slice(0, 8).map((person) => ({ kind: "person" as const, uid: person.uid, label: person.name, email: person.email })),
  ].filter((item) => !chosen.has(recipientId(item)));

  const applyTemplate = (key: string) => {
    setTemplateKey(key);
    const template = messageTemplates.find((item) => item.key === key);
    setSubject(template?.subject ?? "");
    setMessage(template?.message ?? "");
    setStatus(null);
  };

  const addRecipient = (item: Recipient) => {
    setRecipients((current) => [...current, item]);
    setQuery("");
    setPickerOpen(false);
    setStatus(null);
  };

  const send = async () => {
    const hasMessage = Boolean(subject.trim() && richTextHasContent(message));
    if (!hasMessage || !recipients.length || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const result = await postEmail({ groups, uids, addresses, subject, message, email: true, inApp: false, push: false });
      setStatus({ tone: "ok", text: `Sent to ${result.emailed ?? recipients.length} ${result.emailed === 1 ? "person" : "people"}.` });
      setRecipients([]);
      setSubject("");
      setMessage("");
      setTemplateKey("blank");
      onSent();
    } catch (cause) {
      setStatus({ tone: "error", text: cause instanceof Error ? cause.message : "Couldn’t send the email." });
    } finally {
      setBusy(false);
    }
  };

  const plainLength = messageHtmlToPlainText(message).length;
  const canSend = Boolean(subject.trim() && richTextHasContent(message) && recipients.length && !busy);

  return (
    <section className={`${PANEL} p-0`} aria-label="Compose email">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="m-0 text-item-title font-semibold">New email</h2>
          <p className="m-0 mt-1 text-sm text-muted-foreground">Sent from the configured BBDO Resend address.</p>
        </div>
        <LuMail aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="grid gap-0">
        <div className="grid gap-2 border-b border-border px-5 py-4 sm:grid-cols-[90px_1fr] sm:items-start sm:gap-4 sm:px-6">
          <label htmlFor="email-template" className="pt-2 text-sm text-muted-foreground">Template</label>
          <div className="relative min-w-0">
            <select id="email-template" value={templateKey} onChange={(event) => applyTemplate(event.target.value)} disabled={busy} className="h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <option value="blank">Blank</option>
              {messageTemplates.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
            <LuChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="grid gap-2 border-b border-border px-5 py-4 sm:grid-cols-[90px_1fr] sm:items-start sm:gap-4 sm:px-6">
          <span id="email-to" className="pt-2 text-sm text-muted-foreground">To</span>
          <div ref={pickerRef} className="relative min-w-0">
            <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-primary/40" onClick={() => setPickerOpen(true)}>
              {recipients.map((item) => <RecipientChip key={recipientId(item)} item={item} onRemove={() => setRecipients((current) => current.filter((other) => recipientId(other) !== recipientId(item)))} />)}
              <input aria-labelledby="email-to" value={query} onChange={(event) => { setQuery(event.target.value); setPickerOpen(true); }} onFocus={() => setPickerOpen(true)} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === ",") && options[0]) { event.preventDefault(); addRecipient(options[0]); } else if (event.key === "Backspace" && !query && recipients.length) setRecipients((current) => current.slice(0, -1)); }} disabled={busy} placeholder={recipients.length ? "Add another…" : "People, groups or email address"} className="h-8 min-w-[12rem] flex-1 bg-transparent px-1 text-sm text-foreground outline-none" />
            </div>
            {pickerOpen && options.length ? <ul role="listbox" className="absolute left-0 right-0 top-full z-30 m-0 mt-1 max-h-64 list-none overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
              {options.map((item) => <li key={recipientId(item)} role="option" aria-selected={false}><button type="button" onClick={() => addRecipient(item)} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-[10px] font-bold text-primary">{item.kind === "group" ? <LuUsers aria-hidden="true" className="h-3.5 w-3.5" /> : initials(item.label)}</span><span className="min-w-0 truncate font-medium">{item.kind === "email" ? `Send to ${item.address}` : item.label}</span></button></li>)}
            </ul> : null}
          </div>
        </div>

        <div className="grid gap-2 border-b border-border px-5 py-4 sm:grid-cols-[90px_1fr] sm:items-center sm:gap-4 sm:px-6">
          <label htmlFor="email-subject" className="text-sm text-muted-foreground">Subject</label>
          <input id="email-subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} disabled={busy} className="h-10 w-full min-w-0 bg-transparent text-[15px] font-semibold text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40" placeholder="Subject" />
        </div>

        <div className="border-b border-border px-5 py-4 sm:px-6">
          <RichTextEditor hideLabel label="Message" value={message} onChange={setMessage} disabled={busy} allowMessageButton placeholder="Write your email…" />
          <p className="m-0 mt-2 text-right text-xs tabular-nums text-muted-foreground">{plainLength} / {MAX_MESSAGE}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          {status ? <p role="status" className={`m-0 text-sm ${status.tone === "error" ? "text-destructive" : "text-muted-foreground"}`}>{status.text}</p> : <p className="m-0 text-sm text-muted-foreground">Email only · Resend delivery</p>}
          <button type="button" onClick={() => void send()} disabled={!canSend} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"><LuSend aria-hidden="true" className="h-4 w-4" />{busy ? "Sending…" : "Send email"}</button>
        </div>
      </div>
    </section>
  );
}

function SentList({ history, selectedId }: { history: SentMessage[]; selectedId?: string }) {
  if (!history.length) return <EmptyState title="Nothing sent yet" description="Emails sent from this workspace will appear here." />;
  const selected = selectedId ? history.find((item) => item.id === selectedId) : null;
  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
    <ul className={`${PANEL} m-0 list-none divide-y divide-border p-0`} aria-label="Sent email history">
      {history.map((item) => <li key={item.id}><Link href={`${TAB_HREFS.messages}/${encodeURIComponent(item.id)}`} className={`block px-5 py-4 text-foreground no-underline transition-colors hover:bg-muted/30 sm:px-6 ${selectedId === item.id ? "bg-muted/30" : ""}`}><div className="flex items-start justify-between gap-3"><p className="m-0 truncate text-[15px] font-semibold">{item.subject}</p><time className="shrink-0 text-xs text-muted-foreground" dateTime={item.createdAt}>{dateLabel(item.createdAt)}</time></div><p className="m-0 mt-1 line-clamp-2 text-sm text-muted-foreground">{messageHtmlToPlainText(item.message)}</p><p className="m-0 mt-2 text-xs text-muted-foreground">To {item.toLabel || "—"} · {item.people} {item.people === 1 ? "person" : "people"} · {item.emailed} emailed</p></Link></li>)}
    </ul>
    {selected ? <section className={PANEL} aria-label="Sent email details"><div className="flex items-start justify-between gap-3"><div><p className="m-0 text-xs text-muted-foreground">Sent {dateLabel(selected.createdAt)}</p><h2 className="m-0 mt-1 text-item-title font-semibold">{selected.subject}</h2></div><LuMail aria-hidden="true" className="h-5 w-5 text-muted-foreground" /></div><p className="m-0 mt-4 text-sm text-muted-foreground">To {selected.toLabel || "—"}</p><RichTextContent value={selected.message} className="mt-5 text-[15px] leading-relaxed" /><p className="m-0 mt-5 border-t border-border pt-4 text-xs text-muted-foreground">{selected.emailed} emailed · sent by {selected.sentByName}</p></section> : <div className={`${PANEL} hidden items-center justify-center lg:flex`}><p className="m-0 text-sm text-muted-foreground">Select a sent email to read it.</p></div>}
  </div>;
}

function SimpleFolder({ tab }: { tab: EmailTab }) {
  const copy = tab === "drafts" ? "Draft saving is not connected yet. Use the composer on Inbox to send an email." : tab === "updates" ? "Bantaba is not connected to an inbound mailbox yet." : "This folder is ready for the mailbox connection.";
  return <EmptyState title={`${TAB_LABELS[tab]} is empty`} description={copy} />;
}

function TemplatesList({ templates, onUse }: { templates: SavedTemplate[]; onUse: (template: SavedTemplate) => void }) {
  const rows = templates.filter((item) => item.kind === "message" && item.published);
  if (!rows.length) return <EmptyState title="No templates yet" description="Published message templates will appear here." />;
  return <section className={`${PANEL} p-0`}><ul className="m-0 list-none divide-y divide-border p-0">{rows.map((item) => <li key={item.key} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="m-0 font-semibold">{item.label}</p><p className="m-0 mt-1 text-sm text-muted-foreground">{item.description}</p></div><button type="button" onClick={() => onUse(item)} className="h-9 shrink-0 rounded-lg border border-border px-3 text-sm font-semibold hover:border-foreground">Use template</button></li>)}</ul></section>;
}

function Lists({ users }: { users: { role?: string | null }[] }) {
  const count = (role: string) => users.filter((person) => person.role === role).length;
  return <section className="grid gap-3 sm:grid-cols-2">{MESSAGE_GROUPS.map((group) => { const people = group.key === "everyone" ? users.filter((person) => person.role !== "pending").length : group.key === "team" ? count("admin") + count("manager") : group.key === "creators" ? count("creator") : count("client"); return <div key={group.key} className={PANEL}><div className="flex items-center justify-between gap-3"><h2 className="m-0 text-item-title font-semibold">{group.label}</h2><LuUsers aria-hidden="true" className="h-5 w-5 text-muted-foreground" /></div><p className="m-0 mt-2 text-3xl font-bold tabular-nums">{people}</p><p className="m-0 mt-1 text-sm text-muted-foreground">people available in this audience</p></div>; })}</section>;
}

export function EmailWorkspace({ initialTab = "inbox", initialMessageId }: { initialTab?: EmailTab; initialMessageId?: string }) {
  const { role, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [history, setHistory] = React.useState<SentMessage[]>([]);
  const [templates, setTemplates] = React.useState<SavedTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [composeOpen, setComposeOpen] = React.useState(initialTab === "inbox");
  const [selectedTemplate, setSelectedTemplate] = React.useState<SavedTemplate | null>(null);
  const isStaff = role === "admin" || role === "manager";

  const load = React.useCallback(async () => {
    if (!isStaff) return;
    setLoading(true);
    try {
      const [sent, loadedTemplates] = await Promise.all([getDocs(collection(firebaseDb, SENT_MESSAGES_COLLECTION)), loadTemplates()]);
      setHistory(sent.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<SentMessage, "id">) })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setTemplates(loadedTemplates);
    } catch (cause) {
      console.error("Unable to load email workspace", cause);
    } finally {
      setLoading(false);
    }
  }, [isStaff]);

  React.useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  const useTemplate = (template: SavedTemplate) => {
    setSelectedTemplate(template);
    setComposeOpen(true);
  };

  const onSent = () => {
    setSelectedTemplate(null);
    void load();
  };

  if (authLoading || usersLoading || loading) return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8"><div className="h-7 w-40 animate-pulse rounded bg-muted" /><div className="mt-6 h-48 animate-pulse rounded-xl bg-muted" /></main>;
  if (!isStaff) return <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-8 sm:px-8"><PageHeader title="Email" /><p className="mt-6 text-sm text-muted-foreground">Only admins and managers can use email.</p></main>;

  const tab = initialTab;
  const heading = tab === "messages" ? "Sent" : TAB_LABELS[tab];

  return <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-2 sm:px-8 nav:pt-6">
    <PageHeader title={heading} description={tabDescription(tab)} actions={tab !== "inbox" && tab !== "messages" && tab !== "templates" && tab !== "lists" ? <Link href={TAB_HREFS.inbox} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground no-underline hover:bg-primary/90"><LuPlus aria-hidden="true" className="h-4 w-4" />New email</Link> : undefined} />
    <nav aria-label="Email folders" className="mt-5 flex gap-1 overflow-x-auto border-b border-border pb-px">
      {(Object.keys(TAB_LABELS) as EmailTab[]).map((item) => <Link key={item} href={TAB_HREFS[item]} aria-current={tab === item ? "page" : undefined} className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold no-underline transition-colors ${tab === item ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{TAB_LABELS[item]}{item === "messages" && history.length ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">{history.length}</span> : null}</Link>)}
    </nav>

    <div className="mt-6">
      {tab === "inbox" ? <div className="grid gap-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="m-0 text-item-title font-semibold">Send email</h2><p className="m-0 mt-1 text-sm text-muted-foreground">Compose a message to people, groups or an external address.</p></div><button type="button" onClick={() => setComposeOpen((value) => !value)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:border-foreground">{composeOpen ? "Hide composer" : "New email"}</button></div>{composeOpen ? <ComposeEmail templates={templates} initialTemplate={selectedTemplate} onSent={onSent} /> : <EmptyState title="Start an email" description="Open the composer to send through the configured BBDO West Africa Resend sender." />}</div>
        : tab === "messages" ? <SentList history={history} selectedId={initialMessageId} />
          : tab === "templates" ? <div className="grid gap-4">{composeOpen && selectedTemplate ? <ComposeEmail templates={templates} initialTemplate={selectedTemplate} onSent={onSent} /> : null}<TemplatesList templates={templates} onUse={useTemplate} /></div>
            : tab === "lists" ? <Lists users={users} />
              : <SimpleFolder tab={tab} />}
    </div>
  </main>;
}
