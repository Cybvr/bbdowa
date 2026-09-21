"use client";

import { useCallback, useEffect, useState } from "react";
import { useOptionalAuth } from "@/components/auth-provider";
import { getAnswer } from "@/lib/njeri-assistant";
import type { ChatMessage, NjeriActionProposal, NjeriConversation, NjeriResponse } from "./types";
import {
  STORAGE_CHANGE_EVENT,
  clearAllConversations,
  createConversation,
  deleteConversation as deleteStorageConv,
  deriveConversationTitle,
  getActiveConversationId,
  loadConversations,
  saveConversation,
  setActiveConversationId,
  updateConversationTitle,
} from "./storage";
import { executeNjeriAction } from "./njeri-action-card";

export function useNjeri() {
  const auth = useOptionalAuth();
  const [conversations, setConversations] = useState<NjeriConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize and synchronize conversations
  const refreshFromStorage = useCallback(() => {
    const list = loadConversations();
    let currentActiveId = getActiveConversationId();

    if (list.length === 0) {
      const fresh = createConversation();
      setConversations([fresh]);
      setActiveId(fresh.id);
      return;
    }

    if (!currentActiveId || !list.some((c) => c.id === currentActiveId)) {
      currentActiveId = list[0].id;
      setActiveConversationId(currentActiveId);
    }

    setConversations(list);
    setActiveId(currentActiveId);
  }, []);

  useEffect(() => {
    refreshFromStorage();

    const handleCustomChange = () => {
      refreshFromStorage();
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key?.startsWith("bbdo_njeri")) {
        refreshFromStorage();
      }
    };

    window.addEventListener(STORAGE_CHANGE_EVENT, handleCustomChange);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [refreshFromStorage]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? conversations[0] ?? null;

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setActiveId(id);
  }, []);

  const newChat = useCallback((initialPrompt?: string) => {
    const fresh = createConversation(initialPrompt ? deriveConversationTitle(initialPrompt) : undefined);
    refreshFromStorage();
    return fresh;
  }, [refreshFromStorage]);

  const deleteChat = useCallback((id: string) => {
    const nextActiveId = deleteStorageConv(id);
    refreshFromStorage();
    if (nextActiveId) setActiveId(nextActiveId);
  }, [refreshFromStorage]);

  const renameChat = useCallback((id: string, newTitle: string) => {
    updateConversationTitle(id, newTitle);
    refreshFromStorage();
  }, [refreshFromStorage]);

  const clearAllChats = useCallback(() => {
    const fresh = clearAllConversations();
    refreshFromStorage();
    setActiveId(fresh.id);
  }, [refreshFromStorage]);

  const sendMessage = useCallback(
    async (queryText: string) => {
      const text = queryText.trim();
      if (!text || isTyping) return;

      let currentConv = activeConversation;
      if (!currentConv) {
        currentConv = createConversation(deriveConversationTitle(text));
        setActiveId(currentConv.id);
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text,
        timestamp: Date.now(),
      };

      // Determine if we should update the conversation title
      const isFirstUserQuery = currentConv.messages.filter((m) => m.role === "user").length === 0;
      const nextTitle =
        isFirstUserQuery && (currentConv.title === "New conversation" || !currentConv.title)
          ? deriveConversationTitle(text)
          : currentConv.title;

      const updatedMessages = [...currentConv.messages, userMessage];
      const convWithUser: NjeriConversation = {
        ...currentConv,
        title: nextTitle,
        updatedAt: Date.now(),
        messages: updatedMessages,
      };

      // Optimistically save user message
      saveConversation(convWithUser);
      setConversations((prev) => prev.map((c) => (c.id === convWithUser.id ? convWithUser : c)));
      setIsTyping(true);

      const historyPayload = updatedMessages.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      let responseText: string;
      let responseAction: NjeriActionProposal | null | undefined;

      try {
        const response = await fetch("/api/njeri", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: historyPayload }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || typeof data?.answer !== "string") {
          throw new Error(data?.error || `Njeri API responded ${response.status}`);
        }

        responseText = data.answer;
        responseAction = (data as NjeriResponse).action;
      } catch (cause) {
        console.warn("Njeri API unavailable, using fallback knowledge:", cause);
        responseText = getAnswer(text);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: responseText,
        timestamp: Date.now(),
        action: responseAction,
      };

      const finalConv: NjeriConversation = {
        ...convWithUser,
        updatedAt: Date.now(),
        messages: [...updatedMessages, assistantMessage],
      };

      saveConversation(finalConv);
      setConversations((prev) => prev.map((c) => (c.id === finalConv.id ? finalConv : c)));
      setIsTyping(false);
    },
    [activeConversation, isTyping],
  );

  const confirmAction = useCallback(
    async (messageId: string | number, action: NjeriActionProposal) => {
      if (!activeConversation) return;

      const updateMessageAction = (act: NjeriActionProposal) => {
        const nextMessages = activeConversation.messages.map((m) =>
          m.id === messageId ? { ...m, action: act } : m,
        );
        const nextConv = { ...activeConversation, messages: nextMessages };
        saveConversation(nextConv);
        setConversations((prev) => prev.map((c) => (c.id === nextConv.id ? nextConv : c)));
      };

      updateMessageAction({ ...action, status: "saving", error: undefined });

      const result = await executeNjeriAction(action, auth?.user ? { uid: auth.user.uid } : null);

      if (result.success) {
        updateMessageAction({ ...action, status: "saved", error: undefined });
      } else {
        updateMessageAction({ ...action, status: "failed", error: result.error });
      }
    },
    [activeConversation, auth?.user],
  );

  return {
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
  };
}
