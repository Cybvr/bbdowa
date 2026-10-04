import type { ChatMessage, NjeriConversation } from "./types";

const CONVERSATIONS_KEY = "bbdo_njeri_conversations_v1";
const ACTIVE_ID_KEY = "bbdo_njeri_active_id_v1";
export const STORAGE_CHANGE_EVENT = "njeri:storage-change";

export const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-1",
  role: "assistant",
  text: "Hi, I’m Njeri. Ask me about our creators, clients, jobs, tasks, documents, or tracked work. Admins and managers can also ask me to update the portal or add something from pasted details.",
  timestamp: Date.now(),
};

function generateId(): string {
  return `njeri-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadConversations(): NjeriConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((conversation) => ({
        ...conversation,
        messages: Array.isArray(conversation.messages)
          ? conversation.messages.map((message: ChatMessage) => message.id === "welcome-1" ? { ...message, text: DEFAULT_WELCOME_MESSAGE.text } : message)
          : [],
      }))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (error) {
    console.error("Failed to load Njeri conversations from localStorage:", error);
    return [];
  }
}

export function saveConversations(conversations: NjeriConversation[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { conversations } }));
  } catch (error) {
    console.error("Failed to save Njeri conversations to localStorage:", error);
  }
}

export function getActiveConversationId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveConversationId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_ID_KEY, id);
    window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { activeId: id } }));
  } catch (error) {
    console.error("Failed to set active Njeri conversation id:", error);
  }
}

export function createConversation(title?: string): NjeriConversation {
  const newConv: NjeriConversation = {
    id: generateId(),
    title: title?.trim() || "New conversation",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [DEFAULT_WELCOME_MESSAGE],
  };

  const current = loadConversations();
  const updated = [newConv, ...current];
  saveConversations(updated);
  setActiveConversationId(newConv.id);
  return newConv;
}

export function saveConversation(conversation: NjeriConversation): void {
  const current = loadConversations();
  const index = current.findIndex((c) => c.id === conversation.id);
  let next: NjeriConversation[];
  if (index >= 0) {
    next = [...current];
    next[index] = { ...conversation, updatedAt: Date.now() };
  } else {
    next = [{ ...conversation, updatedAt: Date.now() }, ...current];
  }
  next.sort((a, b) => b.updatedAt - a.updatedAt);
  saveConversations(next);
}

export function updateConversationTitle(id: string, title: string): void {
  const current = loadConversations();
  const index = current.findIndex((c) => c.id === id);
  if (index >= 0) {
    current[index] = { ...current[index], title: title.trim() || "Untitled", updatedAt: Date.now() };
    saveConversations(current);
  }
}

export function deleteConversation(id: string): string | null {
  const current = loadConversations();
  const next = current.filter((c) => c.id !== id);
  saveConversations(next);

  const activeId = getActiveConversationId();
  if (activeId === id) {
    const newActiveId = next[0]?.id ?? null;
    if (newActiveId) {
      setActiveConversationId(newActiveId);
    } else {
      const fresh = createConversation();
      return fresh.id;
    }
    return newActiveId;
  }
  return activeId;
}

export function clearAllConversations(): NjeriConversation {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(CONVERSATIONS_KEY);
      window.localStorage.removeItem(ACTIVE_ID_KEY);
    } catch {}
  }
  return createConversation();
}

export function deriveConversationTitle(firstQuery: string): string {
  const cleaned = firstQuery.trim().replace(/^[^a-zA-Z0-9]+/, "");
  if (!cleaned) return "New conversation";
  if (cleaned.length <= 36) return cleaned;
  return `${cleaned.slice(0, 33).trim()}...`;
}
