"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Maximize2, X, Plus } from "lucide-react";
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
    newChat,
  } = useNjeri();

  // Hidden on the dedicated Njeri page and across the admin section.
  const isHidden = pathname === "/dashboard/njeri" || pathname === "/njeri" || pathname.startsWith("/admin");

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
        onClick={() => setOpen(true)}
        aria-label="Open Njeri assistant"
        title="Open Njeri Assistant"
        className="fixed bottom-3 right-3 z-50 hidden h-[88px] w-[54px] cursor-pointer place-items-center border-0 bg-transparent p-0 transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:grid"
      >
        <NjeriMark className="h-full w-full object-contain drop-shadow-[0_2px_5px_rgba(0,0,0,0.18)]" />
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

            <Link
              href="/dashboard/njeri"
              onClick={() => setOpen(false)}
              aria-label="Open full page"
              title="Open full page with history"
              className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Njeri"
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
