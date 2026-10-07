"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/ui";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { LIST_ACTION_CLASS, PRIMARY_ACTION_CLASS } from "@/components/dashboard/list-page-actions";
import { ImageUploadField } from "@/components/detail-editor";
import { RichTextEditor, richTextHasContent } from "@/components/rich-text-editor";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOG_CATEGORIES, type BlogCategory, type BlogPost } from "@/lib/blog";
import { firebaseDb } from "@/lib/firebase/client";
import { slugify } from "@/lib/job-records";

const FIELD_LABEL = "block text-sm font-medium text-foreground";
const FIELD = "mt-2 w-full border-input bg-background text-foreground";

export function BlogEditor({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [title, setTitle] = React.useState(post?.title ?? "");
  const [category, setCategory] = React.useState<BlogCategory>(post?.category ?? "News");
  const [excerpt, setExcerpt] = React.useState(post?.excerpt ?? "");
  const [content, setContent] = React.useState(post?.content ?? post?.excerpt ?? "");
  const [publishedAt, setPublishedAt] = React.useState(post?.publishedAt ?? new Date().toISOString().slice(0, 10));
  const [image, setImage] = React.useState(post?.image ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin || busy) return;
    if (!title.trim() || !excerpt.trim() || !richTextHasContent(content) || !publishedAt) {
      setError("Enter a title, excerpt, content and published date.");
      return;
    }

    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const values = {
        title: title.trim(),
        category,
        excerpt: excerpt.trim(),
        content,
        publishedAt,
        image: image || null,
        updatedAt: serverTimestamp(),
      };

      if (post) {
        await updateDoc(doc(firebaseDb, "blogs", post.slug), values);
        setSaved(true);
        router.refresh();
      } else {
        const slug = slugify(title);
        const reference = doc(firebaseDb, "blogs", slug);
        if ((await getDoc(reference)).exists()) throw new Error("A post with this link already exists. Try saving again.");
        await setDoc(reference, { ...values, slug, createdAt: serverTimestamp() });
        router.replace(`/admin/blog/${encodeURIComponent(slug)}`);
        router.refresh();
      }
    } catch (cause) {
      console.error("Unable to save blog post", cause);
      setError(cause instanceof Error && cause.message.startsWith("A post with") ? cause.message : "Couldn’t save this post. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!post || !isAdmin || busy) return;
    if (!window.confirm(`Delete “${post.title}”? This can’t be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDoc(doc(firebaseDb, "blogs", post.slug));
      router.push("/admin/blog");
      router.refresh();
    } catch (cause) {
      console.error("Unable to delete blog post", cause);
      setError("Couldn’t delete this post. Try again.");
      setBusy(false);
    }
  };

  if (authLoading) return <PageLoadingSkeleton titleWidth="w-40" />;
  if (!isAdmin) return <><PageHeader title="Blog" /><p className="mt-6 text-sm text-muted-foreground">An admin account is required to manage blog posts.</p></>;

  return (
    <>
      <Link href="/admin/blog" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />All blog posts
      </Link>
      <PageHeader
        title={post ? "Edit post" : "New post"}
        description={post ? "Update this post and its category." : "Add a post to the agency blog."}
        actions={post ? <Link href={`/dashboard/blog/${post.slug}`} className={LIST_ACTION_CLASS}><ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />View post</Link> : undefined}
      />

      <form onSubmit={save} className="mt-7 space-y-7">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="min-w-0">
            <RichTextEditor label="Content" value={content} onChange={setContent} placeholder="Write the post…" tall />
          </div>

          <aside className="min-w-0 space-y-6" aria-label="Post details">
            <ImageUploadField label="Cover image" value={image} onChange={setImage} uploadPath="blog/images" disabled={busy} />

            <div>
              <label htmlFor="blog-title" className={FIELD_LABEL}>Title</label>
              <Input id="blog-title" value={title} onChange={(event) => setTitle(event.target.value)} className={FIELD} required disabled={busy} />
            </div>

            <div>
              <label htmlFor="blog-excerpt" className={FIELD_LABEL}>Excerpt</label>
              <textarea id="blog-excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={4} required disabled={busy} className="mt-2 min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div>
                <label htmlFor="blog-category" className={FIELD_LABEL}>Category</label>
                <Select value={category} onValueChange={(value) => setCategory(value as BlogCategory)} disabled={busy}>
                  <SelectTrigger id="blog-category" className={FIELD}><SelectValue /></SelectTrigger>
                  <SelectContent>{BLOG_CATEGORIES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="blog-published-at" className={FIELD_LABEL}>Published date</label>
                <Input id="blog-published-at" type="date" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} className={FIELD} required disabled={busy} />
              </div>
            </div>

          </aside>
        </div>

        {error ? <p role="alert" className="m-0 text-sm text-destructive">{error}</p> : null}
        {saved ? <p role="status" className="m-0 text-sm text-muted-foreground">Changes saved.</p> : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <button type="submit" disabled={busy} className={PRIMARY_ACTION_CLASS}>{busy ? "Saving…" : post ? "Save changes" : "Create post"}</button>
          <Link href="/admin/blog" className={LIST_ACTION_CLASS}>Cancel</Link>
          {post ? <button type="button" onClick={() => void remove()} disabled={busy} className="ml-auto inline-flex h-9 items-center gap-2 text-sm font-medium text-destructive hover:underline disabled:opacity-50"><Trash2 aria-hidden="true" className="h-4 w-4" />Delete post</button> : null}
        </div>
      </form>
    </>
  );
}
