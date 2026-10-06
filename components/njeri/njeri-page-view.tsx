"use client";

import React, { useState } from "react";
import { useOptionalAuth } from "@/components/auth-provider";
import { NjeriChatView } from "./njeri-chat-view";
import { NjeriHistorySidebar } from "./njeri-history-sidebar";
import { useNjeri } from "./use-njeri";

export function NjeriPageView() {
  const auth = useOptionalAuth();
  const {
    conversations,
    activeConversation,
    activeId,
    isTyping,
    canManageRecords,
    selectConversation,
    newChat,
    deleteChat,
    renameChat,
    sendMessage,
    confirmAction,
  } = useNjeri();

  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  if (!auth?.user) return null;

  return (
    <div className="relative flex h-[calc(100dvh-124px)] nav:h-[calc(100dvh-60px)] w-full overflow-hidden bg-background">
      <div className={`${mobileHistoryOpen ? "flex" : "hidden"} h-full w-full shrink-0 md:flex md:w-64`}>
        <NjeriHistorySidebar
          conversations={conversations}
          activeId={activeId}
          onSelectConversation={(id) => {
            selectConversation(id);
            setMobileHistoryOpen(false);
          }}
          onNewChat={() => {
            newChat();
            setMobileHistoryOpen(false);
          }}
          onBack={() => setMobileHistoryOpen(false)}
          onDeleteConversation={deleteChat}
          onRenameConversation={renameChat}
          className="w-full"
        />
      </div>

      <div className={`${mobileHistoryOpen ? "hidden" : "flex"} h-full min-w-0 flex-1 flex-col overflow-hidden`}>
        <NjeriChatView
          mode="page"
          conversation={activeConversation}
          isTyping={isTyping}
          canManageRecords={canManageRecords}
          onSendMessage={sendMessage}
          onConfirmAction={confirmAction}
          onToggleHistory={() => setMobileHistoryOpen(true)}
          className="h-full flex-1"
        />
      </div>
    </div>
  );
}
