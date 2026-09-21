"use client";

import React, { useEffect, useState } from "react";
import { NjeriChatView } from "@/components/njeri/njeri-chat-view";
import { NjeriHistorySidebar } from "@/components/njeri/njeri-history-sidebar";
import { useNjeri } from "@/components/njeri/use-njeri";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

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
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

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
    <div className="relative flex h-[calc(100dvh-64px)] nav:h-[calc(100dvh-60px)] w-full overflow-hidden bg-background">
      {/* Desktop Sidebar (collapsible) */}
      <div
        className={`hidden md:flex flex-col border-r border-border transition-all duration-300 ease-in-out ${
          desktopSidebarOpen ? "w-72" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        <NjeriHistorySidebar
          conversations={conversations}
          activeId={activeId}
          onSelectConversation={(id) => {
            selectConversation(id);
          }}
          onNewChat={() => newChat()}
          onDeleteConversation={deleteChat}
          onRenameConversation={renameChat}
          onClearAll={clearAllChats}
          className="h-full w-72"
        />
      </div>

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
          className="absolute left-3 top-14 z-50 flex h-[min(540px,calc(100dvh-120px))] w-80 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl ring-1 ring-black/10 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-150"
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
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <NjeriChatView
          mode="page"
          conversation={activeConversation}
          isTyping={isTyping}
          onSendMessage={sendMessage}
          onConfirmAction={confirmAction}
          onNewChat={() => newChat()}
          onToggleHistory={() => setPopoutOpen((prev) => !prev)}
          headerActions={
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDesktopSidebarOpen((prev) => !prev)}
                className="hidden md:grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title={desktopSidebarOpen ? "Collapse docked sidebar" : "Expand docked sidebar"}
                aria-label="Toggle docked sidebar"
              >
                {desktopSidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </button>
            </div>
          }
          className="h-full flex-1"
        />
      </div>
    </div>
  );
}
