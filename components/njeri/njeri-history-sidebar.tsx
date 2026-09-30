"use client";

import React, { useState } from "react";
import { ArrowLeft, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NjeriConversation } from "./types";

interface NjeriHistorySidebarProps {
  conversations: NjeriConversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onBack?: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  className?: string;
}

export function NjeriHistorySidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onBack,
  onDeleteConversation,
  onRenameConversation,
  className = "",
}: NjeriHistorySidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const saveTitle = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingId && editingTitle.trim()) onRenameConversation(editingId, editingTitle.trim());
    setEditingId(null);
  };

  const requestDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDeleteConversation(id);
      setConfirmDeleteId(null);
      return;
    }
    setConfirmDeleteId(id);
    window.setTimeout(() => setConfirmDeleteId((current) => current === id ? null : current), 3000);
  };

  return (
    <aside
      aria-label="Chat history"
      className={`flex h-full min-h-0 flex-col border-r border-border bg-background ${className}`}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex min-w-0 items-center gap-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to chat"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <h2 className="text-sm font-semibold text-foreground">Chats</h2>
        </div>
        <button
          type="button"
          onClick={onNewChat}
          aria-label="New chat"
          title="New chat"
          className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <nav aria-label="Conversations" className="min-h-0 flex-1 overflow-y-auto p-2">
        {conversations.length ? (
          <ul className="space-y-0.5">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeId;
              const isEditing = conversation.id === editingId;
              const isConfirmingDelete = conversation.id === confirmDeleteId;

              return (
                <li key={conversation.id} className="group flex min-w-0 items-center gap-1">
                  {isEditing ? (
                    <form onSubmit={saveTitle} className="flex min-w-0 flex-1">
                      <input
                        autoFocus
                        aria-label="Conversation title"
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") setEditingId(null);
                        }}
                        onBlur={() => setEditingId(null)}
                        className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      />
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectConversation(conversation.id)}
                      aria-current={isActive ? "page" : undefined}
                      title={conversation.title || "Untitled chat"}
                      className={`flex min-h-10 min-w-0 flex-1 items-center rounded-lg px-2.5 py-1.5 text-left text-sm font-medium leading-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-foreground hover:bg-foreground/10"
                      }`}
                    >
                      <span className="truncate">{conversation.title || "Untitled chat"}</span>
                    </button>
                  )}

                  {!isEditing && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Actions for ${conversation.title || "chat"}`}
                          title="Chat options"
                          className="grid h-9 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onSelect={() => {
                          setEditingId(conversation.id);
                          setEditingTitle(conversation.title || "");
                        }}>
                          <Pencil className="h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => requestDelete(conversation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {isConfirmingDelete ? "Confirm delete" : "Delete chat"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-2.5 py-3 text-sm text-muted-foreground">No chats yet</p>
        )}
      </nav>
    </aside>
  );
}
