"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { EditSheet, SelectField, TextField, TextareaField } from "@/components/detail-editor";
import type { BlogPost } from "@/lib/blog";

export function BlogActions({ post }: { post: BlogPost }) {
  const router = useRouter();

  const [title, setTitle] = React.useState(post.title ?? "");
  const [excerpt, setExcerpt] = React.useState(post.excerpt ?? "");
  const [publishedAt, setPublishedAt] = React.useState(post.publishedAt ?? "");
  const [category, setCategory] = React.useState<BlogPost["category"]>(post.category ?? "News");
  const [sourceName, setSourceName] = React.useState(post.sourceName ?? "");
  const [sourceUrl, setSourceUrl] = React.useState(post.sourceUrl ?? "");
  const [image, setImage] = React.useState(post.image ?? "");

  const save = async () => {
    await updateDoc(doc(firebaseDb, "blogs", post.slug), {
      title: title.trim(),
      excerpt: excerpt.trim(),
      publishedAt: publishedAt.trim(),
      category,
      sourceName: sourceName.trim(),
      sourceUrl: sourceUrl.trim() || null,
      image: image.trim() || null,
      updatedAt: serverTimestamp(),
    });
    router.refresh();
  };

  const remove = async () => {
    await deleteDoc(doc(firebaseDb, "blogs", post.slug));
    router.push("/dashboard/blog");
  };

  return (
    <EditSheet
      title="Edit update"
      description={post.title}
      onSave={save}
      onDelete={remove}
      deleteConfirm="Delete this update? This can’t be undone."
    >
      <TextField label="Title" value={title} onChange={setTitle} />
      <TextareaField label="Excerpt" value={excerpt} onChange={setExcerpt} rows={4} />
      <TextField label="Published date" value={publishedAt} onChange={setPublishedAt} type="date" />
      <SelectField
        label="Category"
        value={category}
        onChange={(value) => setCategory(value as BlogPost["category"])}
        options={[
          { value: "News", label: "News" },
          { value: "People", label: "People" },
          { value: "Work", label: "Work" },
          { value: "Industry", label: "Industry" },
        ]}
      />
      <TextField label="Source name" value={sourceName} onChange={setSourceName} />
      <TextField label="Source URL" value={sourceUrl} onChange={setSourceUrl} />
      <TextField label="Image URL" value={image} onChange={setImage} />
    </EditSheet>
  );
}
