export const BBDO_ADDRESS = "Plot 5 Chief Yesufu Abiodun Oniru Road, Victoria Island, Lagos 106104, Lagos";
export const BBDO_DISCLAIMER = "This email and any attachments are intended only for the named recipient and may contain confidential information. If you received it in error, please notify the sender and delete it. Please do not copy, disclose or distribute its contents.";
export const emailEscape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

export function emailHeader(site: string) {
  return `<tr><td style="padding:24px 28px;background:#fff;"><img src="${emailEscape(site.replace(/\/$/, ""))}/bbdo-west-africa.png" width="180" alt="BBDO West Africa" style="display:block;width:180px;max-width:100%;height:auto;border:0;"></td></tr>`;
}

export function emailFooter(note = "") {
  return `<tr><td style="padding:20px 28px;border-top:1px solid #eceef3;font-size:12px;line-height:1.6;color:#606570;">
<strong style="color:#111318;">BBDO West Africa</strong><p style="margin:8px 0;">${BBDO_ADDRESS}</p>
<p style="margin:8px 0;"><a href="https://ng.linkedin.com/company/bbdo-west-africa" style="color:#111318;">LinkedIn</a> · <a href="https://www.instagram.com/bbdo_westafrica/?hl=en" style="color:#111318;">Instagram</a></p>
${note ? `<p style="margin:12px 0;">${emailEscape(note)}</p>` : ""}<p style="margin:12px 0 0;font-size:11px;">${BBDO_DISCLAIMER}</p></td></tr>`;
}

export function renderMessageEmail(subject: string, message: string, site = "https://bbdowa.com", button?: { label: string; url: string }, heading = subject) {
  const hasRichText = /<[a-z][\s\S]*>/i.test(message);
  const content = hasRichText
    ? sanitizeMessageBodyHtml(message)
    : message.split(/\n\s*\n/).map((line) => `<p>${emailEscape(line).replace(/\n/g, "<br>")}</p>`).join("");
  const embedded = extractMessageCta(message);
  let resolvedButton = button;
  if (embedded?.label && embedded.href) {
    try {
      const url = new URL(embedded.href, `${site.replace(/\/$/, "")}/`).toString();
      if (/^https?:\/\//.test(url)) resolvedButton = { label: embedded.label, url };
    } catch { /* Invalid embedded links are omitted from the email. */ }
  }
  const action = resolvedButton && /^https?:\/\//.test(resolvedButton.url) ? `<p style="margin:8px 0 6px;"><a href="${emailEscape(resolvedButton.url)}" style="display:inline-block;background:#e51b23;color:#fff;padding:12px 20px;text-decoration:none;">${emailEscape(resolvedButton.label)}</a></p><p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#606570;">Button not working? Paste this link into your browser:<br><a href="${emailEscape(resolvedButton.url)}" style="color:#606570;word-break:break-all;">${emailEscape(resolvedButton.url)}</a></p>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${emailEscape(subject)}</title></head><body style="margin:0;background:#f4f5f8;font-family:Arial,sans-serif;color:#111318;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;">${emailHeader(site)}<tr><td style="padding:12px 28px 24px;font-size:15px;line-height:1.6;overflow-wrap:anywhere;"><h1 style="font-size:22px;margin:0 0 20px;">${emailEscape(heading)}</h1><div style="font-size:15px;line-height:1.6;color:#2b2f38;">${content}</div>${action}</td></tr>${emailFooter()}</table></td></tr></table></body></html>`;
}
import { extractMessageCta, sanitizeMessageBodyHtml } from "@/lib/message-html";

