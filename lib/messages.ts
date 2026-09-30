export const CONVERSATIONS_COLLECTION = "conversations";

export type Conversation = {
  id: string;
  /** Firebase Auth uids of both people in the conversation. */
  participants: string[];
  names: Record<string, string>;
  pictures: Record<string, string | null>;
  lastMessage: string;
  lastSenderId: string | null;
  /** ISO timestamp of the latest message. */
  updatedAt: string | null;
  /** ISO timestamp per uid of when they last opened the conversation. */
  readAt: Record<string, string>;
};

export type DirectMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export type MessageContact = {
  uid: string;
  name: string;
  picture: string | null;
};

/** One conversation per pair of people, so the id is both uids in a fixed order. */
export function conversationId(a: string, b: string): string {
  return [a, b].sort().join("__");
}

export function isUnread(conversation: Conversation, uid: string): boolean {
  if (!conversation.updatedAt || conversation.lastSenderId === uid) return false;
  const readAt = conversation.readAt?.[uid];
  return !readAt || readAt < conversation.updatedAt;
}

export function formatMessageTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat("en-GB", sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" }).format(date);
}
