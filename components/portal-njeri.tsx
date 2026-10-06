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
import { NjeriJobIntakeForm } from "@/components/njeri/njeri-job-intake-form";
import type { NjeriConversation } from "@/components/njeri/types";
import { firebaseDb } from "@/lib/firebase/client";
import { readJobsFromFirestore } from "@/lib/firebase/client-content";
import { INVOICES_COLLECTION, type Invoice } from "@/lib/invoices";
import { jobTitle } from "@/lib/jobs";
import { JOB_INTAKE_FIELDS, type JobIntakeAnswers, type JobIntakeForm } from "@/lib/njeri-job-form";
import { createClientJob, type JobBrief } from "@/lib/portal-jobs";

type PortalMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  jobForm?: JobIntakeForm | null;
  formSubmitted?: boolean;
  formAnswers?: JobIntakeAnswers;
  jobDraft?: JobBrief | null;
  postedSlug?: string;
  saveFailed?: boolean;
};
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

function jobFlow(messages: PortalMessage[], justSubmitted: boolean) {
  const formIndex = messages.findLastIndex((message) => Boolean(message.jobForm));
  const postedIndex = messages.findLastIndex((message) => Boolean(message.postedSlug));
  if (formIndex < 0 || postedIndex > formIndex) return { stage: "start", formAnswers: {} };
  const submission = messages.slice(formIndex + 1).find((message) => message.formAnswers);
  if (!submission) return { stage: "form_pending", formAnswers: {} };
  return { stage: justSubmitted ? "form_submitted" : "details", formAnswers: submission.formAnswers ?? {} };
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
  const composerRef = React.useRef<HTMLTextAreaElement>(null);
  const startedRef = React.useRef(false);
  const sendingRef = React.useRef(false);
  const postingRef = React.useRef(false);

  const resizeComposer = React.useCallback(() => {
    const field = composerRef.current;
    if (!field) return;
    const styles = window.getComputedStyle(field);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
    const padding = (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0);
    const border = (Number.parseFloat(styles.borderTopWidth) || 0) + (Number.parseFloat(styles.borderBottomWidth) || 0);
    const maxHeight = lineHeight * 4 + padding + border;
    field.style.height = "auto";
    field.style.overflowY = "hidden";
    const nextHeight = field.scrollHeight + border;
    field.style.height = `${Math.min(nextHeight, maxHeight)}px`;
    field.style.overflowY = nextHeight > maxHeight ? "auto" : "hidden";
  }, []);

  React.useEffect(() => { resizeComposer(); }, [input, resizeComposer]);
  React.useEffect(() => {
    window.addEventListener("resize", resizeComposer);
    return () => window.removeEventListener("resize", resizeComposer);
  }, [resizeComposer]);

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

  const send = async (raw: string, target: PortalConversation | null = active, submission?: { formMessageId: string; answers: JobIntakeAnswers }) => {
    const textValue = raw.trim();
    if (!textValue || sendingRef.current || !target) return;
    sendingRef.current = true;
    const userMessage: PortalMessage = { id: newId(), role: "user", text: textValue, timestamp: Date.now(), formAnswers: submission?.answers };
    const history = [...target.messages.filter((message) => message.id !== "welcome"), userMessage];
    const flow = jobFlow(history, Boolean(submission));
    setInput("");
    setTyping(true);
    updateActive((conversation) => ({
      ...conversation,
      title: conversation.title === "New chat" ? textValue.slice(0, 48) : conversation.title,
      updatedAt: Date.now(),
      messages: [
        ...conversation.messages.map((message) => message.id === submission?.formMessageId ? { ...message, formSubmitted: true } : message),
        userMessage,
      ],
    }), target.id);
    try {
      const response = await fetch("/api/njeri/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map((message) => ({ role: message.role, content: message.text })), account: await accountSummary(), jobFlow: flow }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Njeri API responded ${response.status}`);
      const draft: JobBrief | null = flow.stage === "details" && data.jobDraft && typeof data.jobDraft.title === "string" && typeof data.jobDraft.summary === "string"
        ? data.jobDraft as JobBrief : null;
      let postedSlug: string | undefined;
      let saveError = false;
      if (draft) {
        if (!portal || !user) {
          saveError = true;
        } else {
          try {
            postedSlug = await createClientJob(draft, { slug: portal.clientId, name: portal.client?.name ?? portal.clientId }, { uid: user.uid, name: user.name ?? user.email ?? null });
          } catch (cause) {
            console.error("Unable to create job with Njeri", cause);
            saveError = true;
          }
        }
      }
      const reply: PortalMessage = {
        id: newId(),
        role: "assistant",
        text: saveError
          ? "I have the job details, but I couldn’t save it. You can retry below."
          : data.answer || (postedSlug ? "Your job is ready." : "I couldn’t put that together yet. Could you tell me a little more?"),
        timestamp: Date.now(),
        jobForm: data.jobForm ?? null,
        jobDraft: draft,
        postedSlug,
        saveFailed: saveError,
      };
      updateActive((conversation) => ({ ...conversation, updatedAt: Date.now(), messages: [...conversation.messages, reply] }), target.id);
    } catch (cause) {
      console.error("Unable to reach portal Njeri", cause);
      updateActive((conversation) => ({ ...conversation, messages: [...conversation.messages, { id: newId(), role: "assistant", text: "I can’t answer right now. Please try again.", timestamp: Date.now() }] }), target.id);
    } finally {
      sendingRef.current = false;
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

  const submitJobForm = (message: PortalMessage, answers: JobIntakeAnswers) => {
    if (!message.jobForm || message.formSubmitted || typing) return;
    const details = message.jobForm.fields
      .filter((field) => answers[field]?.trim())
      .map((field) => `${JOB_INTAKE_FIELDS[field].label}: ${answers[field]?.trim()}`);
    void send(details.length ? `Job details:\n${details.join("\n")}` : "I’ll describe the job in chat.", active, { formMessageId: message.id, answers });
  };

  const retryDraft = async (message: PortalMessage) => {
    if (!message.jobDraft || !portal || !user || postingRef.current || message.postedSlug) return;
    postingRef.current = true;
    setPosting(message.id);
    try {
      const slug = await createClientJob(message.jobDraft, { slug: portal.clientId, name: portal.client?.name ?? portal.clientId }, { uid: user.uid, name: user.name ?? user.email ?? null });
      updateActive((conversation) => ({ ...conversation, messages: conversation.messages.map((item) => (item.id === message.id ? { ...item, postedSlug: slug, saveFailed: false, text: "The job is ready. Open it below." } : item)) }));
    } catch (cause) {
      console.error("Unable to create job with Njeri", cause);
      updateActive((conversation) => ({ ...conversation, messages: conversation.messages.map((item) => (item.id === message.id ? { ...item, saveFailed: true, text: "I still couldn’t save the job. Please try again." } : item)) }));
    } finally {
      postingRef.current = false;
      setPosting(null);
    }
  };

  const history = (
    <NjeriHistorySidebar
      flat
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
    <div className="relative flex h-full min-h-0 overflow-hidden bg-background">
      <div className="hidden w-64 shrink-0 md:block">{history}</div>
      {historyOpen ? <div className="absolute inset-0 z-30 bg-background md:hidden">{history}</div> : null}

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 md:hidden">
          <button type="button" onClick={() => setHistoryOpen(true)} aria-label="Chat history" className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"><PanelLeft aria-hidden="true" className="h-4 w-4" /></button>
          <span className="truncate text-sm font-medium">{active?.title ?? "Njeri"}</span>
        </div>

        <div aria-live="polite" className="flex-1 space-y-6 overflow-y-auto px-3 py-5 sm:px-6">
          {active?.messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={`max-w-[85%] py-1 text-[15px] leading-relaxed text-foreground ${message.role === "user" ? "text-right" : "text-left"}`}>
                <FormattedContent text={message.text} isUser={message.role === "user"} />
                {message.jobForm ? (
                  <NjeriJobIntakeForm
                    form={message.jobForm}
                    id={message.id}
                    submitted={message.formSubmitted}
                    disabled={typing}
                    onSubmit={(answers) => submitJobForm(message, answers)}
                  />
                ) : null}
                {message.jobDraft ? (
                  <div className="mt-4 border-t border-border pt-4 text-foreground">
                    <p className="m-0 text-sm font-semibold">{message.jobDraft.title}</p>
                    <p className="m-0 mt-1 text-xs text-muted-foreground">
                      {[message.jobDraft.category, message.jobDraft.workSetup, message.jobDraft.estimatedLength, message.jobDraft.budget].filter(Boolean).join(" · ")}
                    </p>
                    {message.jobDraft.tags.length ? <p className="m-0 mt-1 text-xs text-muted-foreground">{message.jobDraft.tags.join(", ")}</p> : null}
                    {message.postedSlug ? (
                      <Link href={`/portal/jobs/${encodeURIComponent(message.postedSlug)}`} className="mt-3 inline-flex text-sm font-semibold text-primary">View the job →</Link>
                    ) : (
                      <button type="button" onClick={() => void retryDraft(message)} disabled={posting === message.id} className="mt-3 h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{posting === message.id ? "Saving…" : message.saveFailed ? "Retry saving" : "Create job"}</button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {typing ? <p className="m-0 py-1 text-sm text-muted-foreground">Njeri is typing…</p> : null}
          {active && active.messages.length <= 1 ? (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="py-1 text-left text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline">{suggestion}</button>
              ))}
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void send(input); }} className="flex items-end gap-2 border-t border-border px-3 py-3 sm:px-6">
          <textarea
            ref={composerRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(input); } }}
            rows={1}
            placeholder="Ask Njeri…"
            aria-label="Message Njeri"
            className="min-h-10 flex-1 resize-none border-0 border-b border-input bg-transparent px-0 py-2 text-sm leading-5 outline-none focus:border-primary"
          />
          <button type="submit" disabled={!input.trim() || typing} aria-label="Send" className="grid h-10 w-10 shrink-0 place-items-center text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40"><Send aria-hidden="true" className="h-4 w-4" /></button>
        </form>
      </section>
    </div>
  );
}
