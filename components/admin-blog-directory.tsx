"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteDoc, doc } from "firebase/firestore";
import { ExternalLink, Eye, Pencil, Tag, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { FilterBar, useListView, type SortOption } from "@/components/dashboard/filter-bar";
import { CardGrid, CardMenu, DesktopTable, ListCard, MobileRow, MobileRows, ROW_ICON_ACTION, type CardMenuItem } from "@/components/dashboard/list-card";
import { TableActionsCell } from "@/components/dashboard/table-row-actions";
import { EmptyState } from "@/components/dashboard/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { BLOG_CATEGORIES, type BlogCategory, type BlogPost } from "@/lib/blog";
import { firebaseDb } from "@/lib/firebase/client";
import { plural, updatedDate } from "@/lib/format";
import { confirmDialog } from "@/components/confirm-dialog";

const CATEGORIES: { value: BlogCategory | "all"; label: string }[] = [
  { value: "all", label: "All categories" },
  ...BLOG_CATEGORIES.map((value) => ({ value, label: value })),
];
const SORTS: SortOption<"recent" | "title">[] = [
  { key: "recent", label: "Last updated" },
  { key: "title", label: "Title (A–Z)" },
];

export function AdminBlogDirectory({ posts }: { posts: BlogPost[] }) {
  const router = useRouter();
  const { isAdmin, role, loading: authLoading } = useAuth();
  const canManageBlog = isAdmin || role === "manager";
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<BlogCategory | "all">("all");
  const [sort, setSort] = React.useState<"recent" | "title">("recent");
  const [view, setView] = useListView("blog");
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
      : (b.updatedAt ?? b.publishedAt).localeCompare(a.updatedAt ?? a.publishedAt)), [posts, removed, category, search, sort]);

  const remove = async (post: BlogPost) => {
    if (!canManageBlog || busySlug) return;
    if (!await confirmDialog(`Delete “${post.title}”? This can’t be undone.`)) return;
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

  const menuItems = (post: BlogPost): CardMenuItem[] => [
    { label: "View", icon: <ExternalLink className="h-4 w-4" />, href: `/dashboard/blog/${post.slug}` },
    { label: "Edit", icon: <Pencil className="h-4 w-4" />, href: `/admin/blog/${encodeURIComponent(post.slug)}` },
    { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onSelect: () => void remove(post), destructive: true, disabled: Boolean(busySlug) },
  ];

  if (authLoading) return <p className="mt-6 text-sm text-muted-foreground">Loading blog posts…</p>;
  if (!canManageBlog) return <p className="mt-6 text-sm text-muted-foreground">A staff account is required to manage blog posts.</p>;

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
        view={view}
        onViewChange={setView}
        add={{ href: "/admin/blog/new" }}
      />

      {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
      <section id="admin-blog-posts" aria-label="Blog posts">
        {visible.length ? view === "cards" ? (
          <CardGrid>
            {visible.map((post) => (
              <ListCard key={post.slug} href={`/admin/blog/${encodeURIComponent(post.slug)}`} image={post.mediaType === "video" ? null : post.image} title={post.title} subtitle={updatedDate(post.updatedAt ?? post.publishedAt)} menu={<CardMenu items={menuItems(post)} />} />
            ))}
          </CardGrid>
        ) : (<>
          <MobileRows>
            {visible.map((post) => (
              <MobileRow
                key={post.slug}
                href={`/admin/blog/${encodeURIComponent(post.slug)}`}
                image={post.mediaType === "video" ? null : post.image}
                title={post.title}
                chip={post.category}
                chipIcon={<Tag className="h-4 w-4 shrink-0" aria-hidden="true" />}
                detail={updatedDate(post.updatedAt ?? post.publishedAt)}
                actions={<Link href={`/dashboard/blog/${post.slug}`} aria-label={`View ${post.title}`} className={ROW_ICON_ACTION}><Eye className="h-5 w-5" aria-hidden="true" /></Link>}
                menu={<CardMenu items={menuItems(post)} triggerClassName={ROW_ICON_ACTION} />}
              />
            ))}
          </MobileRows>
          <DesktopTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((post) => (
                  <ClickableTableRow key={post.slug} href={`/admin/blog/${encodeURIComponent(post.slug)}`} label={`Edit ${post.title}`}>
                    <TableCell className="font-semibold">
                      <Link href={`/admin/blog/${encodeURIComponent(post.slug)}`} className="text-foreground no-underline hover:text-primary">{post.title}</Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{post.category}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{updatedDate(post.updatedAt ?? post.publishedAt)}</TableCell>
                    <TableActionsCell
                      primary={[
                        { label: "View", icon: <ExternalLink className="h-4 w-4" />, href: `/dashboard/blog/${post.slug}` },
                        { label: "Edit", icon: <Pencil className="h-4 w-4" />, href: `/admin/blog/${encodeURIComponent(post.slug)}` },
                      ]}
                      items={[{ label: "Delete", icon: <Trash2 className="h-4 w-4" />, onSelect: () => void remove(post), destructive: true, disabled: Boolean(busySlug) }]}
                      label={`More actions for ${post.title}`}
                    />
                  </ClickableTableRow>
                ))}
              </TableBody>
            </Table>
          </DesktopTable>
        </>
        ) : (
          <EmptyState title={posts.length ? "No posts match" : "No posts yet"} description={posts.length ? "Try another search or category." : "Create a post to get started."} />
        )}
      </section>
    </>
  );
}
