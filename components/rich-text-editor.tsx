"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";
export { richTextToPlainText } from "@/lib/rich-text";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const MARKDOWN_HINT = /(\*\*[^*\n]+\*\*|^\s*#{1,3}\s|^\s*[-*•]\s+\S|^\s*\d+[.)]\s+\S)/m;

function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?=[^*\w]|$)/g, "$1<em>$2</em>")
    .replace(/(^|\W)_([^_\n]+)_(?=\W|$)/g, "$1<em>$2</em>");
}

/** Turns pasted Markdown (headings, bold, lists) into the editor's HTML. */
function markdownToHtml(text: string): string {
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    const heading = line.match(/^#{1,3}\s+(.*)$/) ?? line.match(/^\*\*([^*]+)\*\*:?$/);
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (heading) {
      closeList();
      out.push(`<h2>${inlineMarkdown(heading[1])}</h2>`);
    } else if (bullet || numbered) {
      const kind = bullet ? "ul" : "ol";
      if (list !== kind) {
        closeList();
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li><p>${inlineMarkdown((bullet ?? numbered)![1])}</p></li>`);
    } else {
      closeList();
      out.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }
  closeList();
  return out.join("");
}

function decodeEntities(value: string): string {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&amp;", "&");
}

function asEditorContent(value: string): string {
  if (!value.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(value)) {
    // Markdown pasted as plain paragraphs: rebuild it as real formatting. Already formatted HTML is left alone.
    const plainParagraphsOnly = !/<(?!\/?(p|br)\b)[a-z]/i.test(value);
    if (plainParagraphsOnly) {
      const text = decodeEntities(value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]*>/g, ""));
      if (MARKDOWN_HINT.test(text)) return markdownToHtml(text);
    }
    return value;
  }
  if (MARKDOWN_HINT.test(value)) return markdownToHtml(value);
  return value
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}

export function richTextHasContent(value: string): boolean {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim()
    .length > 0;
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md border text-muted-foreground transition hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-foreground bg-muted text-foreground" : "border-transparent"}`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = "Write the document text…",
  hideLabel = false,
  compact = false,
  tall = false,
}: {
  label: string;
  hideLabel?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  /** A much taller writing area, for long-form copy like a job description. */
  tall?: boolean;
}) {
  const pasteHtml = React.useRef<((html: string) => void) | null>(null);
  const editor = useEditor({
    extensions: [StarterKit],
    content: asEditorContent(value),
    immediatelyRender: false,
    editorProps: {
      // Pasted Markdown (e.g. from a chat) becomes headings, bold and lists instead of literal ** and -.
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const hasHtml = Boolean(event.clipboardData?.getData("text/html"));
        if (!text || !MARKDOWN_HINT.test(text) || (hasHtml && !/\*\*|^\s*#{1,3}\s/m.test(text))) return false;
        event.preventDefault();
        pasteHtml.current?.(markdownToHtml(text));
        return true;
      },
      attributes: {
        "aria-label": label,
        class: `${tall ? "min-h-[32rem]" : compact ? "min-h-36" : "min-h-56"} px-4 py-3 text-[14px] leading-[1.65] outline-none [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2:first-child]:mt-0 [&_li]:ml-5 [&_li]:pl-1 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc`,
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  React.useEffect(() => {
    pasteHtml.current = editor ? (html) => editor.chain().focus().insertContent(html).run() : null;
  }, [editor]);

  React.useEffect(() => {
    if (!editor) return;
    const nextContent = asEditorContent(value);
    if (nextContent !== editor.getHTML()) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className="space-y-1.5">
      <span className={hideLabel ? "sr-only" : compact ? "block text-[13px] text-muted-foreground" : "block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"}>{label}</span>
      <div className="overflow-hidden rounded-md border border-input bg-background transition focus-within:border-foreground focus-within:ring-2 focus-within:ring-primary/20">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1" aria-label={`${label} formatting`}>
          <ToolbarButton label="Bold" active={editor?.isActive("bold")} disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Italic" active={editor?.isActive("italic")} disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Heading" active={editor?.isActive("heading", { level: 2 })} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Bulleted list" active={editor?.isActive("bulletList")} disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" active={editor?.isActive("orderedList")} disabled={!editor} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <ToolbarButton label="Undo" disabled={!editor || !editor.can().undo()} onClick={() => editor?.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Redo" disabled={!editor || !editor.can().redo()} onClick={() => editor?.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
        </div>
        <div className="relative">
          {!value && !editor?.getText() ? (
            <span className="pointer-events-none absolute left-4 top-3 text-[14px] text-muted-foreground">{placeholder}</span>
          ) : null}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

export function RichTextContent({ value, className = "" }: { value: string; className?: string }) {
  const html = asEditorContent(value);
  return (
    <div
      className={`[&_.ProseMirror]:outline-none [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2:first-child]:mt-0 [&_li]:ml-5 [&_li]:pl-1 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
