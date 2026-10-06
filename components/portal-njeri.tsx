"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { PanelLeft, Send } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { usePortalClient } from "@/components/portal-shell";
import { FormattedContent } from "@/components/njeri/njeri-formatted-content";
import { NjeriHistorySidebar } from "@/components/njeri/njeri-history-sidebar";
import type { NjeriConversation } from "@/components/njeri/types";
import { firebaseDb } from "@/lib/firebase/client";
import { readJobsFromFirestore } from "@/lib/firebase/client-content";
import { INVOICES_COLLECTION, type Invoice } from "@/lib/invoices";
import { jobTitle } from "@/lib/jobs";
import { NJERI_DRAFT_KEY, createClientJob, type JobBrief } from "@/lib/portal-jobs";

type PortalMessage = { id: string; role: "user" | "assistant"; text: string; timestamp: number; jobDraft?: JobBrief | null; postedSlug?: string };
type PortalConversation = Omit<NjeriConversation, "messages"> & { messages: PortalMessage[] };


const WELCOME: PortalMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hi, I’m Njeri. Ask me about your jobs, invoices or company, or tell me what you need and I’ll help you post a job.",
  timestamp: 0,
};
const SUGGESTIONS = ["I want to post a job", "What jobs are active?", "Do we have any invoices due?"];

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function storageKey(uid: string) {
  return `bbdo_portal_njeri_${uid}`;
}

function load(uid: string): PortalConversation[] {
  try {
    const raw = window.localStorage.getItem(storageKey(uid));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(uid: string, conversations: PortalConversation[]) {
  try {
    window.localStorage.setItem(storageKey(uid), JSON.stringify(conversations.slice(0, 50)));
  } catch {
    // Storage can be full or blocked; the chat still works for this visit.
  }
}

function freshConversation(): PortalConversation {
  const now = Date.now();
  return { id: newId(), title: "New chat", createdAt: now, updatedAt: now, messages: [WELCOME] };
}

/** Njeri in the client portal, as a full page with chat history. */
export function PortalNjeri() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const portal = usePortalClient();
  const uid = user?.uid ?? "";
  const [conversations, setConversations] = React.useState<PortalConversation[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [posting, setPosting] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (!uid) return;
    const stored = load(uid);
    const list = stored.length ? stored : [freshConversation()];
    setConversations(list);
    setActiveId(list[0].id);
  }, [uid]);

  React.useEffect(() => {
    if (uid && conversations.length) save(uid, conversations);
  }, [conversations, uid]);

  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, typing]);

  const updateActive = (change: (conversation: PortalConversation) => PortalConversation, id = activeId) =>
    setConversations((list) => list.map((conversation) => (conversation.id === id ? change(conversation) : conversation)).sort((a, b) => b.updatedAt - a.updatedAt));

  // The client's own account, so Njeri can answer from real data.
  const accountSummary = React.useCallback(async () => {
    const clientId = portal?.clientId;
    if (!clientId) return {};
    const [jobs, invoices] = await Promise.all([
      readJobsFromFirestore().then((all) => all.filter((job) => job.clientId === clientId)).catch(() => []),
      getDocs(query(collection(firebaseDb, INVOICES_COLLECTION), where("clientId", "==", clientId), where("status", "in", ["sent", "paid"])))
        .then((snapshot) => snapshot.docs.map((item) => item.data() as Invoice))
        .catch(() => [] as Invoice[]),
    ]);
    return {
      company: portal?.client ? { name: portal.client.name, industry: portal.client.industry, location: portal.client.location, timezone: portal.client.timezone } : null,
      jobs: jobs.slice(0, 40).map((job) => ({ title: jobTitle(job), status: job.status, category: job.category, start: job.startDate, end: job.endDate, budget: job.fee, tags: job.requiredSkills })),
      invoices: invoices.slice(0, 40).map((invoice) => ({ number: invoice.number, for: invoice.description, job: invoice.jobName, amount: `${invoice.currency} ${invoice.amount}`, status: invoice.status === "paid" ? "paid" : "due", issued: invoice.issueDate, due: invoice.dueDate, paidAt: invoice.paidAt })),
    };
  }, [portal?.clientId, portal?.client]);

  const send = async (raw: string, target: PortalConversation | null = active) => {
    const textValue = raw.trim();
    if (!textValue || typing || !target) return;
    const userMessage: PortalMessage = { id: newId(), role: "user", text: textValue, timestamp: Date.now() };
    const history = [...target.messages.filter((message) => message.id !== "welcome"), userMessage];
    setInput("");
    setTyping(true);
    updateActive((conversation) => ({
      ...conversation,
      title: conversation.title === "New chat" ? textValue.slice(0, 48) : conversation.title,
      updatedAt: Date.now(),
      messages: [...conversation.messages, userMessage],
    }), target.id);
    try {
      const response = await fetch("/api/njeri/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map((message) => ({ role: message.role, content: message.text })), account: await accountSummary() }),
      });
      const data = await response.json().catch(() => ({}));
      const reply: PortalMessage = { id: newId(), role: "assistant", text: data.answer || data.error || "I can’t answer right now.", timestamp: Date.now(), jobDraft: data.jobDraft ?? null };
      updateActive((conversation) => ({ ...conversation, updatedAt: Date.now(), messages: [...conversation.messages, reply] }), target.id);
    } catch {
      updateActive((conversation) => ({ ...conversation, messages: [...conversation.messages, { id: newId(), role: "assistant", text: "I can’t answer right now. Please try again.", timestamp: Date.now() }] }), target.id);
    } finally {
      setTyping(false);
    }
  };

  // "Create with Njeri" from Post a job opens a new chat that starts the brief.
  React.useEffect(() => {
    if (startedRef.current || !uid || !conversations.length || searchParams.get("start") !== "job") return;
    startedRef.current = true;
    const conversation = freshConversation();
    setConversations((list) => [conversation, ...list]);
    setActiveId(conversation.id);
    router.replace("/portal/njeri");
    void send("I want to post a job", conversation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, conversations.length, searchParams]);

  const newChat = () => {
    const conversation = freshConversation();
    setConversations((list) => [conversation, ...list]);
    setActiveId(conversation.id);
    setHistoryOpen(false);
  };

  const postDraft = async (message: PortalMessage) => {
    if (!message.jobDraft || !portal || !user || posting) return;
    setPosting(message.id);
    try {
      const slug = await createClientJob(message.jobDraft, { slug: portal.clientId, name: portal.client?.name ?? portal.clientId }, { uid: user.uid, name: user.name ?? user.email ?? null });
      updateActive((conversation) => ({ ...conversation, messages: conversation.messages.map((item) => (item.id === message.id ? { ...item, postedSlug: slug } : item)) }));
    } catch (cause) {
      console.error("Unable to post job", cause);
      window.alert("Couldn’t post the job. Try again.");
    } finally {
      setPosting(null);
    }
  };

  const editDraft = (draft: JobBrief) => {
    try {
      window.sessionStorage.setItem(NJERI_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // If storage is blocked the form just opens empty.
    }
    router.push("/portal/jobs/new?from=njeri");
  };

  const history = (
    <NjeriHistorySidebar
      conversations={conversations as unknown as NjeriConversation[]}
      activeId={activeId}
      onSelectConversation={(id) => { setActiveId(id); setHistoryOpen(false); }}
      onNewChat={newChat}
      onBack={() => setHistoryOpen(false)}
      onDeleteConversation={(id) => setConversations((list) => {
        const next = list.filter((conversation) => conversation.id !== id);
        const safe = next.length ? next : [freshConversation()];
        if (id === activeId) setActiveId(safe[0].id);
        return safe;
      })}
      onRenameConversation={(id, title) => setConversations((list) => list.map((conversation) => (conversation.id === id ? { ...conversation, title } : conversation)))}
    />
  );

  return (
    <div className="relative flex h-[calc(100dvh-170px)] min-h-[420px] overflow-hidden rounded-xl border border-border bg-background nav:h-[calc(100dvh-120px)]">
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">{history}</aside>
      {historyOpen ? <div className="absolute inset-0 z-30 bg-background md:hidden">{history}</div> : null}

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 md:hidden">
          <button type="button" onClick={() => setHistoryOpen(true)} aria-label="Chat history" className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"><PanelLeft aria-hidden="true" className="h-4 w-4" /></button>
          <span className="truncate text-sm font-medium">{active?.title ?? "Njeri"}</span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {active?.messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                <FormattedContent text={message.text} isUser={message.role === "user"} />
                {message.jobDraft ? (
                  <div className="mt-3 rounded-xl border border-border bg-background p-3 text-foreground">
                    <p className="m-0 text-sm font-semibold">{message.jobDraft.title}</p>
                    <p className="m-0 mt-1 text-xs text-muted-foreground">
                      {[message.jobDraft.category, message.jobDraft.workSetup, message.jobDraft.estimatedLength, message.jobDraft.budget].filter(Boolean).join(" · ")}
                    </p>
                    {message.jobDraft.tags.length ? <p className="m-0 mt-1 text-xs text-muted-foreground">{message.jobDraft.tags.join(", ")}</p> : null}
                    {message.postedSlug ? (
                      <Link href={`/portal/jobs/${encodeURIComponent(message.postedSlug)}`} className="mt-3 inline-flex text-sm font-semibold text-primary">Posted. Open the job →</Link>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => void postDraft(message)} disabled={posting === message.id} className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{posting === message.id ? "Posting…" : "Post job"}</button>
                        <button type="button" onClick={() => editDraft(message.jobDraft!)} className="h-9 rounded-md border border-border px-3 text-sm font-semibold hover:border-foreground">Edit in form</button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {typing ? <div className="flex justify-start"><div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">Njeri is typing…</div></div> : null}
          {active && active.messages.length <= 1 ? (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-foreground">{suggestion}</button>
              ))}
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void send(input); }} className="flex items-end gap-2 border-t border-border p-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(input); } }}
            rows={1}
            placeholder="Ask Njeri…"
            aria-label="Message Njeri"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button type="submit" disabled={!input.trim() || typing} aria-label="Send" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Send aria-hidden="true" className="h-4 w-4" /></button>
        </form>
      </section>
    </div>
  );
}
