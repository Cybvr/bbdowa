import { richTextToPlainText } from "@/lib/rich-text";

const CTA_PATTERN = /<p\b[^>]*data-message-cta=["']true["'][^>]*>\s*<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>\s*<\/p>/i;
const CTA_PATTERN_GLOBAL = new RegExp(CTA_PATTERN.source, "gi");

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character]!);

const decodeHtml = (value: string) => value
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#(?:0?39|x27);/gi, "'");

export function ensureMessageHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function stripMessageCta(value: string): string {
  return ensureMessageHtml(value).replace(CTA_PATTERN_GLOBAL, "").trim();
}

export function extractMessageCta(value: string): { label: string; href: string } | null {
  const match = ensureMessageHtml(value).match(CTA_PATTERN);
  if (!match) return null;
  const href = decodeHtml(match[1]).trim();
  const label = richTextToPlainText(decodeHtml(match[2])).trim();
  return { label, href };
}

export function buildMessageHtml(body: string, actionLabel = "", actionHref = ""): string {
  const content = stripMessageCta(body);
  const label = actionLabel.trim();
  const href = actionHref.trim();
  if (!label || !href) return content;
  return `${content}<p data-message-cta="true"><a data-message-button="true" href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>`;
}

export function messageHtmlToPlainText(value: string): string {
  return richTextToPlainText(stripMessageCta(value));
}

/** Allow only the structural HTML emitted by the shared Tiptap editor. */
export function sanitizeMessageBodyHtml(value: string): string {
  const allowed = new Set(["p", "br", "strong", "em", "s", "h2", "ul", "ol", "li", "blockquote", "code", "pre", "hr"]);
  return stripMessageCta(value)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (tag, name: string) => {
      const normalized = name.toLowerCase();
      if (!allowed.has(normalized)) return "";
      if (tag.startsWith("</")) return `</${normalized}>`;
      return normalized === "br" || normalized === "hr" ? `<${normalized}>` : `<${normalized}>`;
    });
}
