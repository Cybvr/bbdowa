"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";

type ChatMessage = { id: number; role: "assistant" | "user"; text: string };

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

export default function WorkspaceAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "assistant", text: "How can I help?" },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // block: "nearest" keeps this inside the message list instead of scrolling
  // the page behind the panel.
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, open]);

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

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text },
      {
        id: Date.now() + 1,
        role: "assistant",
        text: "Thanks. I'm still being set up, so I can't answer that yet.",
      },
    ]);
    setInput("");
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
      className="fixed bottom-4 right-4 z-50 flex h-[min(32rem,calc(100dvh-2rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[380px]"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <NjeriMark className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">Njeri</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close Njeri"
          className="ml-auto grid h-8 w-8 flex-none place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div aria-live="polite" className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex"}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-border p-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Message Njeri"
          aria-label="Message Njeri"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/40 sm:text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send"
          className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}
