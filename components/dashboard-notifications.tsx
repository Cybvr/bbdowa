"use client";

import Link from "next/link";
import { BellIcon } from "lucide-react";
import type { BlogPost } from "@/lib/blog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardNotifications({ posts }: { posts: BlogPost[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Open latest updates (${posts.length} new)`}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <BellIcon className="h-4 w-4" aria-hidden="true" />
          {posts.length > 0 ? (
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-[min(360px,calc(100vw-2.5rem))] p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="m-0 text-[14px] font-semibold">Latest updates</p>
          <p className="mb-0 mt-0.5 text-[12px] text-muted-foreground">Agency news, work and industry signals.</p>
        </div>
        <ul className="m-0 list-none divide-y divide-border p-0">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/dashboard/blog/${post.slug}`}
                className="block px-4 py-3 text-foreground no-underline outline-none hover:bg-muted focus-visible:bg-muted"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[13px] font-semibold leading-[1.35]">{post.title}</span>
                  <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground">{post.publishedAt}</span>
                </div>
                <p className="mb-0 mt-1.5 line-clamp-2 text-[12px] leading-[1.4] text-muted-foreground">
                  {post.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/dashboard/blog"
          className="block border-t border-border px-4 py-3 text-[12px] font-semibold text-primary no-underline hover:bg-muted focus-visible:outline-none focus-visible:bg-muted"
        >
          View all updates
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
