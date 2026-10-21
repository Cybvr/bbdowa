"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Minimize2, X, Plus } from "lucide-react";
import { NjeriMark } from "./njeri-mark";
import { NjeriChatView } from "./njeri-chat-view";
import { useNjeri } from "./use-njeri";
import { useOptionalAuth } from "@/components/auth-provider";

export function NjeriWidget() {
  const pathname = usePathname();
  const auth = useOptionalAuth();
  const [open, setOpen] = useState(false);
  const {
    activeConversation,
    isTyping,
    canManageRecords,
    sendMessage,
    confirmAction,
    confirmAll,
    newChat,
  } = useNjeri();

  // Keep the assistant off public job shares, including application confirmations.
  const isHidden = pathname === "/dashboard/njeri" || pathname === "/portal/njeri" || pathname === "/njeri" || pathname.startsWith("/admin") || pathname.startsWith("/jobs/");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (isHidden) {
    return null;
  }

  if (!auth?.user) {
    return null;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          newChat();
          setOpen(true);
        }}
        aria-label="Open Njeri assistant"
        title="Open Njeri Assistant"
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-50 hidden h-14 w-14 cursor-pointer place-items-center overflow-hidden rounded-full border-0 bg-primary p-0 transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:grid"
      >
        <NjeriMark className="h-full w-full object-cover object-top" />
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
        canManageRecords={canManageRecords}
        onSendMessage={sendMessage}
        onConfirmAction={confirmAction}
        onConfirmAll={confirmAll}
        headerActions={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => newChat()}
              aria-label="New chat"
              title="Start new chat"
              className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimize Njeri"
              title="Minimize Njeri"
              className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Minimize2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Njeri"
              title="Close Njeri"
              className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
