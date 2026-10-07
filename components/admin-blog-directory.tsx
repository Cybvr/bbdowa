"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteDoc, doc } from "firebase/firestore";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { FilterBar, type SortOption } from "@/components/dashboard/filter-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { BLOG_CATEGORIES, type BlogCategory, type BlogPost } from "@/lib/blog";
import { formatBlogDate } from "@/lib/blog-dates";
import { firebaseDb } from "@/lib/firebase/client";
import { plural } from "@/lib/format";

const CATEGORIES: { value: BlogCategory | "all"; label: string }[] = [
  { value: "all", label: "All categories" },
  ...BLOG_CATEGORIES.map((value) => ({ value, label: value })),
];
const SORTS: SortOption<"recent" | "title">[] = [
  { key: "recent", label: "Most recent" },
  { key: "title", label: "Title (A–Z)" },
];

export function AdminBlogDirectory({ posts }: { posts: BlogPost[] }) {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<BlogCategory | "all">("all");
  const [sort, setSort] = React.useState<"recent" | "title">("recent");
  const [removed, setRemoved] = React.useState<string[]>([]);
  const [busySlug, setBusySlug] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const visible = React.useMemo(() => posts
    .filter((post) => !removed.includes(post.slug))
    .filter((post) => category === "all" || post.category === category)
    .filter((post) => [post.title, post.excerpt, post.category]
      .join(" ").toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => sort === "title"
      ? a.title.localeCompare(b.title)
      : b.publishedAt.localeCompare(a.publishedAt)), [posts, removed, category, search, sort]);

  const remove = async (post: BlogPost) => {
    if (!isAdmin || busySlug) return;
    if (!window.confirm(`Delete “${post.title}”? This can’t be undone.`)) return;
    setBusySlug(post.slug);
    setError(null);
    try {
      await deleteDoc(doc(firebaseDb, "blogs", post.slug));
      setRemoved((current) => [...current, post.slug]);
      router.refresh();
    } catch (cause) {
      console.error("Unable to delete blog post", cause);
      setError("Couldn’t delete this post. Try again.");
    } finally {
      setBusySlug(null);
    }
  };

  if (authLoading) return <p className="mt-6 text-sm text-muted-foreground">Loading blog posts…</p>;
  if (!isAdmin) return <p className="mt-6 text-sm text-muted-foreground">An admin account is required to manage blog posts.</p>;

  return (
    <>
      <FilterBar
        panelId="admin-blog-posts"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search posts"
        filters={[{ label: "Category", value: category, onChange: (value) => setCategory(value as BlogCategory | "all"), options: CATEGORIES }]}
        sortOptions={SORTS}
        activeSort={sort}
        onSortChange={setSort}
        resultCount={plural(visible.length, "post")}
      />

      {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
      <section id="admin-blog-posts" aria-label="Blog posts" className="mt-4">
        {visible.length ? (
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-56 px-4 py-3">Post</TableHead>
                <TableHead className="min-w-28 px-4 py-3">Category</TableHead>
                <TableHead className="min-w-32 px-4 py-3">Published</TableHead>
                <TableHead className="w-32 px-4 py-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((post) => (
                <ClickableTableRow key={post.slug} href={`/admin/blog/${encodeURIComponent(post.slug)}`} label={`Edit ${post.title}`}>
                  <TableCell className="px-4 py-4 font-semibold">
                    <Link href={`/admin/blog/${encodeURIComponent(post.slug)}`} className="block max-w-md truncate text-foreground no-underline hover:text-primary">{post.title}</Link>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{post.category}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-4 text-muted-foreground">{formatBlogDate(post.publishedAt)}</TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex justify-end gap-1">
                      <Link href={`/blog/${post.slug}`} aria-label={`View ${post.title}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"><ExternalLink aria-hidden="true" className="h-4 w-4" /></Link>
                      <Link href={`/admin/blog/${encodeURIComponent(post.slug)}`} aria-label={`Edit ${post.title}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"><Pencil aria-hidden="true" className="h-4 w-4" /></Link>
                      <button type="button" onClick={() => void remove(post)} disabled={Boolean(busySlug)} aria-label={`Delete ${post.title}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-50"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
                    </div>
                  </TableCell>
                </ClickableTableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="m-0 text-[15px] font-semibold">{posts.length ? "No posts match" : "No posts yet"}</p>
            <p className="mb-0 mt-1 text-sm text-muted-foreground">{posts.length ? "Try another search or category." : "Create a post to get started."}</p>
          </div>
        )}
      </section>
    </>
  );
}
