import type { NjeriActionProposal, NjeriResponse } from "@/lib/njeri-actions";

export type { NjeriActionProposal, NjeriResponse };

export type ChatMessage = {
  id: string | number;
  role: "assistant" | "user";
  text: string;
  timestamp?: number;
  action?: NjeriActionProposal | null;
};

export type NjeriConversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};
