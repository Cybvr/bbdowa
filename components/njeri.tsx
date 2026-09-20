"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { QUICK_PROMPTS, getAnswer } from "@/lib/njeri-assistant";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
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

export default function WorkspaceAssistant() {
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

  const sendQuestion = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || isTyping) return;

    const userMessage: ChatMessage = { id: Date.now(), role: "user", text };
    const history = [...messages, userMessage].map((message) => ({ role: message.role, content: message.text }));
    setMessages((current) => [...current, userMessage]);
    setIsTyping(true);

    let responseText: string;
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
    } catch (cause) {
      console.error("Njeri model unavailable, using canned answers", cause);
      responseText = getAnswer(text);
    }

    setMessages((current) => [
      ...current,
      { id: Date.now() + 1, role: "assistant", text: responseText },
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
        className="fixed bottom-4 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
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

