"use client";

import * as React from "react";
import { Node } from "@tiptap/core";
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor, type NodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { marked } from "marked";

const EditorKit = StarterKit.configure({ link: { openOnClick: false, autolink: true } });
const TABLE_EXTENSIONS = [Table.configure({ resizable: false }), TableRow, TableHeader, TableCell];

/** Shared look for formatted text, in the editor and when it is shown read-only. */
const PROSE = "[&_a]:text-primary [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px] [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_hr]:my-5 [&_hr]:border-border [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-[22px] [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-[15px] [&_h4]:font-semibold [&_h5]:mb-2 [&_h5]:mt-3 [&_h5]:text-[14px] [&_h5]:font-semibold [&_h6]:mb-2 [&_h6]:mt-3 [&_h6]:text-[13px] [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-[0.06em] [&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0 [&_li]:ml-5 [&_li]:pl-1 [&_ol]:list-decimal [&_ul]:list-disc [&_p]:mb-3 [&_p:last-child]:mb-0 [&_li_p]:mb-1 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_u]:underline";

function fontSizePt(value: string): number {
  const size = parseFloat(value);
  if (Number.isNaN(size)) return 0;
  return value.endsWith("px") ? size * 0.75 : value.endsWith("em") || value.endsWith("rem") ? size * 12 : size;
}

function renameElement(element: Element, tag: string) {
  const next = element.ownerDocument.createElement(tag);
  while (element.firstChild) next.appendChild(element.firstChild);
  element.replaceWith(next);
  return next;
}

/**
 * Google Docs, Word and many web pages style text with inline CSS instead of
 * tags (bold is a span with font-weight:700, a title is a big font-size). Turn
 * that styling into real tags so bold, italics, underline and headings survive.
 */
function normalizePastedHtml(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  // Paragraphs set in a large font are headings.
  doc.querySelectorAll("p").forEach((paragraph) => {
    const text = paragraph.textContent?.trim() ?? "";
    if (!text || text.length > 120) return;
    const sizes = [paragraph, ...paragraph.querySelectorAll<HTMLElement>("[style]")]
      .map((element) => fontSizePt((element as HTMLElement).style?.fontSize ?? ""));
    const size = Math.max(0, ...sizes);
    if (size >= 20) renameElement(paragraph, "h1");
    else if (size >= 16) renameElement(paragraph, "h2");
    else if (size >= 14) renameElement(paragraph, "h3");
  });

  // Inline styles become marks.
  doc.querySelectorAll<HTMLElement>("span[style], font[style]").forEach((span) => {
    const { fontWeight, fontStyle, textDecoration, textDecorationLine } = span.style;
    const weight = Number(fontWeight);
    const wrappers = [
      fontWeight === "bold" || fontWeight === "bolder" || weight >= 600 ? "strong" : null,
      fontStyle === "italic" ? "em" : null,
      `${textDecoration} ${textDecorationLine}`.includes("underline") ? "u" : null,
    ].filter(Boolean) as string[];
    let inner: Element = span;
    for (const tag of wrappers) {
      const wrapper = doc.createElement(tag);
      while (inner.firstChild) wrapper.appendChild(inner.firstChild);
      inner.appendChild(wrapper);
      inner = wrapper;
    }
  });

  // Google Docs wraps everything in <b style="font-weight:normal">; drop it so it isn't read as bold.
  doc.querySelectorAll<HTMLElement>("b").forEach((element) => {
    if (element.style.fontWeight === "normal" || element.style.fontWeight === "400") {
      element.replaceWith(...element.childNodes);
    }
  });

  return doc.body.innerHTML;
}
import { Bold, Code, Columns3, FileCode, Italic, Link as LinkIcon, List, ListOrdered, Minus, MousePointerClick, Quote, Redo2, Rows3, SquareCode, Strikethrough, Table as TableIcon, Trash2, Underline as UnderlineIcon, Undo2 } from "lucide-react";

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;
export { richTextToPlainText } from "@/lib/rich-text";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const MARKDOWN_HINT = /(\*\*[^*\n]+\*\*|^\s*#{1,6}\s|^\s*[-*•+]\s+\S|^\s*\d+[.)]\s+\S|^\s*>\s|^\s*```|^\s*\|.*\|\s*$|\[[^\]\n]+\]\([^)\s]+\))/m;

/** Turns Markdown (headings, emphasis, lists, links, tables, code) into the editor's HTML. */
function markdownToHtml(text: string): string {
  return (marked.parse(text.replace(/^\s*•\s+/gm, "- "), { gfm: true, async: false }) as string).trim();
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

function MessageButtonView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const label = String(node.attrs.label || "Open Bantaba");
  const href = String(node.attrs.href || "/dashboard");
  return (
    <NodeViewWrapper
      contentEditable={false}
      className={`my-5 rounded-xl border bg-muted/20 p-4 ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
    >
      <div className="mb-4">
        <span className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">
          {label || "Button label"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] sm:items-end">
        <label className="block min-w-0 space-y-1.5">
          <span className="block text-xs font-semibold text-muted-foreground">Button text</span>
          <input
            value={label}
            onChange={(event) => updateAttributes({ label: event.target.value.slice(0, 80) })}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="block min-w-0 space-y-1.5">
          <span className="block text-xs font-semibold text-muted-foreground">Bantaba link</span>
          <input
            value={href}
            onChange={(event) => updateAttributes({ href: event.target.value.slice(0, 500) })}
            placeholder="/dashboard"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <button
          type="button"
          onClick={deleteNode}
          aria-label="Remove message button"
          title="Remove button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </NodeViewWrapper>
  );
}

const MessageButton = Node.create({
  name: "messageButton",
  priority: 1000,
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      label: { default: "Open Bantaba" },
      href: { default: "/dashboard" },
    };
  },
  parseHTML() {
    return [{
      tag: 'p[data-message-cta="true"]',
      getAttrs: (element) => {
        if (!(element instanceof HTMLElement)) return false;
        const anchor = element.querySelector("a[data-message-button], a");
        return {
          label: anchor?.textContent?.trim() || "Open Bantaba",
          href: anchor?.getAttribute("href") || "/dashboard",
        };
      },
    }];
  },
  renderHTML({ node }) {
    return [
      "p",
      { "data-message-cta": "true" },
      ["a", { "data-message-button": "true", href: String(node.attrs.href ?? "") }, String(node.attrs.label ?? "")],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MessageButtonView);
  },
});

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = "Write the document text…",
  hideLabel = false,
  compact = false,
  tall = false,
  disabled = false,
  allowMessageButton = false,
}: {
  label: string;
  hideLabel?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  disabled?: boolean;
  allowMessageButton?: boolean;
  /** A much taller writing area, for long-form copy like a job description. */
  tall?: boolean;
}) {
  const [htmlMode, setHtmlMode] = React.useState(false);
  const editor = useEditor({
    extensions: allowMessageButton ? [EditorKit, ...TABLE_EXTENSIONS, MessageButton] : [EditorKit, ...TABLE_EXTENSIONS],
    content: asEditorContent(value),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      // Pasted Markdown (e.g. from a chat) becomes headings, bold and lists instead of literal ** and -.
      // Headings from Google Docs, Word and web pages map onto our two levels.
      transformPastedHTML: normalizePastedHtml,
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain") ?? "";
        // Markdown copied from a .md file or a code editor arrives as plain text (or unstyled HTML), so parse it as Markdown.
        const html = event.clipboardData?.getData("text/html") ?? "";
        const formattedHtml = /<(h[1-6]|strong|em|ul|ol|table|blockquote|a)[\s>]/i.test(html);
        if (!text || !MARKDOWN_HINT.test(text) || formattedHtml) return false;
        event.preventDefault();
        // Run the converted HTML through the normal paste path so blocks (headings, lists, tables) stay blocks.
        view.pasteHTML(markdownToHtml(text).replace(/>\s+</g, "><"));
        return true;
      },
      attributes: {
        "aria-label": label,
        class: `${tall ? "min-h-[32rem]" : compact ? "min-h-36" : "min-h-56"} px-4 py-3 text-[14px] leading-[1.65] outline-none ${PROSE}`,
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  React.useEffect(() => {
    if (!editor) return;
    const nextContent = asEditorContent(value);
    if (nextContent !== editor.getHTML()) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [editor, value]);

  React.useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  let hasMessageButton = false;
  editor?.state.doc.descendants((node) => {
    if (node.type.name === "messageButton") hasMessageButton = true;
  });

  return (
    <div className="space-y-1.5">
      <span className={hideLabel ? "sr-only" : compact ? "block text-[13px] text-muted-foreground" : "block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"}>{label}</span>
      <div className="overflow-hidden rounded-md border border-input bg-background transition focus-within:border-foreground focus-within:ring-2 focus-within:ring-primary/20">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1" aria-label={`${label} formatting`}>
          <select
            aria-label="Text style"
            disabled={!editor || disabled || htmlMode}
            value={HEADING_LEVELS.find((level) => editor?.isActive("heading", { level })) ?? 0}
            onChange={(event) => {
              const level = Number(event.target.value) as (typeof HEADING_LEVELS)[number] | 0;
              if (level) editor?.chain().focus().setHeading({ level }).run();
              else editor?.chain().focus().setParagraph().run();
            }}
            className="h-8 rounded-md bg-transparent px-1.5 text-[13px] text-foreground outline-none hover:bg-muted disabled:opacity-40"
          >
            <option value={0}>Paragraph</option>
            {HEADING_LEVELS.map((level) => <option key={level} value={level}>Heading {level}</option>)}
          </select>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <ToolbarButton label="Bold" active={editor?.isActive("bold")} disabled={!editor || disabled || htmlMode} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Italic" active={editor?.isActive("italic")} disabled={!editor || disabled || htmlMode} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Underline" active={editor?.isActive("underline")} disabled={!editor || disabled || htmlMode} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Strikethrough" active={editor?.isActive("strike")} disabled={!editor || disabled || htmlMode} onClick={() => editor?.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Inline code" active={editor?.isActive("code")} disabled={!editor || disabled || htmlMode} onClick={() => editor?.chain().focus().toggleCode().run()}>
            <Code className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label={editor?.isActive("link") ? "Remove link" : "Add link"}
            active={editor?.isActive("link")}
            disabled={!editor || disabled || htmlMode}
            onClick={() => {
              if (!editor) return;
              if (editor.isActive("link")) { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
              const href = window.prompt("Link address", "https://");
              if (href && href !== "https://") editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
            }}
          >
            <LinkIcon className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <ToolbarButton label="Bulleted list" active={editor?.isActive("bulletList")} disabled={!editor || disabled || htmlMode} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" active={editor?.isActive("orderedList")} disabled={!editor || disabled || htmlMode} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Quote" active={editor?.isActive("blockquote")} disabled={!editor || disabled || htmlMode} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Code block" active={editor?.isActive("codeBlock")} disabled={!editor || disabled || htmlMode} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
            <SquareCode className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Divider" disabled={!editor || disabled || htmlMode} onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Insert table" disabled={!editor || disabled || htmlMode} onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          {editor?.isActive("table") && !htmlMode ? <>
            <ToolbarButton label="Add row" disabled={disabled} onClick={() => editor.chain().focus().addRowAfter().run()}><Rows3 className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
            <ToolbarButton label="Add column" disabled={disabled} onClick={() => editor.chain().focus().addColumnAfter().run()}><Columns3 className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
            <ToolbarButton label="Delete row" disabled={disabled} onClick={() => editor.chain().focus().deleteRow().run()}><Trash2 className="h-4 w-4" aria-hidden="true" /></ToolbarButton>
            <ToolbarButton label="Delete table" disabled={disabled} onClick={() => editor.chain().focus().deleteTable().run()}><TableIcon className="h-4 w-4 text-destructive" aria-hidden="true" /></ToolbarButton>
          </> : null}
          {allowMessageButton ? <ToolbarButton label={hasMessageButton ? "Message button added" : "Add message button"} active={hasMessageButton} disabled={!editor || disabled || hasMessageButton} onClick={() => editor?.chain().focus("end").insertContent({ type: "messageButton", attrs: { label: "Open Bantaba", href: "/dashboard" } }).run()}>
            <MousePointerClick className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton> : null}
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <ToolbarButton label="Undo" disabled={!editor || disabled || !editor.can().undo()} onClick={() => editor?.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Redo" disabled={!editor || disabled || !editor.can().redo()} onClick={() => editor?.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <ToolbarButton label={htmlMode ? "Back to editor" : "Edit HTML"} active={htmlMode} disabled={!editor || disabled} onClick={() => setHtmlMode((current) => !current)}>
            <FileCode className="h-4 w-4" aria-hidden="true" />
          </ToolbarButton>
        </div>
        {htmlMode ? (
          <textarea
            aria-label={`${label} HTML`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            spellCheck={false}
            className={`${tall ? "min-h-[32rem]" : compact ? "min-h-36" : "min-h-56"} block w-full resize-y bg-background px-4 py-3 font-mono text-[13px] leading-[1.6] outline-none`}
          />
        ) : (
          <div className="relative">
            {!value && !editor?.getText() ? (
              <span className="pointer-events-none absolute left-4 top-3 text-[14px] text-muted-foreground">{placeholder}</span>
            ) : null}
            <EditorContent editor={editor} />
          </div>
        )}
      </div>
    </div>
  );
}

export function RichTextContent({ value, className = "" }: { value: string; className?: string }) {
  const html = asEditorContent(value);
  return (
    <div
      className={`[&_.ProseMirror]:outline-none ${PROSE} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
