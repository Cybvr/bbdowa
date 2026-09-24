"use client";

import React, { useEffect, useRef, useState } from "react";
import { Send, Copy, Check, Plus, Clock } from "lucide-react";
import { PERSONAL_QUICK_PROMPTS, QUICK_PROMPTS, STAFF_QUICK_PROMPTS } from "@/lib/njeri-assistant";
import { FormattedContent } from "./njeri-formatted-content";
import { ActionCard } from "./njeri-action-card";
import type { ChatMessage, NjeriActionProposal, NjeriConversation } from "./types";

interface NjeriChatViewProps {
  conversation: NjeriConversation | null;
  isTyping: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onConfirmAction?: (messageId: string | number, action: NjeriActionProposal) => Promise<void>;
  onNewChat?: () => void;
  onToggleHistory?: () => void;
  headerActions?: React.ReactNode;
  mode?: "page" | "widget";
  canManageRecords?: boolean;
  className?: string;
}

export function NjeriChatView({
  conversation,
  isTyping,
  onSendMessage,
  onConfirmAction,
  onNewChat,
  onToggleHistory,
  headerActions,
  mode = "page",
  canManageRecords = false,
  className = "",
}: NjeriChatViewProps) {
  const [input, setInput] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const messages = conversation?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation?.id]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    const text = input;
    setInput("");
    void onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = (question: string) => {
    if (isTyping) return;
    void onSendMessage(question);
  };

  const copyMessage = (message: ChatMessage) => {
    navigator.clipboard.writeText(message.text);
    setCopiedMessageId(message.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const resizeTextarea = (field: HTMLTextAreaElement) => {
    const styles = window.getComputedStyle(field);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 22;
    const verticalPadding =
      (Number.parseFloat(styles.paddingTop) || 0) +
      (Number.parseFloat(styles.paddingBottom) || 0);
    const maxHeight = lineHeight * 4 + verticalPadding;

    field.style.height = "0px";
    field.style.height = `${Math.min(field.scrollHeight, maxHeight)}px`;
    field.style.overflowY = field.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    const field = inputRef.current;
    if (!(field instanceof HTMLTextAreaElement)) return;

    resizeTextarea(field);
  }, [input]);

  const isPageMode = mode === "page";
  const prompts = canManageRecords ? STAFF_QUICK_PROMPTS : [...QUICK_PROMPTS, ...PERSONAL_QUICK_PROMPTS];

  return (
    <div className={`flex flex-col bg-background h-full ${className}`}>
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-background/95 px-3 py-2 backdrop-blur z-10">
        <div className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">
            {conversation?.title || "New conversation"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleHistory && isPageMode && (
            <button
              type="button"
              onClick={onToggleHistory}
              aria-label="Toggle history popout"
              title="Conversation history"
              className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Clock className="h-3.5 w-3.5" />
            </button>
          )}
          {headerActions}
        </div>
      </header>

      {/* Messages Stream */}
      <div
        aria-live="polite"
        className={`flex-1 overflow-y-auto space-y-4 p-4 ${
          isPageMode ? "max-w-4xl mx-auto w-full px-4 sm:px-8 py-6" : "p-3.5 space-y-3.5"
        }`}
      >
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Message */}
              <div
                className={`group relative max-w-[85%] leading-relaxed transition-all ${
                  isUser
                    ? "text-foreground text-right"
                    : "text-foreground"
                } px-0 py-1 ${isPageMode ? "text-[15px]" : "text-sm"}`}
              >
                <FormattedContent text={message.text} isUser={isUser} />

                {message.role === "assistant" && message.action && onConfirmAction ? (
                  <ActionCard
                    action={message.action}
                    onConfirm={(action) => void onConfirmAction(message.id, action)}
                  />
                ) : null}

                {/* Copy button */}
                <button
                  type="button"
                  onClick={() => copyMessage(message)}
                  className={`absolute -bottom-2.5 right-2 hidden rounded-md border border-border bg-background p-1 text-muted-foreground shadow-xs transition hover:text-foreground group-hover:block ${
                    isUser ? "-left-2.5 right-auto" : ""
                  }`}
                  title="Copy message"
                >
                  {copiedMessageId === message.id ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isTyping && (
          <div className="flex items-start gap-2.5">
            <div className="flex items-center gap-1.5 px-0 py-1 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:0.15s]" />
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:0.3s]" />
              <span className="ml-1 font-mono text-[11px]">Njeri is thinking...</span>
            </div>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && (
          <div className={`pt-3 ${isPageMode ? "mt-4" : ""}`}>
            <div className="mb-2.5 text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground">
              Try asking
            </div>
            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => handleChipClick(prompt.question)}
                  disabled={isTyping}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-2xs"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className={`p-3 ${isPageMode ? "bg-transparent" : "border-t border-border bg-background/95 backdrop-blur"}`}>
        <form
          onSubmit={handleSend}
          className={`flex gap-2 ${isPageMode ? "mx-auto w-full max-w-4xl flex-col rounded-xl bg-muted/70 p-1.5 shadow-xs" : "flex-row items-center"}`}
        >
          <div className={`relative min-w-0 flex-1 ${isPageMode ? "w-full" : ""}`}>
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={(e) => resizeTextarea(e.currentTarget)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about creators, campaigns, tasks, contracts, or work..."
              aria-label="Ask Njeri a question"
              disabled={isTyping}
              className={`w-full resize-none overflow-hidden text-sm text-foreground outline-none transition placeholder:text-muted-foreground disabled:opacity-50 ${isPageMode ? "rounded-lg border-0 bg-transparent px-3 py-2.5 focus:ring-0" : "rounded-xl border border-input bg-background p-3 focus:border-primary focus:ring-1 focus:ring-primary/40"}`}
            />
          </div>

          <div className={isPageMode ? "flex w-full items-center justify-between" : "contents"}>
            {isPageMode && onNewChat ? (
              <button
                type="button"
                onClick={onNewChat}
                aria-label="New chat"
                title="Start new chat"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-background/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Plus className="h-3.5 w-3.5" />
              </button>
            ) : null}

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
            className={`grid shrink-0 place-items-center bg-primary text-primary-foreground transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm ${isPageMode ? "h-9 w-9 rounded-lg" : "h-11 w-11 rounded-xl"}`}
          >
            <Send className={isPageMode ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
