"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Maximize2, X, Plus } from "lucide-react";
import { NjeriMark } from "./njeri-mark";
import { NjeriChatView } from "./njeri-chat-view";
import { useNjeri } from "./use-njeri";

export function NjeriWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const {
    activeConversation,
    isTyping,
    sendMessage,
    confirmAction,
    newChat,
  } = useNjeri();

  // Hide the floating widget if user is currently on the dedicated Njeri page
  const isDedicatedPage = pathname === "/dashboard/njeri" || pathname === "/njeri";

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (isDedicatedPage) {
    return null;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Njeri assistant"
        title="Open Njeri Assistant"
        className="fixed bottom-4 right-4 z-50 hidden md:grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xl transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      >
        <NjeriMark className="h-6 w-6" />
      </button>
    );
  }

  return (
    <aside
      aria-label="Njeri"
      className="fixed bottom-4 right-4 z-50 hidden md:flex h-[min(36rem,calc(100dvh-2rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[420px]"
    >
      <NjeriChatView
        mode="widget"
        conversation={activeConversation}
        isTyping={isTyping}
        onSendMessage={sendMessage}
        onConfirmAction={confirmAction}
        headerActions={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => newChat()}
              aria-label="New chat"
              title="Start new chat"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>

            <Link
              href="/dashboard/njeri"
              onClick={() => setOpen(false)}
              aria-label="Open full page"
              title="Open full page with history"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Njeri"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        }
      />
    </aside>
  );
}

export default NjeriWidget;
