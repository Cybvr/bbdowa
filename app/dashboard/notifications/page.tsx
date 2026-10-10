"use client";

import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyNotifications } from "@/components/notifications-bell";

const dateLabel = (iso: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

export default function NotificationsPage() {
  const { uid, items, unread, loading, markRead, markAllRead } = useMyNotifications();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-2 sm:px-8">
      <PageHeader
        title="Notifications"
        actions={unread.length ? <button type="button" onClick={markAllRead} className="text-[13px] font-semibold text-muted-foreground hover:text-foreground">Mark all read</button> : null}
      />
      <section aria-label="All notifications" className="mt-4">
        {loading ? (
          <div role="status" aria-label="Loading notifications" className="space-y-2"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /></div>
        ) : !uid ? (
          <EmptyState title="Sign in to see notifications" description="Your weekly and monthly summaries show up here." />
        ) : items.length === 0 ? (
          <EmptyState title="No notifications yet" description="Your weekly and monthly summaries will show up here." />
        ) : (
          <ul className="m-0 list-none divide-y divide-border p-0">
            {items.map((item) => {
              const inner = (
                <>
                  <span className="flex items-start justify-between gap-3">
                    <span className={`text-[15px] ${item.readAt ? "font-medium text-muted-foreground" : "font-semibold text-foreground"}`}>{item.title}</span>
                    <span className="flex shrink-0 items-center gap-2 text-[12px] text-muted-foreground">
                      {dateLabel(item.createdAt)}
                      {!item.readAt ? <span aria-label="Unread" className="h-2 w-2 rounded-full bg-primary" /> : null}
                    </span>
                  </span>
                  {item.body ? <span className="mt-1 block whitespace-pre-line text-[14px] text-muted-foreground">{item.body}</span> : null}
                </>
              );
              const className = "block w-full py-4 text-left text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
              return (
                <li key={item.id}>
                  {item.href && item.href !== "/dashboard/notifications" ? (
                    <Link href={item.href} onClick={() => markRead(item)} className={className}>{inner}</Link>
                  ) : (
                    <button type="button" onClick={() => markRead(item)} className={className}>{inner}</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
