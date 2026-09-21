"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { useOptionalAuth } from "@/components/auth-provider";
import { QUICK_PROMPTS, getAnswer } from "@/lib/njeri-assistant";
import type { NjeriActionProposal, NjeriResponse } from "@/lib/njeri-actions";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
  action?: NjeriActionProposal | null;
};

function NjeriMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 6V3.9" />
      <circle cx="12" cy="2.6" r="1.1" fill="currentColor" stroke="none" />
      <rect x="3.25" y="6" width="17.5" height="13" rx="4.5" />
      <circle cx="9" cy="13" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FormattedContent({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  const paragraphs = text.split("\n\n");

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split("\n");
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const isBullet = line.startsWith("• ");
              const content = isBullet ? line.slice(2) : line;

              // Parse bold elements formatted as **bold**
              const parts = content.split(/(\*\*.*?\*\*)/g);

              const renderedParts = parts.map((part, partIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={partIdx} className="font-semibold text-foreground">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              });

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 pl-1">
                    <span className="shrink-0 text-primary">•</span>
                    <span>{renderedParts}</span>
                  </div>
                );
              }

              return <p key={lIdx}>{renderedParts}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "record";
}

async function availableSlug(collectionName: "users" | "clients", value: string): Promise<string> {
  const base = slugify(value);
  let slug = base;
  let suffix = 2;
  while ((await getDoc(doc(firebaseDb, collectionName, slug))).exists()) slug = `${base}-${suffix++}`;
  return slug;
}

function ActionCard({ action, onConfirm }: { action: NjeriActionProposal; onConfirm: () => void }) {
  const isCreator = action.type === "create_creator";
  const title = isCreator ? "Creator draft" : "Client draft";
  const record = action.record;
  const status = action.status ?? "pending";

  return (
    <div className="mt-3 rounded-xl border border-primary/25 bg-background p-3 text-xs shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm text-foreground">{title}</strong>
        {status === "saved" ? <span className="font-semibold text-green-700">Saved</span> : null}
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{record.name}</p>
      <p className="mt-1 text-muted-foreground">
        {action.type === "create_creator"
          ? [action.record.category, action.record.location, action.record.title].filter(Boolean).join(" · ") || "Research details included"
          : [action.record.industry, action.record.date].filter(Boolean).join(" · ") || "Research details included"}
      </p>
      {action.sources.length ? (
        <p className="mt-2 truncate text-[11px] text-muted-foreground">Sources: {action.sources.join(", ")}</p>
      ) : null}
      {action.error ? <p className="mt-2 text-destructive">{action.error}</p> : null}
      {status === "pending" ? (
        <button
          type="button"
          onClick={onConfirm}
          className="mt-3 rounded-lg bg-primary px-3 py-2 font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Confirm and add {isCreator ? "to creators" : "client"}
        </button>
      ) : null}
    </div>
  );
}

export default function WorkspaceAssistant() {
  const auth = useOptionalAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hello! I'm Njeri, your guide to BBDO West Africa. You can ask me simple questions about our company, our projects, or current campaigns.",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, isTyping, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const updateAction = (messageId: number, action: NjeriActionProposal) => {
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, action } : message));
  };

  const confirmAction = async (messageId: number, action: NjeriActionProposal) => {
    if (!auth?.user) {
      updateAction(messageId, { ...action, status: "failed", error: "Please sign in before saving a record." });
      return;
    }

    updateAction(messageId, { ...action, status: "saving", error: undefined });
    try {
      if (action.type === "create_creator") {
        const slug = await availableSlug("users", action.record.name);
        await setDoc(doc(firebaseDb, "users", slug), {
          slug,
          name: action.record.name.trim(),
          role: "creator",
          roles: ["creator"],
          title: action.record.title || "",
          department: action.record.department || "",
          category: action.record.category || "Content",
          tags: [],
          location: action.record.location || "",
          entity: "Freelancer",
          dayRate: "",
          rateMin: null,
          rateCurrency: "NGN",
          hideRate: true,
          terms: "",
          availability: "unconfirmed",
          clearance: "pending",
          vetted: false,
          vouchedBy: "Njeri research draft",
          workedOn: [],
          yearsActive: action.record.yearsActive,
          portfolio: action.record.portfolio,
          behance: null,
          email: action.record.email,
          phone: action.record.phone,
          profileImage: action.record.profileImage,
          addedAt: new Date().toISOString(),
          featuredImage: null,
          workHistory: action.record.workHistory ?? [],
          linkedin: action.record.linkedin,
          instagram: action.record.instagram,
          contactNote: null,
          followerCount: action.record.followerCount,
          followerPlatform: action.record.followerPlatform,
          gender: null,
          age: null,
          niche: action.record.niche,
          lastEngaged: null,
          craftNote: action.record.craftNote || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const slug = await availableSlug("clients", action.record.name);
        await setDoc(doc(firebaseDb, "clients", slug), {
          type: "client",
          slug,
          name: action.record.name.trim(),
          date: action.record.date || null,
          industry: action.record.industry || "Other",
          profileImage: action.record.profileImage,
          description: action.record.description,
          targetAudience: action.record.targetAudience,
          creatorSlugs: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      updateAction(messageId, { ...action, status: "saved", error: undefined });
    } catch (cause) {
      console.error("Unable to save Njeri draft", cause);
      updateAction(messageId, {
        ...action,
        status: "failed",
        error: "I prepared the draft, but your account is not allowed to save this record. Please ask an admin or use the dashboard action.",
      });
    }
  };

  const sendQuestion = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || isTyping) return;

    const userMessage: ChatMessage = { id: Date.now(), role: "user", text };
    const history = [...messages, userMessage].map((message) => ({ role: message.role, content: message.text }));
    setMessages((current) => [...current, userMessage]);
    setIsTyping(true);

    let responseText: string;
    let responseAction: NjeriActionProposal | null | undefined;
    try {
      const response = await fetch("/api/njeri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || typeof data?.answer !== "string") {
        throw new Error(data?.error || `Njeri API responded ${response.status}`);
      }
      responseText = data.answer;
      responseAction = (data as NjeriResponse).action;
    } catch (cause) {
      console.error("Njeri model unavailable, using canned answers", cause);
      responseText = getAnswer(text);
    }

    setMessages((current) => [
      ...current,
      { id: Date.now() + 1, role: "assistant", text: responseText, action: responseAction },
    ]);
    setIsTyping(false);
  };

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    void sendQuestion(input);
    setInput("");
  };

  const handleChipClick = (question: string) => {
    void sendQuestion(question);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Njeri"
        className="fixed bottom-4 right-4 z-50 grid h-14 w-14 place-items-center rounded-lg bg-background text-foreground shadow-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      >
        <NjeriMark className="h-6 w-6" />
      </button>
    );
  }

  return (
    <aside
      aria-label="Njeri"
      className="fixed bottom-4 right-4 z-50 flex h-[min(34rem,calc(100dvh-2rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[400px]"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <NjeriMark className="h-4 w-4" />
        </div>
        <div>
          <span className="text-sm font-semibold text-foreground">Njeri</span>
          <span className="block text-[11px] font-normal text-muted-foreground">BBDO West Africa Assistant</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close Njeri"
          className="ml-auto grid h-8 w-8 flex-none place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex"}>
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <FormattedContent text={message.text} isUser={message.role === "user"} />
              {message.role === "assistant" && message.action ? (
                <ActionCard action={message.action} onConfirm={() => void confirmAction(message.id, message.action!)} />
              ) : null}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex">
            <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-3.5 py-2 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.15s]" />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.3s]" />
              <span className="ml-1 text-[11px]">Njeri is thinking...</span>
            </div>
          </div>
        )}

        {/* Quick Question Chips */}
        <div className="pt-2">
          <div className="mb-2 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Suggested questions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => handleChipClick(prompt.question)}
                disabled={isTyping}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-border bg-background p-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about company, projects, campaigns..."
          aria-label="Ask Njeri a question"
          autoComplete="off"
          disabled={isTyping}
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/40 disabled:opacity-50 sm:text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          aria-label="Send"
          className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}

