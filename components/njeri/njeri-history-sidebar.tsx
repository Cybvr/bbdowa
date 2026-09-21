"use client";

import React, { useMemo, useState } from "react";
import { Plus, MessageSquare, Trash2, Edit2, Check, X, Search, Clock } from "lucide-react";
import type { NjeriConversation } from "./types";

interface NjeriHistorySidebarProps {
  conversations: NjeriConversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  onClose?: () => void;
  className?: string;
}

type TimeGroup = "Today" | "Yesterday" | "Previous 7 Days" | "Older";

function getTimeGroup(timestamp: number): TimeGroup {
  const now = new Date();
  const date = new Date(timestamp);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOf7Days = startOfToday - 6 * 86400000;

  if (timestamp >= startOfToday) return "Today";
  if (timestamp >= startOfYesterday) return "Yesterday";
  if (timestamp >= startOf7Days) return "Previous 7 Days";
  return "Older";
}

export function NjeriHistorySidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onClearAll,
  onClose,
  className = "",
}: NjeriHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.messages.some((m) => m.text.toLowerCase().includes(query)),
    );
  }, [conversations, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<TimeGroup, NjeriConversation[]> = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    for (const conv of filtered) {
      const group = getTimeGroup(conv.updatedAt || conv.createdAt);
      groups[group].push(conv);
    }

    return groups;
  }, [filtered]);

  const startEditing = (conv: NjeriConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const saveEditing = (id: string, e?: React.FormEvent | React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      onDeleteConversation(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId((cur) => (cur === id ? null : cur)), 3000);
    }
  };

  const handleClearAll = () => {
    if (confirmClearAll) {
      onClearAll();
      setConfirmClearAll(false);
    } else {
      setConfirmClearAll(true);
      setTimeout(() => setConfirmClearAll(false), 3500);
    }
  };

  const groupOrder: TimeGroup[] = ["Today", "Yesterday", "Previous 7 Days", "Older"];

  return (
    <aside
      className={`flex h-full flex-col border-r border-border bg-muted/30 ${className}`}
      aria-label="Conversation History"
    >
      {/* Header with New Chat */}
      <div className="p-3 border-b border-border space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              History
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              ({conversations.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onNewChat}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 font-mono text-xs font-medium text-primary-foreground transition hover:opacity-90 active:scale-95 shadow-sm"
              title="Start new conversation"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New chat</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close history popout"
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* History Items list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            {searchQuery ? "No matching conversations." : "No saved conversations yet."}
          </div>
        ) : (
          groupOrder.map((group) => {
            const items = grouped[group];
            if (!items.length) return null;

            return (
              <div key={group} className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </div>
                {items.map((conv) => {
                  const isActive = conv.id === activeId;
                  const isEditing = conv.id === editingId;
                  const isConfirmingDelete = conv.id === confirmDeleteId;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => !isEditing && onSelectConversation(conv.id)}
                      className={`group relative flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs transition cursor-pointer ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-xs"
                          : "text-foreground hover:bg-muted/80 border border-transparent"
                      }`}
                    >
                      {isEditing ? (
                        <form
                          onSubmit={(e) => saveEditing(conv.id, e)}
                          className="flex flex-1 items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            autoFocus
                            className="w-full rounded border border-primary bg-background px-1.5 py-0.5 text-xs text-foreground outline-none"
                          />
                          <button
                            type="submit"
                            title="Save title"
                            className="p-1 text-primary hover:bg-primary/20 rounded"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            title="Cancel"
                            className="p-1 text-muted-foreground hover:text-foreground rounded"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="flex min-w-0 items-center gap-2 flex-1">
                            <MessageSquare
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isActive ? "text-primary" : "text-muted-foreground"
                              }`}
                            />
                            <span className="truncate text-xs font-normal" title={conv.title}>
                              {conv.title || "Untitled chat"}
                            </span>
                          </div>

                          <div
                            className={`flex shrink-0 items-center gap-1 transition-opacity ${
                              isActive
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100 max-[768px]:opacity-100"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => startEditing(conv, e)}
                              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Rename chat"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDelete(conv.id, e)}
                              className={`rounded p-1 transition ${
                                isConfirmingDelete
                                  ? "bg-destructive text-destructive-foreground"
                                  : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              }`}
                              title={isConfirmingDelete ? "Click again to delete" : "Delete chat"}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Clear All */}
      {conversations.length > 0 && (
        <div className="p-2.5 border-t border-border bg-background/50">
          <button
            type="button"
            onClick={handleClearAll}
            className={`w-full text-center py-1.5 px-2 rounded text-[11px] font-mono transition ${
              confirmClearAll
                ? "bg-destructive text-destructive-foreground font-semibold"
                : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            }`}
          >
            {confirmClearAll ? "Confirm: Clear all history?" : "Clear all chat history"}
          </button>
        </div>
      )}
    </aside>
  );
}
