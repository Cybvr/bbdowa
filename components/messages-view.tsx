"use client";

import * as React from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { ArrowLeft, Plus, Send, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { firebaseDb } from "@/lib/firebase/client";
import { createGlyphAvatarDataUri } from "@/lib/avatar";
import { notify } from "@/lib/email/notify";
import {
  CONVERSATIONS_COLLECTION,
  conversationId,
  formatMessageTime,
  isUnread,
  type Conversation,
  type DirectMessage,
  type MessageContact,
} from "@/lib/messages";

function Avatar({ contact, className = "h-9 w-9" }: { contact: MessageContact; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={contact.picture || createGlyphAvatarDataUri(contact.uid)}
      alt=""
      className={`${className} shrink-0 rounded-full border border-border object-cover`}
    />
  );
}

export function MessagesView() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [contacts, setContacts] = React.useState<MessageContact[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [activeContactUid, setActiveContactUid] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<DirectMessage[]>([]);
  const [picking, setPicking] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!uid) return;
    void getDocs(collection(firebaseDb, "users")).then((snapshot) => {
      const seen = new Set<string>();
      const people: MessageContact[] = [];
      snapshot.docs.forEach((document) => {
        const data = document.data();
        const contactUid = typeof data.uid === "string" ? data.uid : null;
        if (!contactUid || contactUid === uid || seen.has(contactUid)) return;
        seen.add(contactUid);
        people.push({
          uid: contactUid,
          name: data.name || data.email || "Unnamed",
          picture: data.picture || data.profileImage || null,
        });
      });
      setContacts(people.sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, [uid]);

  React.useEffect(() => {
    if (!uid) return;
    const conversationsQuery = query(
      collection(firebaseDb, CONVERSATIONS_COLLECTION),
      where("participants", "array-contains", uid),
    );
    return onSnapshot(conversationsQuery, (snapshot) => {
      const rows = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as Conversation);
      setConversations(rows.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")));
      setLoaded(true);
    });
  }, [uid]);

  const activeId = uid && activeContactUid ? conversationId(uid, activeContactUid) : null;
  const activeConversation = conversations.find((conversation) => conversation.id === activeId) ?? null;

  const contactFor = React.useCallback(
    (conversation: Conversation): MessageContact => {
      const other = conversation.participants.find((participant) => participant !== uid) ?? "";
      return (
        contacts.find((contact) => contact.uid === other) ?? {
          uid: other,
          name: conversation.names?.[other] ?? "Unknown",
          picture: conversation.pictures?.[other] ?? null,
        }
      );
    },
    [contacts, uid],
  );

  const activeContact = activeContactUid
    ? contacts.find((contact) => contact.uid === activeContactUid) ??
      (activeConversation ? contactFor(activeConversation) : null)
    : null;

  // Only listen once the conversation exists, since the rules read its participants.
  const activeExists = Boolean(activeConversation);
  React.useEffect(() => {
    if (!activeId || !activeExists) {
      setMessages([]);
      return;
    }
    const messagesQuery = query(
      collection(firebaseDb, CONVERSATIONS_COLLECTION, activeId, "messages"),
      orderBy("createdAt", "asc"),
    );
    return onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as DirectMessage));
    });
  }, [activeId, activeExists]);

  // Mark the open conversation as read whenever a new message lands in it.
  React.useEffect(() => {
    if (!uid || !activeConversation || !isUnread(activeConversation, uid)) return;
    void setDoc(
      doc(firebaseDb, CONVERSATIONS_COLLECTION, activeConversation.id),
      { readAt: { [uid]: new Date().toISOString() } },
      { merge: true },
    );
  }, [activeConversation, uid]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  const openContact = (contactUid: string) => {
    setActiveContactUid(contactUid);
    setPicking(false);
    setSearch("");
    setDraft("");
  };

  const send = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!uid || !user || !activeId || !activeContact || !text || sending) return;

    setSending(true);
    setDraft("");
    const now = new Date().toISOString();
    const participants = [uid, activeContact.uid].sort();
    try {
      await setDoc(
        doc(firebaseDb, CONVERSATIONS_COLLECTION, activeId),
        {
          participants,
          names: { [uid]: user.name || user.email || "Unnamed", [activeContact.uid]: activeContact.name },
          pictures: { [uid]: user.picture ?? null, [activeContact.uid]: activeContact.picture },
          lastMessage: text.slice(0, 200),
          lastSenderId: uid,
          updatedAt: now,
          readAt: { [uid]: now },
        },
        { merge: true },
      );
      await addDoc(collection(firebaseDb, CONVERSATIONS_COLLECTION, activeId, "messages"), {
        senderId: uid,
        text,
        createdAt: now,
      });
      void notify({ event: "message.sent", id: activeId });
    } catch {
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  if (!uid) {
    return <p className="p-8 text-[14px] text-muted-foreground">Sign in to see your messages.</p>;
  }

  const threadOpen = Boolean(activeContact);

  return (
    <div className="relative flex h-[calc(100dvh-124px)] w-full overflow-hidden bg-background nav:h-[calc(100dvh-60px)]">
      <aside className={`${threadOpen ? "hidden md:flex" : "flex"} h-full w-full shrink-0 flex-col border-r border-border md:w-72`}>
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <h1 className="m-0 text-[15px] font-semibold">{picking ? "New message" : "Messages"}</h1>
          <button
            type="button"
            onClick={() => {
              setPicking((current) => !current);
              setSearch("");
            }}
            aria-label={picking ? "Close" : "New message"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {picking ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        {picking ? (
          <>
            <div className="border-b border-border p-3">
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search people"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
            <ul className="m-0 flex-1 list-none overflow-y-auto p-0">
              {filteredContacts.map((contact) => (
                <li key={contact.uid}>
                  <button
                    type="button"
                    onClick={() => openContact(contact.uid)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    <Avatar contact={contact} className="h-8 w-8" />
                    <span className="truncate font-medium">{contact.name}</span>
                  </button>
                </li>
              ))}
              {filteredContacts.length === 0 ? (
                <li className="px-4 py-6 text-[13px] text-muted-foreground">No one matches that name.</li>
              ) : null}
            </ul>
          </>
        ) : (
          <ul className="m-0 flex-1 list-none overflow-y-auto p-0">
            {conversations.map((conversation) => {
              const contact = contactFor(conversation);
              const unread = isUnread(conversation, uid);
              const active = conversation.id === activeId;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => openContact(contact.uid)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none ${active ? "bg-muted" : ""}`}
                  >
                    <Avatar contact={contact} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-[13px] ${unread ? "font-semibold" : "font-medium"}`}>{contact.name}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{formatMessageTime(conversation.updatedAt)}</span>
                      </span>
                      <span className={`mt-0.5 block truncate text-[12px] ${unread ? "text-foreground" : "text-muted-foreground"}`}>
                        {conversation.lastSenderId === uid ? "You: " : ""}
                        {conversation.lastMessage}
                      </span>
                    </span>
                    {unread ? <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                  </button>
                </li>
              );
            })}
            {loaded && conversations.length === 0 ? (
              <li className="px-4 py-6 text-[13px] text-muted-foreground">No conversations yet. Start one with the plus button.</li>
            ) : null}
          </ul>
        )}
      </aside>

      <section className={`${threadOpen ? "flex" : "hidden md:flex"} h-full min-w-0 flex-1 flex-col`}>
        {activeContact ? (
          <>
            <div className="flex h-14 items-center gap-3 border-b border-border px-4">
              <button
                type="button"
                onClick={() => setActiveContactUid(null)}
                aria-label="Back to conversations"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <Avatar contact={activeContact} className="h-8 w-8" />
              <h2 className="m-0 truncate text-[14px] font-semibold">{activeContact.name}</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              {messages.length === 0 ? (
                <p className="m-0 text-center text-[13px] text-muted-foreground">Say hello to {activeContact.name}.</p>
              ) : (
                <ol className="m-0 flex list-none flex-col gap-2 p-0">
                  {messages.map((message) => {
                    const mine = message.senderId === uid;
                    return (
                      <li key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[14px] leading-[1.45] ${
                            mine ? "bg-primary text-white" : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="m-0 whitespace-pre-wrap break-words">{message.text}</p>
                          <time className={`mt-1 block text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                            {formatMessageTime(message.createdAt)}
                          </time>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
              <div ref={endRef} />
            </div>

            <form onSubmit={send} className="flex items-end gap-2 border-t border-border p-3">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                placeholder={`Message ${activeContact.name}`}
                className="max-h-40 min-h-[40px] flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-[13px] text-muted-foreground">
            Pick a conversation or start a new one.
          </div>
        )}
      </section>
    </div>
  );
}
