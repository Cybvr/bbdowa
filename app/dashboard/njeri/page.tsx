"use client";

import React, { useEffect, useState } from "react";
import { NjeriChatView } from "@/components/njeri/njeri-chat-view";
import { NjeriHistorySidebar } from "@/components/njeri/njeri-history-sidebar";
import { useNjeri } from "@/components/njeri/use-njeri";

export default function NjeriPage() {
  const {
    conversations,
    activeConversation,
    activeId,
    isTyping,
    selectConversation,
    newChat,
    deleteChat,
    renameChat,
    clearAllChats,
    sendMessage,
    confirmAction,
  } = useNjeri();

  const [popoutOpen, setPopoutOpen] = useState(false);

  // Close popout on Escape
  useEffect(() => {
    if (!popoutOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPopoutOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [popoutOpen]);

  return (
    <div className="relative flex h-[calc(100dvh-124px)] nav:h-[calc(100dvh-60px)] w-full overflow-hidden bg-background">
      {/* History Popout Backdrop */}
      {popoutOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
          onClick={() => setPopoutOpen(false)}
        />
      )}

      {/* History Popout Card */}
      {popoutOpen && (
        <div
          className="absolute right-3 top-14 z-50 flex h-[min(540px,calc(100dvh-120px))] w-80 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl ring-1 ring-black/10 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-150"
        >
          <NjeriHistorySidebar
            conversations={conversations}
            activeId={activeId}
            onSelectConversation={(id) => {
              selectConversation(id);
              setPopoutOpen(false);
            }}
            onNewChat={() => {
              newChat();
              setPopoutOpen(false);
            }}
            onDeleteConversation={deleteChat}
            onRenameConversation={renameChat}
            onClearAll={clearAllChats}
            onClose={() => setPopoutOpen(false)}
            className="h-full w-full border-0 bg-transparent"
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <NjeriChatView
          mode="page"
          conversation={activeConversation}
          isTyping={isTyping}
          onSendMessage={sendMessage}
          onConfirmAction={confirmAction}
          onNewChat={() => newChat()}
          onToggleHistory={() => setPopoutOpen((prev) => !prev)}
          className="h-full flex-1"
        />
      </div>
    </div>
  );
}
