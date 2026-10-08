"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useOptionalAuth } from "@/components/auth-provider";
import { getAnswer } from "@/lib/njeri-assistant";
import { readJobsFromFirestore, readClientsFromFirestore, readDocumentsForNjeri, readTasksForNjeri, readTimeEntriesForNjeri, readUserForNjeri, readUsersFromFirestore } from "@/lib/firebase/client-content";
import { isCreatorUser, userRoles } from "@/lib/users";
import { elapsedMs } from "@/lib/time-tracking";
import type { NjeriActionProposal, NjeriResponse, NjeriWorkspaceContext } from "@/lib/njeri-actions";
import type { ChatMessage, NjeriConversation } from "./types";
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
  const workspaceContextCache = useRef<{ loadedAt: number; value: NjeriWorkspaceContext } | null>(null);
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
      let responseActions: NjeriActionProposal[] | undefined;
      let workspaceContext: NjeriWorkspaceContext | null = null;
      let workspaceContextUnavailable = false;
      const canManage = auth?.role === "admin" || auth?.role === "manager";
      const recentUserText = historyPayload.slice(-8).filter((turn) => turn.role === "user").map((turn) => turn.content).join("\n");
      const asksAboutWorkspaceRecords = /\b(creators?|clients?|jobs?|tasks?|contracts?|documents?|hours?|time entries|referrals?|availability|clearance)\b/i.test(recentUserText)
        || /\b(shortlist|compare|recommend|options for|who should we|who can we work with|candidates?)\b/i.test(recentUserText);
      const asksForDocumentText = /\b(what does|read|summari[sz]e|terms|clause|contents?|text of|say in)\b/i.test(recentUserText);
      const canReadOwnWorkspace = Boolean(auth?.user?.uid);

      if ((canManage || canReadOwnWorkspace) && asksAboutWorkspaceRecords && auth?.user?.uid) {
        const cached = workspaceContextCache.current;
        if (canManage && !asksForDocumentText && cached && Date.now() - cached.loadedAt < 60_000) {
          workspaceContext = cached.value;
        } else {
          try {
            const [clients, jobs, users, tasks, entries, ownUser] = await Promise.all([
              canManage ? readClientsFromFirestore() : Promise.resolve([]),
              canManage ? readJobsFromFirestore() : Promise.resolve([]),
              canManage ? readUsersFromFirestore() : Promise.resolve([]),
              readTasksForNjeri(auth.user.uid, canManage),
              readTimeEntriesForNjeri(auth.user.uid, canManage),
              canManage ? Promise.resolve(null) : readUserForNjeri(auth.user.uid),
            ]);
            const creators = users.filter(isCreatorUser);
            const creatorByUid = new Map(creators.flatMap((creator) => creator.uid ? [[creator.uid, creator] as const] : []));
            const documents = await readDocumentsForNjeri(auth.user.uid, ownUser?.slug, canManage);
            workspaceContext = {
              clients: clients.slice(0, 40).map(({ name, slug, industry, description, targetAudience }) => ({
                name, slug, industry, description: description ?? "", targetAudience: targetAudience ?? "",
              })),
              creators: creators.slice(0, 100).map(({ name, slug, uid, category, title, instagram, niche, followerCount, availability, referralSource, clearance, vetted, workedOn, workHistory, dayRate, rateMin, rateCurrency, yearsActive, craftNote, hideRate }) => ({
                name, slug, uid: uid ?? "", category: category ?? "", title: title ?? "", instagram: instagram ?? "", niche: niche ?? "", followerCount: followerCount ?? "",
                availability: availability ?? "unconfirmed", referralSource: referralSource ?? "", clearance: clearance ?? "pending", vetted: vetted ?? false,
                workedOn: workedOn ?? [], workHistory: workHistory ?? [], dayRate: hideRate ? "" : dayRate ?? "", rateMin: hideRate ? null : rateMin ?? null, rateCurrency: rateCurrency ?? "NGN", yearsActive: yearsActive ?? null, craftNote: craftNote ?? "",
              })),
              team: users.flatMap((user) => user.uid ? [{ name: user.name, uid: user.uid, role: `${userRoles(user).join(", ")}${user.uid === auth?.user?.uid ? " (current user)" : ""}` }] : []).slice(0, 200),
              jobs: jobs.slice(0, 60).map(({ name, slug, clientName, category, status, summary }) => ({
                name: name || "", slug, clientName: clientName || "", category: category || "", status: status || "", summary: summary || "",
              })),
              tasks: tasks.slice(0, 80).map((task) => ({
                id: task.id, title: task.title, description: task.description ?? "", assignedTo: task.assignedTo,
                assignedToName: task.assignedToName ?? creatorByUid.get(task.assignedTo)?.name ?? "", clientName: task.clientName ?? "",
                jobName: task.jobName ?? "", status: task.status, dueDate: task.dueDate ?? "",
              })),
              documents: documents.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, asksForDocumentText ? 5 : 40).map((document) => ({
                id: document.id, title: document.title, status: document.status, assignedTo: document.assignedTo ?? "",
                assignedToName: document.assignedToName ?? "", createdAt: document.createdAt ?? "", signedAt: document.signedAt ?? "",
                signedName: document.signedName ?? "", ...(asksForDocumentText ? { body: document.body } : {}),
              })),
              trackedHours: entries.sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 160).map((entry) => ({
                uid: entry.uid, name: entry.name ?? creatorByUid.get(entry.uid)?.name ?? "", jobName: entry.jobName ?? "",
                activity: entry.activity, minutes: Math.round(elapsedMs(entry) / 60_000), startedAt: entry.startedAt,
              })),
            };
            if (canManage) workspaceContextCache.current = { loadedAt: Date.now(), value: workspaceContext };
          } catch (cause) {
            console.warn("Unable to load Njeri workspace context", cause);
            workspaceContextUnavailable = true;
          }
        }
      }

      try {
        const response = await fetch("/api/njeri", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: historyPayload, workspaceContext, workspaceContextUnavailable }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || typeof data?.answer !== "string") {
          throw new Error(data?.error || `Njeri API responded ${response.status}`);
        }

        responseText = data.answer;
        const { action: singleAction, actions: proposedActions } = data as NjeriResponse;
        const proposals = proposedActions ?? (singleAction ? [singleAction] : []);
        const isAllowed = (proposed: NjeriActionProposal) => canManage
          || proposed.type === "delete_task"
          || (proposed.type === "update_task" && !("assignedTo" in proposed.changes) && !("assignedToName" in proposed.changes));
        const allowed = proposals.filter(isAllowed).map((proposed) => proposed.type === "create_task" && !proposed.record.assignedTo && auth?.user?.uid
          ? { ...proposed, record: { ...proposed.record, assignedTo: auth.user.uid, assignedToName: auth.user.name ?? "" } }
          : proposed);
        if (allowed.length) {
          responseActions = allowed;
        } else if (proposals.length) {
          responseText = proposals[0].type === "create_task" || proposals[0].type === "update_task"
            ? "Admins and managers can create tasks and reassign them. You can update or delete tasks assigned to you."
            : "Only admins and managers can change shared workspace records in Njeri.";
        }
      } catch (cause) {
        console.warn("Njeri API unavailable, using fallback knowledge:", cause);
        responseText = asksAboutWorkspaceRecords && (canManage || canReadOwnWorkspace)
          ? "I couldn't reach Njeri's AI service just now, so I haven't changed anything. Try again in a moment."
          : getAnswer(text);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: responseText,
        timestamp: Date.now(),
        actions: responseActions,
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
    [activeConversation, auth?.role, auth?.user?.uid, isTyping],
  );

  const confirmAction = useCallback(
    async (messageId: string | number, action: NjeriActionProposal, index = 0) => {
      if (!activeConversation) return;

      const updateMessageAction = (act: NjeriActionProposal) => {
        const nextMessages = activeConversation.messages.map((m) => {
          if (m.id !== messageId) return m;
          const list = m.actions ?? (m.action ? [m.action] : []);
          return { ...m, action: undefined, actions: list.map((item, i) => (i === index ? act : item)) };
        });
        const nextConv = { ...activeConversation, messages: nextMessages };
        saveConversation(nextConv);
        setConversations((prev) => prev.map((c) => (c.id === nextConv.id ? nextConv : c)));
      };

      updateMessageAction({ ...action, status: "saving", error: undefined });

      const result = await executeNjeriAction(
        action,
        auth?.user ? { uid: auth.user.uid, name: auth.user.name, canManage: auth.isAdmin || auth.role === "manager" } : null,
      );

      if (result.success) {
        workspaceContextCache.current = null;
        updateMessageAction({ ...action, status: "saved", error: undefined });
      } else {
        updateMessageAction({ ...action, status: "failed", error: result.error });
      }
    },
    [activeConversation, auth?.isAdmin, auth?.role, auth?.user],
  );

  // Runs every unsaved action in a message one after another off a single local
  // copy of the list, so a batch of N records is one click and never clobbers itself.
  const confirmAll = useCallback(
    async (messageId: string | number) => {
      if (!activeConversation) return;
      const message = activeConversation.messages.find((m) => m.id === messageId);
      if (!message) return;
      const list = [...(message.actions ?? (message.action ? [message.action] : []))];
      const persist = () => {
        const nextConv = {
          ...activeConversation,
          messages: activeConversation.messages.map((m) => (m.id === messageId ? { ...m, action: undefined, actions: [...list] } : m)),
        };
        saveConversation(nextConv);
        setConversations((prev) => prev.map((c) => (c.id === nextConv.id ? nextConv : c)));
      };
      const actor = auth?.user ? { uid: auth.user.uid, name: auth.user.name, canManage: auth.isAdmin || auth.role === "manager" } : null;

      for (let i = 0; i < list.length; i++) {
        if (list[i].status === "saved") continue;
        const action = list[i];
        list[i] = { ...action, status: "saving", error: undefined };
        persist();
        const result = await executeNjeriAction(action, actor);
        list[i] = result.success ? { ...action, status: "saved", error: undefined } : { ...action, status: "failed", error: result.error };
        persist();
      }
      workspaceContextCache.current = null;
    },
    [activeConversation, auth?.isAdmin, auth?.role, auth?.user],
  );

  return {
    conversations,
    activeConversation,
    activeId,
    isTyping,
    canManageRecords: auth?.role === "admin" || auth?.role === "manager",
    selectConversation,
    newChat,
    deleteChat,
    renameChat,
    clearAllChats,
    sendMessage,
    confirmAction,
    confirmAll,
  };
}
