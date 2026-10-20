"use client";

import * as React from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { LuArrowLeft, LuFileText, LuInbox, LuLayoutTemplate, LuMaximize2, LuMinimize2, LuMinus, LuPlus, LuRefreshCw, LuSend, LuStar, LuTrash2, LuUsers, LuX } from "react-icons/lu";
import { useAuth } from "@/components/auth-provider";
import { NAV_ACTIVE, NAV_TEXT } from "@/components/dashboard-sidebar";
import { EmptyState, PageHeader, PANEL } from "@/components/dashboard/ui";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { FilterBar, useListView, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { CardGrid, MobileRow, MobileRows } from "@/components/dashboard/list-card";
import { RichTextContent, RichTextEditor, richTextHasContent } from "@/components/rich-text-editor";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { firebaseAuth, firebaseDb } from "@/lib/firebase/client";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { loadTemplates } from "@/lib/email/template-store";
import { migrateEmailDrafts, readEmailDrafts, removeEmailDraft, saveEmailDraft, subscribeEmailDrafts, type EmailDraft, type EmailDraftRecipient } from "@/lib/email/draft-store";
import { moveEmailToBin, restoreEmailFromBin, subscribeEmailBin, type EmailBinCandidate, type EmailBinItem } from "@/lib/email/bin-store";
import { saveInboxFlags, subscribeInboxFlags, type InboxFlags, type InboxFlagsById } from "@/lib/email/inbox-flags-store";
import type { ReceivedEmailDetail, ReceivedEmailSummary } from "@/lib/email/received-email";
import type { SavedTemplate } from "@/lib/email/template-definitions";
import { messageHtmlToPlainText } from "@/lib/message-html";
import { MESSAGE_GROUPS, SENT_MESSAGES_COLLECTION, type SentMessage } from "@/lib/notifications";
import { plural } from "@/lib/format";
import type { EmailTab } from "./types";
import { EmailWorkspaceTable, type EmailWorkspaceTableRow } from "./email-workspace-table";

type Recipient = EmailDraftRecipient;

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

const EMAIL_TABS: { key: EmailTab; label: string }[] = (Object.keys(TAB_LABELS) as EmailTab[]).map((key) => ({ key, label: TAB_LABELS[key] }));
const EMAIL_SORTS: SortOption<"recent" | "title">[] = [
  { key: "recent", label: "Most recent" },
  { key: "title", label: "Subject (A–Z)" },
];

const recipientId = (item: Recipient) => item.kind === "group" ? `g:${item.key}` : item.kind === "person" ? `p:${item.uid}` : `e:${item.address}`;

function initials(label: string) {
  const parts = label.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function mailDateLabel(iso: string) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "—";
  const now = new Date();
  const sameDay = value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth() && value.getDate() === now.getDate();
  return new Intl.DateTimeFormat("en-GB", sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" }).format(value);
}

function senderLabel(from: string) {
  const named = from.match(/^\s*"?([^"<>]+?)"?\s*<[^>]+>\s*$/);
  return named?.[1]?.trim() || from;
}

function senderAddress(from: string) {
  return from.match(/<([^>]+)>/)?.[1] ?? "";
}

function MoveToBinButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={`Move ${label} to Bin`} title="Move to Bin" className="inline-grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><LuTrash2 aria-hidden="true" className="h-4 w-4" /></button>;
}

function RestoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={`Restore ${label}`} title="Restore" className="inline-grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><LuRefreshCw aria-hidden="true" className="h-4 w-4" /></button>;
}

function BackToEmailList({ href }: { href: string }) {
  return <Link href={href} aria-label="Back to list" title="Back to list" className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><LuArrowLeft aria-hidden="true" className="h-5 w-5" /></Link>;
}

function EmailDetailHeader({ folder, href, subject, onDelete, important, onToggleImportant }: { folder: string; href: string; subject: string; onDelete: () => void; important?: boolean; onToggleImportant?: () => void }) {
  return <header className="flex min-w-0 items-start gap-3">
    <BackToEmailList href={href} />
    <div className="min-w-0 flex-1">
      <h1 className="m-0 break-words text-xl font-medium leading-tight sm:text-2xl">{subject || "(No subject)"}</h1>
      <div className="mt-2 flex items-center gap-2">
        {onToggleImportant ? <button type="button" onClick={onToggleImportant} aria-label={important ? "Mark unimportant" : "Mark important"} aria-pressed={important === true} title={important ? "Mark unimportant" : "Mark important"} className={`inline-grid h-6 w-6 place-items-center ${important ? "text-primary" : "text-muted-foreground"} hover:text-primary`}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill={important ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"><path d="M3 5h12l6 7-6 7H3l6-7-6-7Z" /></svg></button> : null}
        <span className="inline-flex rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{folder}</span>
      </div>
    </div>
    <MoveToBinButton label={subject || "email"} onClick={onDelete} />
  </header>;
}

function EmailSenderRow({ sender, to, cc, createdAt, action }: { sender: string; to: string; cc?: string; createdAt: string; action?: React.ReactNode }) {
  const name = senderLabel(sender);
  const address = senderAddress(sender);
  return <div className="mt-8 flex min-w-0 items-start gap-3">
    <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{initials(name)}</span>
    <div className="min-w-0 flex-1">
      <p className="m-0 break-words text-sm"><strong className="font-semibold">{name}</strong>{address ? <span className="ml-1 text-muted-foreground">&lt;{address}&gt;</span> : null}</p>
      <p className="m-0 mt-0.5 break-words text-xs text-muted-foreground">to {to || "—"}</p>
      {cc ? <p className="m-0 mt-0.5 break-words text-xs text-muted-foreground">Cc {cc}</p> : null}
      <time dateTime={createdAt} className="mt-1 block text-xs text-muted-foreground sm:hidden">{dateLabel(createdAt)}</time>
    </div>
    <time dateTime={createdAt} className="hidden shrink-0 text-xs text-muted-foreground sm:block">{dateLabel(createdAt)}</time>
    {action}
  </div>;
}

const EMAIL_TAB_ICONS = {
  inbox: LuInbox,
  updates: LuRefreshCw,
  drafts: LuFileText,
  messages: LuSend,
  bin: LuTrash2,
  templates: LuLayoutTemplate,
  lists: LuUsers,
};

function EmailFolderTabs({ active, sentCount, draftCount, binCount, composeOpen, onCompose, onSelect }: { active: EmailTab; sentCount: number; draftCount: number; binCount: number; composeOpen: boolean; onCompose: () => void; onSelect: (tab: EmailTab) => void }) {
  return <nav aria-label="Email folders" className="border-r border-border pr-2 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto">
    <div className="grid gap-0.5">
      <button type="button" onClick={onCompose} aria-expanded={composeOpen} aria-label={composeOpen ? "Close composer" : "Compose email"} className={`${NAV_TEXT} !w-auto !min-h-9 h-9 justify-self-start !text-primary-foreground bg-primary px-2.5 text-sm hover:bg-primary/90 focus-visible:bg-primary/90`}><LuPlus aria-hidden="true" className="h-4 w-4 shrink-0" /><span>Compose</span></button>
      {EMAIL_TABS.map((item) => { const Icon = EMAIL_TAB_ICONS[item.key]; const current = active === item.key; const folder = item.key === "messages" ? "sent" : item.key; const href = `/admin/email?folder=${folder}`; const count = item.key === "messages" ? sentCount : item.key === "drafts" ? draftCount : item.key === "bin" ? binCount : 0; return <Link key={item.key} href={href} aria-current={current ? "page" : undefined} onClick={(event) => { event.preventDefault(); onSelect(item.key); }} className={`${NAV_TEXT} ${current ? NAV_ACTIVE : ""}`}><Icon aria-hidden="true" className="h-5 w-5 shrink-0 nav:h-4 nav:w-4" /><span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{item.label}</span>{count ? <span className="ml-auto grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">{count}</span> : null}</Link>; })}
    </div>
  </nav>;
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

async function getInbox<T>(query = ""): Promise<T> {
  const token = await firebaseAuth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in to read email.");
  const response = await fetch(`/api/email/inbox${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const result = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "Couldn’t load received email.");
  return result;
}

async function getSender(): Promise<string> {
  const token = await firebaseAuth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in to compose email.");
  const response = await fetch("/api/email/sender", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const result = (await response.json().catch(() => ({}))) as { from?: string; error?: string };
  if (!response.ok || !result.from) throw new Error(result.error || "Couldn’t load the sender address.");
  return result.from;
}

function RecipientChip({ item, onRemove }: { item: Recipient; onRemove: () => void }) {
  return (
    <span className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md bg-muted px-1.5 text-sm font-medium">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-background text-[10px] font-bold text-primary">
        {item.kind === "group" ? <LuUsers aria-hidden="true" className="h-3.5 w-3.5" /> : initials(item.label)}
      </span>
      <span className="truncate">{item.label}</span>
      <button type="button" aria-label={`Remove ${item.label}`} onClick={onRemove} className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground">
        <LuX aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

export function ComposeEmail({ templates, initialTemplate, initialDraft, staffUid, onDraftSaved, onDraftRemoved, onSent, onClose, registerSave, showGroups = true, allowEmailAddresses = true }: { templates: SavedTemplate[]; initialTemplate?: SavedTemplate | null; initialDraft?: EmailDraft | null; staffUid: string; onDraftSaved: (draft: EmailDraft) => void; onDraftRemoved: (id: string) => void; onSent: () => void; onClose: () => void; registerSave: (save: (() => Promise<boolean>) | null) => void; showGroups?: boolean; allowEmailAddresses?: boolean }) {
  const { users } = useFirestoreUsers();
  const [recipients, setRecipients] = React.useState<Recipient[]>(initialDraft?.recipients ?? []);
  const [query, setQuery] = React.useState(initialDraft?.query ?? "");
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [templateKey, setTemplateKey] = React.useState(initialDraft?.templateKey ?? initialTemplate?.key ?? "blank");
  const [subject, setSubject] = React.useState(initialDraft?.subject ?? initialTemplate?.subject ?? "");
  const [message, setMessage] = React.useState(initialDraft?.message ?? initialTemplate?.message ?? "");
  const [from, setFrom] = React.useState("");
  const [fromError, setFromError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [draftSaveState, setDraftSaveState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const draftIdRef = React.useRef(initialDraft?.id ?? "");
  const saveQueueRef = React.useRef<Promise<void>>(Promise.resolve());
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const editVersionRef = React.useRef(0);
  const [minimized, setMinimized] = React.useState(false);
  const [maximized, setMaximized] = React.useState(false);
  const [formattingOpen, setFormattingOpen] = React.useState(false);
  const [status, setStatus] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const pickerRef = React.useRef<HTMLDivElement>(null);
  const messageTemplates = templates.filter((item) => item.kind === "message" && item.published);

  React.useEffect(() => {
    let cancelled = false;
    void getSender()
      .then((sender) => { if (!cancelled) setFrom(sender); })
      .catch((cause) => { if (!cancelled) setFromError(cause instanceof Error ? cause.message : "Couldn’t load the sender address."); });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (initialDraft || !initialTemplate) return;
    setTemplateKey(initialTemplate.key);
    setSubject(initialTemplate.subject);
    setMessage(initialTemplate.message);
  }, [initialDraft, initialTemplate]);

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
    ...(allowEmailAddresses && EMAIL_PATTERN.test(needle) ? [{ kind: "email", address: needle, label: needle } as Recipient] : []),
    ...(showGroups ? MESSAGE_GROUPS.filter((item) => !needle || item.label.toLowerCase().includes(needle)).map((item) => ({ kind: "group" as const, key: item.key, label: item.label })) : []),
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

  const persistDraft = React.useCallback(async (): Promise<boolean> => {
    if (!draftIdRef.current && !recipients.length && !query.trim() && !subject.trim() && !richTextHasContent(message)) return true;
    if (!staffUid) { setDraftSaveState("error"); return false; }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const id = draftIdRef.current || window.crypto.randomUUID();
    const draft: EmailDraft = { id, recipients, query, subject, message, templateKey, updatedAt: new Date().toISOString() };
    const version = editVersionRef.current;
    draftIdRef.current = id;
    setDraftSaveState("saving");
    const save = saveQueueRef.current.catch(() => {}).then(() => saveEmailDraft(draft));
    saveQueueRef.current = save;
    try {
      await save;
      onDraftSaved(draft);
      if (version === editVersionRef.current) setDraftSaveState("saved");
      return true;
    } catch {
      if (version === editVersionRef.current) setDraftSaveState("error");
      return false;
    }
  }, [staffUid, recipients, query, subject, message, templateKey, onDraftSaved]);

  React.useEffect(() => {
    registerSave(persistDraft);
    return () => registerSave(null);
  }, [persistDraft, registerSave]);

  React.useEffect(() => {
    if (!staffUid || (!draftIdRef.current && !recipients.length && !query.trim() && !subject.trim() && !richTextHasContent(message))) return;
    editVersionRef.current += 1;
    setDraftSaveState("saving");
    saveTimerRef.current = setTimeout(() => { saveTimerRef.current = null; void persistDraft(); }, 600);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); saveTimerRef.current = null; };
  }, [staffUid, recipients, query, subject, message, templateKey, persistDraft]);

  const send = async () => {
    const hasMessage = Boolean(subject.trim() && richTextHasContent(message));
    if (!hasMessage || !recipients.length || !from || busy || (!allowEmailAddresses && (addresses.length || EMAIL_PATTERN.test(needle)))) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    setBusy(true);
    setStatus(null);
    try {
      await persistDraft();
      const result = await postEmail({ groups, uids, addresses, subject, message, email: true, inApp: false, push: false });
      if (draftIdRef.current) {
        const sentDraftId = draftIdRef.current;
        try {
          await saveQueueRef.current.catch(() => {});
          await removeEmailDraft(sentDraftId);
          onDraftRemoved(sentDraftId);
        } catch {
          setDraftSaveState("error");
        }
        draftIdRef.current = "";
      }
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
  const canSend = Boolean(subject.trim() && richTextHasContent(message) && recipients.length && from && !busy && (allowEmailAddresses || (!addresses.length && !EMAIL_PATTERN.test(needle))));

  return (
    <section className={`fixed z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-[0_12px_40px_rgba(0,0,0,0.22)] ${maximized ? "inset-3 h-auto w-auto sm:inset-5" : `bottom-3 right-3 w-[calc(100vw-1.5rem)] sm:bottom-4 sm:right-4 sm:w-[min(32rem,calc(100vw-2rem))] ${minimized ? "h-14" : "h-[min(29rem,calc(100dvh-5rem))]"}`}`} aria-label="Compose email">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 bg-muted px-4 sm:px-5">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="m-0 shrink-0 text-item-title font-semibold">{initialDraft ? "Draft" : "New Message"}</h2>
          {draftSaveState === "saved" ? <span className="min-w-0 truncate text-xs text-muted-foreground">Saved in Drafts</span> : draftSaveState === "saving" ? <span className="min-w-0 truncate text-xs text-muted-foreground">Saving draft…</span> : draftSaveState === "error" ? <span className="min-w-0 truncate text-xs text-destructive">Draft could not be saved</span> : null}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button type="button" onClick={() => { setMinimized((value) => !value); setMaximized(false); }} aria-label={minimized ? "Restore composer" : "Minimize composer"} title={minimized ? "Restore composer" : "Minimize composer"} className="grid h-9 w-9 place-items-center rounded-md hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><LuMinus aria-hidden="true" className="h-4 w-4" /></button>
          <button type="button" onClick={() => { setMaximized((value) => !value); setMinimized(false); }} aria-label={maximized ? "Restore composer size" : "Maximize composer"} title={maximized ? "Restore composer size" : "Maximize composer"} className="grid h-9 w-9 place-items-center rounded-md hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{maximized ? <LuMinimize2 aria-hidden="true" className="h-4 w-4" /> : <LuMaximize2 aria-hidden="true" className="h-4 w-4" />}</button>
          <button type="button" onClick={() => { void persistDraft().then((saved) => { if (saved) onClose(); }); }} aria-label="Close composer" title="Close composer" className="grid h-9 w-9 place-items-center rounded-md hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><LuX aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </div>

      <div className={`min-h-0 flex-1 flex-col ${minimized ? "hidden" : "flex"}`}>
        <div className="flex h-11 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-5">
          <span className="w-10 shrink-0 text-sm text-muted-foreground">From</span>
          <span className={`min-w-0 truncate text-sm ${fromError ? "text-destructive" : "text-foreground"}`} title={from || fromError || undefined}>{from || fromError || "Loading sender…"}</span>
          {fromError ? <button type="button" onClick={() => { setFromError(""); void getSender().then(setFrom).catch((cause) => setFromError(cause instanceof Error ? cause.message : "Couldn’t load the sender address.")); }} className="ml-auto shrink-0 text-xs font-semibold text-primary hover:underline">Retry</button> : null}
        </div>
        <div className="flex min-h-14 shrink-0 items-center gap-3 border-b border-border px-4 focus-within:border-primary sm:px-5">
          <span id="email-to" className="shrink-0 text-sm text-muted-foreground">To</span>
          <div ref={pickerRef} className="relative min-w-0 flex-1">
            <div className="flex min-h-12 max-h-24 flex-wrap items-center gap-1.5 overflow-y-auto py-1 focus-within:outline-none" onClick={() => setPickerOpen(true)}>
              {recipients.map((item) => <RecipientChip key={recipientId(item)} item={item} onRemove={() => setRecipients((current) => current.filter((other) => recipientId(other) !== recipientId(item)))} />)}
              <input aria-labelledby="email-to" value={query} onChange={(event) => { setQuery(event.target.value); setPickerOpen(true); }} onFocus={() => setPickerOpen(true)} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === ",") && options[0]) { event.preventDefault(); addRecipient(options[0]); } else if (event.key === "Backspace" && !query && recipients.length) setRecipients((current) => current.slice(0, -1)); }} disabled={busy} placeholder={recipients.length ? "Add another…" : showGroups ? "People, groups or email address" : allowEmailAddresses ? "User or email address" : "Search users"} className="h-8 min-w-[8rem] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            </div>
            {pickerOpen && options.length ? <ul role="listbox" className="absolute left-0 right-0 top-full z-30 m-0 mt-1 max-h-64 list-none overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
              {options.map((item) => <li key={recipientId(item)} role="option" aria-selected={false}><button type="button" onClick={() => addRecipient(item)} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-[10px] font-bold text-primary">{item.kind === "group" ? <LuUsers aria-hidden="true" className="h-3.5 w-3.5" /> : initials(item.label)}</span><span className="min-w-0 truncate font-medium">{item.kind === "email" ? `Send to ${item.address}` : item.label}</span></button></li>)}
            </ul> : null}
          </div>
        </div>

        <div className="flex h-14 shrink-0 items-center border-b border-border px-4 focus-within:border-primary sm:px-5">
          <label htmlFor="email-subject" className="sr-only">Subject</label>
          <input id="email-subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} disabled={busy} className="h-full w-full min-w-0 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground" placeholder="Subject" />
        </div>

        <div className="min-h-0 flex-1 px-4 py-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary/30 sm:px-5">
          <RichTextEditor hideLabel label="Message" value={message} onChange={setMessage} disabled={busy} allowMessageButton composer showToolbar={formattingOpen} placeholder="Write your email…" />
        </div>

        {status ? <p role="status" className={`m-0 px-4 text-sm sm:px-5 ${status.tone === "error" ? "text-destructive" : "text-muted-foreground"}`}>{status.text}</p> : null}
        <div className="flex min-h-16 shrink-0 items-center gap-2 border-t border-border px-4 py-2 sm:px-5">
          <button type="button" onClick={() => void send()} disabled={!canSend} className="inline-flex h-10 shrink-0 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Sending…" : "Send"}</button>
          <button type="button" onClick={() => setFormattingOpen((value) => !value)} aria-label="Formatting options" aria-expanded={formattingOpen} title="Formatting options" className={`grid h-10 w-10 shrink-0 place-items-center rounded-md text-lg font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${formattingOpen ? "bg-muted text-foreground" : "text-muted-foreground"}`}>Aa</button>
          <div className="min-w-0 shrink-0">
            <label htmlFor="email-template" className="sr-only">Message template</label>
            <Select value={templateKey} onValueChange={applyTemplate} disabled={busy}>
              <SelectTrigger id="email-template" aria-label="Message template" className="h-10 w-12 shrink-0 rounded-md border-0 px-1 text-sm text-foreground shadow-none hover:bg-muted sm:w-36 sm:px-2">
                <LuLayoutTemplate aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="hidden min-w-0 flex-1 text-left sm:block"><SelectValue /></span>
              </SelectTrigger>
              <SelectContent align="end" className="z-[60] max-h-[min(24rem,calc(100dvh-4rem))] max-w-[calc(100vw-2rem)]">
                <SelectItem value="blank" className="text-sm">Blank email</SelectItem>
                {templateKey !== "blank" && !messageTemplates.some((item) => item.key === templateKey) ? <SelectItem value={templateKey} className="text-sm">Saved draft template</SelectItem> : null}
                {messageTemplates.map((item) => <SelectItem key={item.key} value={item.key} className="text-sm">{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <span className="ml-auto hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:block" aria-label={`${plainLength} of ${MAX_MESSAGE} characters`}>{plainLength} / {MAX_MESSAGE}</span>
        </div>
      </div>
    </section>
  );
}

function InboxList({ emails, loading, error, selected, detailLoading, detailError, selectedId, view, hasMore, loadingMore, onLoadMore, onDelete, onBulkDelete }: {
  emails: ReceivedEmailSummary[]; loading: boolean; error: string; selected: ReceivedEmailDetail | null; detailLoading: boolean; detailError: string; selectedId?: string; view: ViewMode; hasMore: boolean; loadingMore: boolean; onLoadMore: () => void; onDelete: (item: ReceivedEmailSummary) => void; onBulkDelete: (items: ReceivedEmailSummary[]) => void;
}) {
  const href = (id: string) => `${TAB_HREFS.inbox}/${encodeURIComponent(id)}`;
  const [checkedIds, setCheckedIds] = React.useState<Set<string>>(() => new Set());
  const [flags, setFlags] = React.useState<InboxFlagsById>({});
  const [flagsError, setFlagsError] = React.useState("");
  React.useEffect(() => subscribeInboxFlags(setFlags, () => setFlagsError("Couldn’t load shared email markers.")), []);
  React.useEffect(() => {
    const visibleIds = new Set(emails.map((item) => item.id));
    setCheckedIds((current) => [...current].every((id) => visibleIds.has(id)) ? current : new Set([...current].filter((id) => visibleIds.has(id))));
  }, [emails]);
  const toggleFlag = (id: string, key: keyof InboxFlags) => {
    const current = flags[id] ?? { starred: false, important: false };
    const next = { ...current, [key]: !current[key] };
    setFlags((items) => ({ ...items, [id]: next }));
    setFlagsError("");
    void saveInboxFlags(id, next).catch(() => {
      setFlags((items) => ({ ...items, [id]: current }));
      setFlagsError("Couldn’t save the email marker. Try again.");
    });
  };
  const openEmail = selected?.id === selectedId ? selected : null;
  if (selectedId) return openEmail ? <article className="min-w-0" aria-label="Received email details">
    <EmailDetailHeader folder="Inbox" href={TAB_HREFS.inbox} subject={openEmail.subject} onDelete={() => onDelete(openEmail)} important={flags[openEmail.id]?.important} onToggleImportant={() => toggleFlag(openEmail.id, "important")} />
    <EmailSenderRow sender={openEmail.from} to={openEmail.to.join(", ")} cc={openEmail.cc.join(", ")} createdAt={openEmail.createdAt} action={<button type="button" onClick={() => toggleFlag(openEmail.id, "starred")} aria-label={flags[openEmail.id]?.starred ? "Unstar email" : "Star email"} aria-pressed={flags[openEmail.id]?.starred === true} title={flags[openEmail.id]?.starred ? "Unstar" : "Star"} className={`inline-grid h-9 w-9 shrink-0 place-items-center ${flags[openEmail.id]?.starred ? "text-amber-500" : "text-muted-foreground"} hover:text-amber-500`}><LuStar aria-hidden="true" className="h-5 w-5" fill={flags[openEmail.id]?.starred ? "currentColor" : "none"} /></button>} />
    {flagsError ? <p role="alert" className="mt-3 text-sm text-destructive">{flagsError}</p> : null}
    <div className="mt-7 min-h-24 whitespace-pre-wrap break-words text-[15px] leading-7 sm:ml-[52px]">{openEmail.body || "(No message body)"}</div>
    {openEmail.attachments.length ? <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground sm:ml-[52px]">Attachments: {openEmail.attachments.map((item) => item.filename || "File").join(", ")}</p> : null}
  </article> : <section className="min-w-0" aria-label="Received email details"><div className="flex items-center gap-3"><BackToEmailList href={TAB_HREFS.inbox} /><p role={detailError ? "alert" : "status"} className={`m-0 text-sm ${detailError ? "text-destructive" : "text-muted-foreground"}`}>{detailError || (detailLoading ? "Loading message…" : "This email is no longer in Inbox.")}</p></div></section>;
  const checkedEmails = emails.filter((item) => checkedIds.has(item.id));
  const allChecked = emails.length > 0 && checkedEmails.length === emails.length;
  const toolbar = <div className="flex min-h-11 items-center justify-between gap-4 border-b border-border px-4">
    <div className="flex items-center gap-3">
      <input type="checkbox" checked={allChecked} onChange={() => setCheckedIds(allChecked ? new Set() : new Set(emails.map((item) => item.id)))} aria-label="Select all visible email" className="h-4 w-4 cursor-pointer accent-primary" />
      {checkedEmails.length ? <button type="button" onClick={() => onBulkDelete(checkedEmails)} aria-label={`Move ${checkedEmails.length} selected emails to Bin`} title="Move selected to Bin" className="inline-grid h-9 w-9 place-items-center text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><LuTrash2 aria-hidden="true" className="h-4 w-4" /></button> : null}
      {checkedEmails.length ? <span className="text-sm text-muted-foreground">{checkedEmails.length} selected</span> : null}
    </div>
    <span className="text-sm tabular-nums text-muted-foreground">{emails.length ? `1–${emails.length} of ${emails.length}${hasMore ? "+" : ""}` : "0 emails"}</span>
  </div>;
  return <div className="grid gap-4">
    {flagsError ? <p role="alert" className="m-0 text-sm text-destructive">{flagsError}</p> : null}
    {loading ? <p role="status" className="py-12 text-center text-sm text-muted-foreground">Loading received email…</p>
      : error ? <div role="alert" className={`${PANEL} text-sm text-destructive`}>{error}</div>
        : !emails.length && !selectedId && view === "cards" ? <EmptyState title="No received emails" description="Messages sent to this inbox will appear here." />
          : view === "cards" ? <CardGrid>{emails.map((item) => <li key={item.id} className={`${PANEL} relative min-w-0`}><Link href={href(item.id)} className="block min-w-0 pr-9 text-foreground no-underline"><div className="flex items-start justify-between gap-3"><p className="m-0 min-w-0 truncate font-semibold">{item.from}</p><time dateTime={item.createdAt} className="shrink-0 text-xs text-muted-foreground">{mailDateLabel(item.createdAt)}</time></div><p className="m-0 mt-2 truncate text-sm">{item.subject || "(No subject)"}</p><p className="m-0 mt-3 truncate text-xs text-muted-foreground">To {item.to.join(", ")}</p></Link><div className="absolute right-3 top-3"><MoveToBinButton label={item.subject || "email"} onClick={() => onDelete(item)} /></div></li>)}</CardGrid>
            : <>
              <MobileRows>{emails.length ? emails.map((item) => <MobileRow key={item.id} href={href(item.id)} title={item.subject || "(No subject)"} detail={`${item.from} · ${dateLabel(item.createdAt)}`} actions={<MoveToBinButton label={item.subject || "email"} onClick={() => onDelete(item)} />} />) : <li className={`${PANEL} list-none text-sm text-muted-foreground`}>No received emails yet.</li>}</MobileRows>
              <EmailWorkspaceTable label="Received email" columns={["From", "Subject", "Received", "Actions"]} columnWidths={["w-[35%]", "w-[46%]", "w-[12%]", "w-[7%]"]} toolbar={toolbar} rows={emails.map((item): EmailWorkspaceTableRow => ({ id: item.id, label: `Open ${item.subject || "email"}`, primary: <div className="flex min-w-0 items-center gap-2"><input type="checkbox" checked={checkedIds.has(item.id)} onChange={() => setCheckedIds((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })} aria-label={`Select ${item.subject || "email"}`} className="h-4 w-4 shrink-0 cursor-pointer accent-primary" /><button type="button" onClick={() => toggleFlag(item.id, "starred")} aria-label={`${flags[item.id]?.starred ? "Unstar" : "Star"} ${item.subject || "email"}`} aria-pressed={flags[item.id]?.starred === true} className={`inline-grid h-7 w-7 shrink-0 place-items-center ${flags[item.id]?.starred ? "text-amber-500" : "text-muted-foreground"} hover:text-amber-500`}><LuStar aria-hidden="true" className="h-5 w-5" fill={flags[item.id]?.starred ? "currentColor" : "none"} /></button><button type="button" onClick={() => toggleFlag(item.id, "important")} aria-label={`${flags[item.id]?.important ? "Mark unimportant" : "Mark important"} ${item.subject || "email"}`} aria-pressed={flags[item.id]?.important === true} className={`inline-grid h-7 w-7 shrink-0 place-items-center ${flags[item.id]?.important ? "text-amber-500" : "text-muted-foreground"} hover:text-amber-500`}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill={flags[item.id]?.important ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"><path d="M3 5h12l6 7-6 7H3l6-7-6-7Z" /></svg></button><span className="min-w-0 truncate">{senderLabel(item.from)}</span></div>, secondary: <><span className="font-semibold">{item.subject || "(No subject)"}</span>{item.preview ? <span className="font-normal text-muted-foreground"> — {item.preview}</span> : null}</>, tertiary: <time dateTime={item.createdAt} className="block text-right">{mailDateLabel(item.createdAt)}</time>, href: href(item.id), selected: selectedId === item.id, action: <MoveToBinButton label={item.subject || "email"} onClick={() => onDelete(item)} /> }))} emptyTitle="No received emails" emptyDescription="Messages sent to this inbox will appear here." />
            </>}
    {hasMore && !loading && !error ? <div className="text-center"><button type="button" onClick={onLoadMore} disabled={loadingMore} className="h-9 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50">{loadingMore ? "Loading…" : "Load older"}</button></div> : null}
  </div>;
}

function SentList({ history, selectedId, view, onDelete }: { history: SentMessage[]; selectedId?: string; view: ViewMode; onDelete: (item: SentMessage) => void }) {
  const selected = selectedId ? history.find((item) => item.id === selectedId) : null;
  if (selectedId) return selected ? <article className="min-w-0" aria-label="Sent email details">
    <EmailDetailHeader folder="Sent" href={TAB_HREFS.messages} subject={selected.subject} onDelete={() => onDelete(selected)} />
    <EmailSenderRow sender={selected.sentByName} to={selected.toLabel || "—"} createdAt={selected.createdAt} />
    <RichTextContent value={selected.message} className="mt-7 text-[15px] leading-7 sm:ml-[52px]" />
    <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground sm:ml-[52px]">{selected.emailed} emailed</p>
  </article> : <section className="min-w-0" aria-label="Sent email details"><div className="flex items-center gap-3"><BackToEmailList href={TAB_HREFS.messages} /><p className="m-0 text-sm text-muted-foreground">This email is no longer in Sent.</p></div></section>;
  return <div className="grid gap-4">
    {view === "cards" ? history.length ? <CardGrid>{history.map((item) => <li key={item.id} className={`${PANEL} relative min-w-0 transition hover:border-foreground/30 ${selectedId === item.id ? "border-primary" : ""}`}><Link href={`${TAB_HREFS.messages}/${encodeURIComponent(item.id)}`} className="block min-w-0 pr-9 text-foreground no-underline"><div className="flex items-start justify-between gap-3"><p className="m-0 min-w-0 truncate font-semibold">{item.subject}</p><time className="shrink-0 text-xs text-muted-foreground" dateTime={item.createdAt}>{dateLabel(item.createdAt)}</time></div><p className="m-0 mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{messageHtmlToPlainText(item.message)}</p><p className="m-0 mt-4 text-xs text-muted-foreground">To {item.toLabel || "—"} · {item.emailed} emailed</p></Link><div className="absolute right-3 top-3"><MoveToBinButton label={item.subject || "email"} onClick={() => onDelete(item)} /></div></li>)}</CardGrid> : <EmptyState title="Nothing sent yet" description="Emails sent from this workspace will appear here." /> : <>
      <MobileRows>{history.length ? history.map((item) => <MobileRow key={item.id} href={`${TAB_HREFS.messages}/${encodeURIComponent(item.id)}`} title={item.subject} chip={`${item.people} ${item.people === 1 ? "person" : "people"}`} detail={`${item.toLabel || "No recipients"} · ${dateLabel(item.createdAt)}`} status={<span className="text-sm text-muted-foreground">{item.emailed} emailed</span>} actions={<MoveToBinButton label={item.subject || "email"} onClick={() => onDelete(item)} />} />) : <li className={`${PANEL} list-none text-sm text-muted-foreground`}>Nothing sent yet.</li>}</MobileRows>
      <EmailWorkspaceTable label="Sent email history" columns={["To", "Subject", "Sent", "Actions"]} rows={history.map((item): EmailWorkspaceTableRow => ({ id: item.id, label: `Open ${item.subject || "email"}`, primary: item.toLabel || `${item.people} ${item.people === 1 ? "person" : "people"}`, secondary: <><span className="font-semibold">{item.subject || "(No subject)"}</span>{item.message ? <span className="text-muted-foreground"> — {messageHtmlToPlainText(item.message)}</span> : null}</>, tertiary: <time dateTime={item.createdAt}>{mailDateLabel(item.createdAt)}</time>, href: `${TAB_HREFS.messages}/${encodeURIComponent(item.id)}`, selected: selectedId === item.id, action: <MoveToBinButton label={item.subject || "email"} onClick={() => onDelete(item)} /> }))} emptyTitle="Nothing sent yet" emptyDescription="Emails sent from this workspace will appear here." />
    </>}
  </div>;
}

function EmptyFolderTable({ tab }: { tab: EmailTab }) {
  const copy = "No email updates are available in this folder.";
  return <div className="grid gap-4">
    <MobileRows><li className={`${PANEL} list-none`}><h2 className="m-0 text-item-title font-semibold">No {TAB_LABELS[tab].toLowerCase()} emails</h2><p className="m-0 mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p></li></MobileRows>
    <EmailWorkspaceTable label={`${TAB_LABELS[tab]} email`} columns={["From", "Subject", "Updated", "Actions"]} rows={[]} emptyTitle={`No ${TAB_LABELS[tab].toLowerCase()} emails`} emptyDescription={copy} />
  </div>;
}

function BinList({ items, onRestore }: { items: EmailBinItem[]; onRestore: (item: EmailBinItem) => void }) {
  const sourceLabel = (source: EmailBinItem["source"]) => source === "sent" ? "Sent" : source === "draft" ? "Drafts" : "Inbox";
  const restoreButton = (item: EmailBinItem) => <RestoreButton label={item.subject || "email"} onClick={() => onRestore(item)} />;
  return <div className="grid gap-4">
    <MobileRows>{items.length ? items.map((item) => <MobileRow key={item.id} title={item.subject || "(No subject)"} chip={sourceLabel(item.source)} detail={`${item.correspondent} · ${dateLabel(item.deletedAt)}`} actions={restoreButton(item)} />) : <li className={`${PANEL} list-none text-sm text-muted-foreground`}>Bin is empty.</li>}</MobileRows>
    <EmailWorkspaceTable label="Deleted email" columns={["From / To", "Subject", "Deleted", "Actions"]} rows={items.map((item): EmailWorkspaceTableRow => ({ id: item.id, label: item.subject || "Deleted email", primary: item.correspondent, secondary: <><span className="font-semibold">{item.subject || "(No subject)"}</span><span className="text-muted-foreground"> — {sourceLabel(item.source)}</span></>, tertiary: <time dateTime={item.deletedAt}>{dateLabel(item.deletedAt)}</time>, action: restoreButton(item) }))} emptyTitle="Bin is empty" emptyDescription="Emails moved to Bin will appear here." />
  </div>;
}

function DraftsList({ drafts, view, onOpen, onMoveToBin }: { drafts: EmailDraft[]; view: ViewMode; onOpen: (draft: EmailDraft) => void; onMoveToBin: (draft: EmailDraft) => void }) {
  const recipientLabel = (draft: EmailDraft) => [draft.recipients.map((item) => item.label).join(", "), draft.query].filter(Boolean).join(", ") || "No recipients";
  const binButton = (draft: EmailDraft) => <MoveToBinButton label={draft.subject || "draft"} onClick={() => onMoveToBin(draft)} />;
  return view === "cards" ? drafts.length ? <CardGrid>{drafts.map((draft) => <li key={draft.id} className={`${PANEL} relative min-w-0 !p-0`}><button type="button" onClick={() => onOpen(draft)} className="block w-full min-w-0 rounded-xl p-5 pr-14 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="block truncate font-semibold">{draft.subject || "(No subject)"}</span><span className="mt-1 block truncate text-sm text-muted-foreground">To {recipientLabel(draft)}</span><span className="mt-3 line-clamp-2 text-sm text-muted-foreground">{messageHtmlToPlainText(draft.message) || "No message yet"}</span><span className="mt-3 block text-xs text-muted-foreground">Saved {dateLabel(draft.updatedAt)}</span></button><div className="absolute right-3 top-3">{binButton(draft)}</div></li>)}</CardGrid> : <EmptyState title="No drafts yet" description="Messages you start are saved to the shared Drafts folder as you write." /> : <>
    <MobileRows>{drafts.length ? drafts.map((draft) => <li key={draft.id} className={`${PANEL} relative min-w-0 list-none !p-0`}><button type="button" onClick={() => onOpen(draft)} className="block w-full min-w-0 rounded-xl p-5 pr-14 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="block truncate font-semibold">{draft.subject || "(No subject)"}</span><span className="mt-1 block truncate text-sm text-muted-foreground">To {recipientLabel(draft)}</span><span className="mt-2 block text-xs text-muted-foreground">Saved {dateLabel(draft.updatedAt)}</span></button><div className="absolute right-3 top-3">{binButton(draft)}</div></li>) : <li className={`${PANEL} list-none text-sm text-muted-foreground`}>No drafts yet.</li>}</MobileRows>
    <EmailWorkspaceTable label="Saved email drafts" columns={["To", "Subject", "Updated", "Actions"]} rows={drafts.map((draft): EmailWorkspaceTableRow => ({ id: draft.id, label: `Open ${draft.subject || "draft"}`, primary: recipientLabel(draft), secondary: <><span className="font-semibold">{draft.subject || "(No subject)"}</span>{draft.message ? <span className="text-muted-foreground"> — {messageHtmlToPlainText(draft.message)}</span> : null}</>, tertiary: <time dateTime={draft.updatedAt}>{dateLabel(draft.updatedAt)}</time>, onOpen: () => onOpen(draft), action: binButton(draft) }))} emptyTitle="No drafts yet" emptyDescription="Messages you start are saved to the shared Drafts folder as you write." />
  </>;
}

function TemplatesList({ templates, onUse, view }: { templates: SavedTemplate[]; onUse: (template: SavedTemplate) => void; view: ViewMode }) {
  const rows = templates.filter((item) => item.kind === "message" && item.published);
  const useButton = (item: SavedTemplate, className = "") => <button type="button" onClick={() => onUse(item)} aria-label={`Use ${item.label} template`} title={`Use ${item.label} template`} className={`inline-grid h-9 w-9 place-items-center text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}><LuLayoutTemplate aria-hidden="true" className="h-5 w-5" /></button>;
  const tableRows: EmailWorkspaceTableRow[] = rows.map((item) => ({
    id: item.key,
    label: `Use ${item.label} template`,
    onOpen: () => onUse(item),
    primary: item.label,
    secondary: item.description,
    tertiary: useButton(item),
  }));
  return view === "cards" ? rows.length ? <CardGrid>{rows.map((item) => <li key={item.key} className={`${PANEL} min-w-0`}><p className="m-0 font-semibold">{item.label}</p><p className="m-0 mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>{useButton(item, "mt-4")}</li>)}</CardGrid> : <EmptyState title="No templates yet" description="Published message templates will appear here." /> : <>
    <MobileRows>{rows.length ? rows.map((item) => <MobileRow key={item.key} title={item.label} detail={item.description} actions={useButton(item)} />) : <li className={`${PANEL} list-none text-sm text-muted-foreground`}>No templates yet.</li>}</MobileRows>
    <EmailWorkspaceTable label="Email templates" columns={["Template", "Description", "Action"]} rows={tableRows} emptyTitle="No templates yet" emptyDescription="Published message templates will appear here." />
  </>;
}

function Lists({ users, view, groups = MESSAGE_GROUPS }: { users: { role?: string | null }[]; view: ViewMode; groups?: typeof MESSAGE_GROUPS }) {
  const count = (role: string) => users.filter((person) => person.role === role).length;
  const rows = groups.map((group) => ({ group, people: group.key === "everyone" ? users.filter((person) => person.role !== "pending").length : group.key === "team" ? count("admin") + count("manager") : group.key === "creators" ? count("creator") : count("client") }));
  const tableRows: EmailWorkspaceTableRow[] = rows.map(({ group, people }) => ({ id: group.key, label: group.label, primary: group.label, secondary: "Available in the email composer", tertiary: <span className="font-semibold text-foreground tabular-nums">{people}</span> }));
  return view === "cards" ? rows.length ? <CardGrid>{rows.map(({ group, people }) => <li key={group.key} className={`${PANEL} min-w-0`}><div className="flex items-center justify-between gap-3"><h2 className="m-0 text-item-title font-semibold">{group.label}</h2><LuUsers aria-hidden="true" className="h-5 w-5 text-muted-foreground" /></div><p className="m-0 mt-2 text-3xl font-bold tabular-nums">{people}</p><p className="m-0 mt-1 text-sm text-muted-foreground">people available in this audience</p></li>)}</CardGrid> : <EmptyState title="No audience lists" description="No audience lists match your search." /> : <>
    <MobileRows>{rows.length ? rows.map(({ group, people }) => <MobileRow key={group.key} title={group.label} chip={`${people} ${people === 1 ? "person" : "people"}`} detail="Available in the email composer" />) : <li className={`${PANEL} list-none text-sm text-muted-foreground`}>No audience lists match your search.</li>}</MobileRows>
    <EmailWorkspaceTable label="Email audience lists" columns={["Audience", "Use", "People"]} rows={tableRows} emptyTitle="No audience lists" emptyDescription="No audience lists match your search." />
  </>;
}

export function EmailWorkspace({ initialTab = "inbox", initialMessageId }: { initialTab?: EmailTab; initialMessageId?: string }) {
  const { role, actualUser, loading: authLoading } = useAuth();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [history, setHistory] = React.useState<SentMessage[]>([]);
  const [inbox, setInbox] = React.useState<ReceivedEmailSummary[]>([]);
  const [inboxLoading, setInboxLoading] = React.useState(true);
  const [inboxError, setInboxError] = React.useState("");
  const [inboxHasMore, setInboxHasMore] = React.useState(false);
  const [inboxLoadingMore, setInboxLoadingMore] = React.useState(false);
  const [selectedInbox, setSelectedInbox] = React.useState<ReceivedEmailDetail | null>(null);
  const [inboxDetailLoading, setInboxDetailLoading] = React.useState(Boolean(initialMessageId && initialTab === "inbox"));
  const [inboxDetailError, setInboxDetailError] = React.useState("");
  const [drafts, setDrafts] = React.useState<EmailDraft[]>([]);
  const [draftsLoading, setDraftsLoading] = React.useState(true);
  const [binItems, setBinItems] = React.useState<EmailBinItem[]>([]);
  const [binLoading, setBinLoading] = React.useState(true);
  const [binError, setBinError] = React.useState("");
  const [templates, setTemplates] = React.useState<SavedTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<EmailTab>(initialTab);
  const [openMessageId, setOpenMessageId] = React.useState(initialMessageId);
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [composeNonce, setComposeNonce] = React.useState(0);
  const [activeDraft, setActiveDraft] = React.useState<EmailDraft | null>(null);
  const [pendingBinItems, setPendingBinItems] = React.useState<EmailBinCandidate[]>([]);
  const [movingToBin, setMovingToBin] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<SavedTemplate | null>(null);
  const [draftError, setDraftError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<"recent" | "title">("recent");
  const [view, setView] = useListView("email", "table");
  const composerSaveRef = React.useRef<(() => Promise<boolean>) | null>(null);
  const registerComposerSave = React.useCallback((save: (() => Promise<boolean>) | null) => { composerSaveRef.current = save; }, []);
  const isStaff = role === "admin" || role === "manager";
  const staffUid = actualUser?.uid ?? "";

  const loadInbox = React.useCallback(async () => {
    if (!isStaff || !staffUid) return;
    setInboxLoading(true);
    setInboxError("");
    try {
      const result = await getInbox<{ emails: ReceivedEmailSummary[]; hasMore: boolean }>();
      setInbox(result.emails);
      setInboxHasMore(result.hasMore);
    } catch (cause) {
      setInboxError(cause instanceof Error ? cause.message : "Couldn’t load received email.");
    } finally {
      setInboxLoading(false);
    }
  }, [isStaff, staffUid]);

  const loadMoreInbox = async () => {
    if (!inboxHasMore || inboxLoadingMore || !inbox.length) return;
    setInboxLoadingMore(true);
    setInboxError("");
    try {
      const result = await getInbox<{ emails: ReceivedEmailSummary[]; hasMore: boolean }>(`?after=${encodeURIComponent(inbox[inbox.length - 1].id)}`);
      setInbox((current) => [...current, ...result.emails.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setInboxHasMore(result.hasMore);
    } catch (cause) {
      setInboxError(cause instanceof Error ? cause.message : "Couldn’t load older email.");
    } finally {
      setInboxLoadingMore(false);
    }
  };

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
  React.useEffect(() => { if (!authLoading && isStaff && staffUid) void loadInbox(); }, [authLoading, isStaff, staffUid, loadInbox]);
  React.useEffect(() => {
    if (!openMessageId || activeTab !== "inbox" || !isStaff || !staffUid) { setSelectedInbox(null); setInboxDetailError(""); return; }
    let cancelled = false;
    setSelectedInbox(null);
    setInboxDetailLoading(true);
    setInboxDetailError("");
    void getInbox<{ email: ReceivedEmailDetail }>(`?id=${encodeURIComponent(openMessageId)}`)
      .then((result) => { if (!cancelled) setSelectedInbox(result.email); })
      .catch((cause) => { if (!cancelled) setInboxDetailError(cause instanceof Error ? cause.message : "Couldn’t load this message."); })
      .finally(() => { if (!cancelled) setInboxDetailLoading(false); });
    return () => { cancelled = true; };
  }, [openMessageId, activeTab, isStaff, staffUid]);
  React.useEffect(() => { setActiveTab(initialTab); }, [initialTab]);
  React.useEffect(() => { setOpenMessageId(initialMessageId); }, [initialMessageId]);
  React.useEffect(() => {
    if (!staffUid || !isStaff) { setDraftsLoading(false); return; }
    let cancelled = false;
    let unsubscribe = () => {};
    setDraftsLoading(true);
    void migrateEmailDrafts(staffUid)
      .then((saved) => {
        if (cancelled) return;
        setDrafts(saved);
        setDraftError("");
        unsubscribe = subscribeEmailDrafts(
          (updated) => { if (!cancelled) setDrafts(updated); },
          () => { if (!cancelled) setDraftError("Couldn’t keep shared drafts up to date. Refresh to try again."); },
        );
      })
      .catch(() => { if (!cancelled) { setDrafts(readEmailDrafts(staffUid)); setDraftError("Couldn’t sync drafts with the workspace. Your earlier browser drafts are still available here."); } })
      .finally(() => { if (!cancelled) setDraftsLoading(false); });
    return () => { cancelled = true; unsubscribe(); };
  }, [staffUid, isStaff]);

  React.useEffect(() => {
    if (!staffUid || !isStaff) { setBinLoading(false); return; }
    setBinLoading(true);
    return subscribeEmailBin(
      (items) => { setBinItems(items); setBinError(""); setBinLoading(false); },
      () => { setBinError("Couldn’t load the shared Bin. Refresh to try again."); setBinLoading(false); },
    );
  }, [staffUid, isStaff]);

  const onDraftSaved = React.useCallback((draft: EmailDraft) => {
    setDrafts((current) => [draft, ...current.filter((item) => item.id !== draft.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }, []);
  const onDraftRemoved = React.useCallback((id: string) => {
    setDrafts((current) => current.filter((item) => item.id !== id));
  }, []);

  const saveOpenComposer = async () => !composeOpen || await (composerSaveRef.current?.() ?? Promise.resolve(false));

  const useTemplate = (template: SavedTemplate) => {
    void saveOpenComposer().then((saved) => {
      if (!saved) return;
      setActiveDraft(null);
      setSelectedTemplate(template);
      setComposeNonce((current) => current + 1);
      setComposeOpen(true);
    });
  };

  const openDraft = (draft: EmailDraft) => {
    void saveOpenComposer().then((saved) => {
      if (!saved) return;
      setSelectedTemplate(null);
      setActiveDraft(draft);
      setComposeOpen(true);
    });
  };

  const requestMoveToBin = (input: EmailBinCandidate | EmailBinCandidate[]) => {
    const items = Array.isArray(input) ? input : [input];
    if (items.some((item) => item.source === "draft" && activeDraft?.id === item.sourceId && composeOpen)) {
      setDraftError("Close the open draft before moving it to Bin.");
      return;
    }
    setDraftError("");
    setBinError("");
    setPendingBinItems(items);
  };

  const confirmMoveToBin = async () => {
    if (!pendingBinItems.length || movingToBin) return;
    setMovingToBin(true);
    const results = await Promise.allSettled(pendingBinItems.map(moveEmailToBin));
    const moved = results.filter((result): result is PromiseFulfilledResult<EmailBinItem> => result.status === "fulfilled").map((result) => result.value);
    if (moved.length) {
      setBinItems((current) => [...moved, ...current.filter((item) => !moved.some((entry) => entry.id === item.id))]);
      setDrafts((current) => current.filter((item) => !moved.some((entry) => entry.source === "draft" && entry.sourceId === item.id)));
    }
    if (results.every((result) => result.status === "fulfilled")) {
      setDraftError("");
      setBinError("");
    } else {
      setBinError("Some selected emails couldn’t be moved to Bin. Try again.");
    }
    setPendingBinItems([]);
    setMovingToBin(false);
  };

  const restoreFromBin = async (item: EmailBinItem) => {
    try {
      await restoreEmailFromBin(item);
      setBinItems((current) => current.filter((entry) => entry.id !== item.id));
      if (item.draft) setDrafts((current) => [item.draft!, ...current.filter((draft) => draft.id !== item.sourceId)]);
      setBinError("");
    } catch {
      setBinError("Couldn’t restore the email. Try again.");
    }
  };

  const closeComposer = () => {
    setComposeOpen(false);
    setActiveDraft(null);
    setSelectedTemplate(null);
  };

  const onSent = () => {
    closeComposer();
    void load();
  };

  const selectTab = React.useCallback((next: EmailTab) => {
    setActiveTab(next);
    setOpenMessageId(undefined);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.pathname = "/admin/email";
    url.searchParams.set("folder", next === "messages" ? "sent" : next);
    window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}`);
  }, []);

  const query = search.trim().toLowerCase();
  const binnedIds = new Set(binItems.map((item) => item.id));
  const visibleHistory = React.useMemo(() => history
    .filter((item) => !binnedIds.has(`sent_${item.id}`) && (!query || [item.subject, item.toLabel, messageHtmlToPlainText(item.message)].join(" ").toLowerCase().includes(query)))
    .sort((a, b) => sort === "title" ? a.subject.localeCompare(b.subject) : b.createdAt.localeCompare(a.createdAt)), [history, binItems, query, sort]);
  const visibleInbox = React.useMemo(() => inbox
    .filter((item) => !binnedIds.has(`inbox_${item.id}`) && (!query || [item.from, item.to.join(" "), item.subject].join(" ").toLowerCase().includes(query)))
    .sort((a, b) => sort === "title" ? a.subject.localeCompare(b.subject) : b.createdAt.localeCompare(a.createdAt)), [inbox, binItems, query, sort]);
  const visibleTemplates = React.useMemo(() => templates
    .filter((item) => item.kind === "message" && item.published)
    .filter((item) => !query || [item.label, item.description, item.subject].join(" ").toLowerCase().includes(query))
    .sort((a, b) => sort === "title" ? a.label.localeCompare(b.label) : a.label.localeCompare(b.label)), [templates, query, sort]);
  const visibleGroups = React.useMemo(() => MESSAGE_GROUPS.filter((group) => !query || group.label.toLowerCase().includes(query)), [query]);
  const visibleDrafts = React.useMemo(() => drafts
    .filter((draft) => !binnedIds.has(`draft_${draft.id}`) && (!query || [draft.subject, draft.recipients.map((item) => item.label).join(" "), draft.query, messageHtmlToPlainText(draft.message)].join(" ").toLowerCase().includes(query)))
    .sort((a, b) => sort === "title" ? a.subject.localeCompare(b.subject) : b.updatedAt.localeCompare(a.updatedAt)), [drafts, binItems, query, sort]);
  const visibleBin = binItems.filter((item) => !query || [item.subject, item.correspondent, item.source].join(" ").toLowerCase().includes(query));

  if (authLoading || usersLoading || loading || draftsLoading || binLoading) return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 sm:px-8"><div className="h-7 w-40 animate-pulse rounded bg-muted" /><div className="mt-6 h-48 animate-pulse rounded-xl bg-muted" /></main>;
  if (!isStaff) return <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-8 sm:px-8"><PageHeader title="Email" /><p className="mt-6 text-sm text-muted-foreground">Only admins and managers can use email.</p></main>;

  const tab = activeTab;
  const detailId = (tab === "inbox" || tab === "messages") ? openMessageId : undefined;
  const heading = tab === "messages" ? "Sent" : TAB_LABELS[tab];
  const listTab = tab === "inbox" || tab === "messages" || tab === "drafts" || tab === "templates" || tab === "lists";
  const resultCount = tab === "inbox" ? inboxLoading ? "Loading…" : plural(visibleInbox.length, "email") : tab === "messages" ? plural(visibleHistory.length, "message") : tab === "drafts" ? plural(visibleDrafts.length, "draft") : tab === "bin" ? plural(visibleBin.length, "email") : tab === "templates" ? plural(visibleTemplates.length, "template") : tab === "lists" ? plural(visibleGroups.length, "list") : plural(0, "email");
  const searchPlaceholder = tab === "inbox" ? "Search inbox" : tab === "messages" ? "Search sent email" : tab === "drafts" ? "Search drafts" : tab === "bin" ? "Search bin" : tab === "templates" ? "Search templates" : tab === "lists" ? "Search lists" : "Search email";

  return <DashboardListPage title={heading} showHeader={false}>
    <div className="grid gap-6 pt-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
      <EmailFolderTabs
        active={tab}
        sentCount={history.filter((item) => !binnedIds.has(`sent_${item.id}`)).length}
        draftCount={drafts.filter((item) => !binnedIds.has(`draft_${item.id}`)).length}
        binCount={binItems.length}
        composeOpen={composeOpen}
        onCompose={() => {
          if (composeOpen) { void saveOpenComposer().then((saved) => { if (saved) closeComposer(); }); }
          else { setActiveDraft(null); setSelectedTemplate(null); setComposeNonce((current) => current + 1); setComposeOpen(true); }
        }}
        onSelect={selectTab}
      />
      <div className="min-w-0">
        {!detailId ? <FilterBar
          panelId="admin-email-list"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={searchPlaceholder}
          sortOptions={EMAIL_SORTS}
          activeSort={sort}
          onSortChange={setSort}
          resultCount={resultCount}
          view={listTab ? view : undefined}
          onViewChange={listTab ? setView : undefined}
        /> : null}

        <div className="mt-6">
          {binError ? <p role="alert" className="mb-3 text-sm text-destructive">{binError}</p> : null}
          {tab === "drafts" && draftError ? <p role="alert" className="mb-3 text-sm text-destructive">{draftError}</p> : null}
          {tab === "inbox" ? <InboxList emails={visibleInbox} loading={inboxLoading} error={inboxError} selected={detailId && binnedIds.has(`inbox_${detailId}`) ? null : selectedInbox} detailLoading={inboxDetailLoading} detailError={inboxDetailError} selectedId={detailId} view={view} hasMore={inboxHasMore} loadingMore={inboxLoadingMore} onLoadMore={() => { void loadMoreInbox(); }} onDelete={(item) => requestMoveToBin({ source: "inbox", sourceId: item.id, subject: item.subject, correspondent: item.from, originalAt: item.createdAt })} onBulkDelete={(items) => requestMoveToBin(items.map((item) => ({ source: "inbox", sourceId: item.id, subject: item.subject, correspondent: item.from, originalAt: item.createdAt })))} />
            : tab === "messages" ? <SentList history={detailId ? history.filter((item) => !binnedIds.has(`sent_${item.id}`)) : visibleHistory} selectedId={detailId} view={view} onDelete={(item) => requestMoveToBin({ source: "sent", sourceId: item.id, subject: item.subject, correspondent: item.toLabel || "No recipients", originalAt: item.createdAt })} />
              : tab === "drafts" ? <DraftsList drafts={visibleDrafts} view={view} onOpen={openDraft} onMoveToBin={(draft) => requestMoveToBin({ source: "draft", sourceId: draft.id, subject: draft.subject, correspondent: draft.recipients.map((item) => item.label).join(", ") || "No recipients", originalAt: draft.updatedAt, draft })} />
              : tab === "bin" ? <BinList items={visibleBin} onRestore={(item) => { void restoreFromBin(item); }} />
              : tab === "templates" ? <TemplatesList templates={visibleTemplates} onUse={useTemplate} view={view} />
                : tab === "lists" ? <Lists users={users} groups={visibleGroups} view={view} />
                  : <EmptyFolderTable tab={tab} />}
        </div>
      </div>
    </div>
    {composeOpen ? <ComposeEmail key={activeDraft?.id ?? `new-${composeNonce}`} templates={templates} initialTemplate={selectedTemplate} initialDraft={activeDraft} staffUid={staffUid} onDraftSaved={onDraftSaved} onDraftRemoved={onDraftRemoved} onSent={onSent} onClose={closeComposer} registerSave={registerComposerSave} /> : null}
    <Dialog open={pendingBinItems.length > 0} onOpenChange={(open) => { if (!open && !movingToBin) setPendingBinItems([]); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move to Bin?</DialogTitle>
          <DialogDescription>{pendingBinItems.length > 1 ? `${pendingBinItems.length} emails will be moved to the shared Bin. You can restore them later.` : pendingBinItems[0]?.subject ? `“${pendingBinItems[0].subject}” will be moved to the shared Bin. You can restore it later.` : "This email will be moved to the shared Bin. You can restore it later."}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <button type="button" onClick={() => setPendingBinItems([])} disabled={movingToBin} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={() => void confirmMoveToBin()} disabled={movingToBin} className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 disabled:opacity-50">{movingToBin ? "Moving…" : "Move to Bin"}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </DashboardListPage>;
}
