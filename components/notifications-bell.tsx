"use client";

import * as React from "react";
import Link from "next/link";
import { collection, doc, onSnapshot, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { LuBell } from "react-icons/lu";
import { useOptionalAuth } from "@/components/auth-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { firebaseDb } from "@/lib/firebase/client";
import { NOTIFICATION_COLLECTION, type AppNotification } from "@/lib/notifications";

export function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** The signed-in person's notifications, newest first, kept live. */
export function useMyNotifications() {
  const auth = useOptionalAuth();
  const uid = auth?.user?.uid ?? null;
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(auth?.loading ?? false);
      return;
    }
    return onSnapshot(
      query(collection(firebaseDb, NOTIFICATION_COLLECTION), where("uid", "==", uid)),
      (snapshot) => {
        setItems(snapshot.docs
          .map((document) => ({ id: document.id, ...(document.data() as Omit<AppNotification, "id">) }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setLoading(false);
      },
      (cause) => {
        console.error("Unable to load notifications", cause);
        setLoading(false);
      },
    );
  }, [uid, auth?.loading]);

  const unread = items.filter((item) => !item.readAt);

  const markRead = (item: AppNotification) => {
    if (item.readAt) return;
    void updateDoc(doc(firebaseDb, NOTIFICATION_COLLECTION, item.id), { readAt: new Date().toISOString() })
      .catch((cause) => console.error("Unable to mark notification read", cause));
  };

  const markAllRead = () => {
    if (!unread.length) return;
    const batch = writeBatch(firebaseDb);
    const now = new Date().toISOString();
    for (const item of unread) batch.update(doc(firebaseDb, NOTIFICATION_COLLECTION, item.id), { readAt: now });
    void batch.commit().catch((cause) => console.error("Unable to mark notifications read", cause));
  };

  return { uid, items, unread, loading, markRead, markAllRead };
}

export function NotificationsBell({ align = "end" }: { align?: "start" | "end" }) {
  const { uid, items: all, unread, markRead, markAllRead } = useMyNotifications();
  if (!uid) return null;
  const items = all.slice(0, 10);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={unread.length ? `Notifications, ${unread.length} unread` : "Notifications"}
          className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <LuBell aria-hidden="true" className="h-5 w-5" />
          {unread.length ? (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="m-0 text-[14px] font-semibold">Notifications</p>
          {unread.length ? (
            <button type="button" onClick={markAllRead} className="text-[12px] font-medium text-muted-foreground hover:text-foreground">Mark all read</button>
          ) : null}
        </div>
        {items.length ? (
          <ul className="m-0 max-h-[60vh] list-none divide-y divide-border overflow-y-auto p-0">
            {items.map((item) => {
              const content = (
                <>
                  <span className="flex items-start justify-between gap-3">
                    <span className={`text-[13px] ${item.readAt ? "font-medium text-muted-foreground" : "font-semibold text-foreground"}`}>{item.title}</span>
                    {!item.readAt ? <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                  </span>
                  {item.body ? <span className="mt-0.5 block whitespace-pre-line text-[12px] text-muted-foreground">{item.body}</span> : null}
                  <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(item.createdAt)}</span>
                </>
              );
              const className = "block w-full px-4 py-3 text-left transition hover:bg-muted focus-visible:bg-muted focus-visible:outline-none";
              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link href={item.href} onClick={() => markRead(item)} className={className}>{content}</Link>
                  ) : (
                    <button type="button" onClick={() => markRead(item)} className={className}>{content}</button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="m-0 px-4 py-8 text-center text-[13px] text-muted-foreground">You’re all caught up.</p>
        )}
        <Link href="/dashboard/notifications" className="block border-t border-border px-4 py-3 text-center text-[13px] font-semibold text-primary hover:bg-muted">See all notifications</Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
