"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { LIST_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
import type { BlogPost } from "@/lib/blog";

export function BlogActions({ post }: { post: BlogPost }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;

  return (
    <div className="mt-8">
      <Link href={`/admin/blog/${encodeURIComponent(post.slug)}`} className={LIST_ACTION_CLASS}>
        <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
        Edit post
      </Link>
    </div>
  );
}
