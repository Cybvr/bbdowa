"use client";

import { useEffect, useRef, useState } from "react";
import { PanelLeftClose, Send, Sparkles } from "lucide-react";

type ChatMessage = { id: number; role: "assistant" | "user"; text: string };

function NjeriMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.14" />
      <path d="M9 20.5C11.5 23 14 24.25 16 24.25C20.25 24.25 23 20.75 23 16.5C23 12.25 20.25 8.75 16 8.75C12.75 8.75 10 10.5 9 13.25" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <path d="M9 11.5V16.5H14" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20.25" cy="12" r="1.25" fill="currentColor" />
    </svg>
  );
}

export default function WorkspaceAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "assistant", text: "Hi, I’m Njeri. What can I help you find or shape?" },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text },
      { id: Date.now() + 1, role: "assistant", text: "I’ve got it. I can help you navigate the site and work through the next step." },
    ]);
    setInput("");
  };

  return (
    <aside className={`fixed bottom-4 right-4 z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl transition-[width,height] ${open ? "h-[min(38rem,calc(100dvh-2rem))] w-[calc(100vw-2rem)] sm:w-96" : "h-12 w-12"}`}>
      <div className="flex items-center justify-between gap-2 border-b border-border p-3 shrink-0">
        {open && <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><NjeriMark className="h-4 w-4 text-primary" /> Njeri</span>}
        <button onClick={() => setOpen((current) => !current)} aria-label={open ? "Close Njeri" : "Open Njeri"} aria-expanded={open} className="ml-auto grid h-8 w-8 flex-none place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
          {open ? <PanelLeftClose className="h-4 w-4" /> : <NjeriMark className="h-7 w-7 text-primary" />}
        </button>
      </div>
      {open && <>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((message) => <div key={message.id} className={`flex items-start gap-2 ${message.role === "user" ? "justify-end" : ""}`}>
            {message.role === "assistant" && <span className="grid h-7 w-7 flex-none place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary"><Sparkles className="h-3.5 w-3.5" /></span>}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${message.role === "user" ? "rounded-tr-sm bg-primary font-medium text-primary-foreground shadow" : "rounded-tl-sm border border-border bg-muted/60 text-foreground"}`}>{message.text}</div>
          </div>)}
          <div ref={messagesEndRef} />
        </div>
        <div className="shrink-0 border-t border-border bg-card/60 p-3"><form onSubmit={handleSend} className="flex items-center gap-2"><input type="text" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Njeri..." autoComplete="off" className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40" /><button type="submit" aria-label="Send" className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90"><Send className="h-4 w-4" /></button></form></div>
      </>}
    </aside>
  );
}
