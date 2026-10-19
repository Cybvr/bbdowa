// Server-only. Plain, table-based HTML so it renders in every mail client, plus a text version.

import { emailHeader, emailFooter, BBDO_ADDRESS, BBDO_DISCLAIMER } from "./brand";
import { fillTemplate, TEMPLATE_DEFAULTS, validTemplate } from "./template-definitions";
export type EmailContent = { subject: string; html: string; text: string; layout?: Layout; templateKey?: string; variables?: Record<string, string> };

const BRAND_RED = "#e51b23";

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const firstName = (name: string | null | undefined) => name?.trim().split(/\s+/)[0] || "there";

type Layout = {
  preheader: string;
  heading: string;
  /** Paragraphs of plain text. */
  paragraphs: string[];
  /** Label and value rows shown in a small details box. */
  details?: Array<[string, string]>;
  button?: { label: string; url: string };
  footer?: string;
  /** Mention the Settings opt-out. Off for people who have no account yet. */
  optOut?: boolean;
};

function render(layout: Layout, subject: string): EmailContent {
  const { preheader, heading, paragraphs, details, button, footer, optOut = true } = layout;
  let emailSite = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://bbdowa.com";
  if (button?.url) {
    try { emailSite = new URL(button.url).origin; } catch { /* Keep the configured site for relative or malformed URLs. */ }
  }
  const optOutNote = optOut ? " You can turn these emails off in Settings." : "";
  const detailRows = (details ?? []).filter(([, value]) => value);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111318;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f8;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;">
${emailHeader(emailSite)}
<tr><td style="padding:28px;">
<h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;font-weight:700;">${escapeHtml(heading)}</h1>
${paragraphs.map((paragraph) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#2b2f38;">${escapeHtml(paragraph)}</p>`).join("\n")}
${detailRows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;background:#f4f5f8;border-radius:10px;"><tr><td style="padding:12px 16px;">${detailRows.map(([label, value]) => `<div style="padding:4px 0;font-size:14px;line-height:1.5;"><span style="color:#6b7280;">${escapeHtml(label)}</span><br><strong style="color:#111318;">${escapeHtml(value)}</strong></div>`).join("")}</td></tr></table>` : ""}
${button ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 6px;"><tr><td style="background:${BRAND_RED};border-radius:10px;"><a href="${escapeHtml(button.url)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(button.label)}</a></td></tr></table>
<p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">Button not working? Paste this link into your browser:<br><a href="${escapeHtml(button.url)}" style="color:#6b7280;word-break:break-all;">${escapeHtml(button.url)}</a></p>` : ""}
</td></tr>
${emailFooter(`${footer ?? "You are getting this because of activity on your BBDO West Africa account."}${optOutNote}`)}
</table></td></tr></table></body></html>`;

  const text = [
    heading,
    "",
    ...paragraphs,
    ...(detailRows.length ? ["", ...detailRows.map(([label, value]) => `${label}: ${value}`)] : []),
    ...(button ? ["", `${button.label}: ${button.url}`] : []),
    "",
    `${footer ?? "You are getting this because of activity on your BBDO West Africa account."}${optOutNote}`,
  ].join("\n");

  return { subject, html, text: `${text}\n\nBBDO West Africa\n${BBDO_ADDRESS}\n${BBDO_DISCLAIMER}`, layout };
}

function date(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

function money(amount: unknown, currency: unknown): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "";
  const code = currency === "USD" ? "USD" : "NGN";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(amount);
}

const builtinTemplates = {
  taskAssigned(input: { to: string | null; by: string | null; title: string; description: string; client: string | null; job: string | null; due: string | null; url: string }) {
    const subject = `New task: ${input.title}`;
    return render({
      preheader: `${input.by ?? "Someone"} assigned you a task.`,
      heading: "You have a new task",
      paragraphs: [`Hi ${firstName(input.to)}, ${input.by ?? "a teammate"} assigned you a task.`, ...(input.description ? [input.description.slice(0, 400)] : [])],
      details: [["Task", input.title], ["Client", input.client ?? ""], ["Job", input.job ?? ""], ["Due", date(input.due)]],
      button: { label: "Open task", url: input.url },
    }, subject);
  },

  documentSent(input: { to: string | null; by: string | null; title: string; url: string }) {
    return render({
      preheader: `${input.title} is ready for your signature.`,
      heading: "A document needs your signature",
      paragraphs: [`Hi ${firstName(input.to)}, ${input.by ?? "BBDO West Africa"} sent you "${input.title}" to read and sign.`],
      button: { label: "Review and sign", url: input.url },
    }, `Please sign: ${input.title}`);
  },

  documentSigned(input: { to: string | null; signer: string | null; title: string; signedAt: string | null; url: string }) {
    return render({
      preheader: `${input.signer ?? "The recipient"} signed ${input.title}.`,
      heading: "Document signed",
      paragraphs: [`Hi ${firstName(input.to)}, ${input.signer ?? "the recipient"} signed "${input.title}".`],
      details: [["Signed", date(input.signedAt)]],
      button: { label: "View document", url: input.url },
    }, `Signed: ${input.title}`);
  },

  appraisalAssigned(input: { to: string | null; by: string | null; period: string; message: string; url: string }) {
    return render({
      preheader: `Please complete your appraisal for ${input.period}.`,
      heading: "Your appraisal is ready to complete",
      paragraphs: [`Hi ${firstName(input.to)}, ${input.by ?? "your manager"} asked you to complete your appraisal.`, ...(input.message ? [input.message.slice(0, 400)] : [])],
      details: [["Review period", input.period]],
      button: { label: "Start appraisal", url: input.url },
    }, `Your appraisal for ${input.period}`);
  },

  appraisalSubmitted(input: { to: string | null; person: string | null; period: string; url: string }) {
    return render({
      preheader: `${input.person ?? "Someone"} submitted their appraisal.`,
      heading: "An appraisal was submitted",
      paragraphs: [`Hi ${firstName(input.to)}, ${input.person ?? "a team member"} completed their appraisal.`],
      details: [["Review period", input.period]],
      button: { label: "Read appraisal", url: input.url },
    }, `Appraisal submitted by ${input.person ?? "a team member"}`);
  },

  invoiceSent(input: { to: string | null; number: string; client: string; amount: number; currency: string; description: string; due: string | null; url: string }) {
    return render({
      preheader: `Invoice ${input.number} from BBDO West Africa.`,
      heading: `Invoice ${input.number}`,
      paragraphs: [`Hi ${firstName(input.to)}, a new invoice for ${input.client} is ready.`],
      details: [["Amount", money(input.amount, input.currency)], ["For", input.description], ["Due", date(input.due)]],
      button: { label: "View invoice", url: input.url },
    }, `Invoice ${input.number} from BBDO West Africa`);
  },

  paymentPaid(input: { to: string | null; amount: number; currency: string; description: string; job: string | null; url: string }) {
    return render({
      preheader: `${money(input.amount, input.currency)} was marked as paid.`,
      heading: "You have been paid",
      paragraphs: [`Hi ${firstName(input.to)}, a payment to you was marked as paid.`],
      details: [["Amount", money(input.amount, input.currency)], ["For", input.description], ["Job", input.job ?? ""]],
      button: { label: "View payments", url: input.url },
    }, `Payment sent: ${money(input.amount, input.currency)}`);
  },

  jobAssigned(input: { to: string | null; job: string; url: string }) {
    return render({
      preheader: `You were added to ${input.job}.`,
      heading: "You were added to a job",
      paragraphs: [`Hi ${firstName(input.to)}, you are now on the team for "${input.job}".`],
      button: { label: "Open job", url: input.url },
    }, `You were added to ${input.job}`);
  },

  applicationReceived(input: { to: string | null; applicant: string | null; job: string; url: string; details?: Array<[string, string]> }) {
    return render({
      preheader: `${input.applicant ?? "Someone"} applied to ${input.job}.`,
      heading: "New job application",
      paragraphs: [`Hi ${firstName(input.to)}, ${input.applicant ?? "a freelancer"} applied to "${input.job}".`],
      details: input.details,
      button: { label: "Review applicants", url: input.url },
    }, `New application: ${input.job}`);
  },

  messageReceived(input: { to: string | null; from: string | null; preview: string; url: string }) {
    const sender = input.from ?? "Someone";
    return render({
      preheader: `${sender} sent you a message.`,
      heading: `New message from ${sender}`,
      paragraphs: [
        `Hi ${firstName(input.to)}, ${sender} sent you a message on Bantaba.`,
        ...(input.preview ? [`“${input.preview.slice(0, 240)}”`] : []),
      ],
      button: { label: "Reply to message", url: input.url },
      footer: "You are getting this because someone sent you a direct message on Bantaba.",
    }, `New message from ${sender}`);
  },

  clientInvite(input: { to: string | null; by: string | null; company: string; url: string }) {
    return render({
      preheader: `${input.by ?? "Someone"} invited you to ${input.company}.`,
      heading: `Join ${input.company}`,
      paragraphs: [`Hi ${firstName(input.to)}, ${input.by ?? "a colleague"} invited you to join ${input.company} on BBDO West Africa. Create your account with this email address to get started.`],
      button: { label: "Create your account", url: input.url },
      footer: "You were invited by someone at your company.",
      optOut: false,
    }, `${input.by ?? "A colleague"} invited you to ${input.company}`);
  },

  staffInvite(input: { to: string | null; by: string | null; url: string }) {
    return render({ preheader: "You're invited to Bantaba", heading: "Join Bantaba", paragraphs: [`Hi ${firstName(input.to)}, ${input.by ?? "a teammate"} added you to Bantaba, BBDO West Africa's workspace.`, "Sign in with this email address to get started."], button: { label: "Sign in", url: input.url }, optOut: false }, "You're invited to Bantaba");
  },

  welcome(input: { to: string | null; url: string }) {
    return render({
      preheader: "Your account is ready.",
      heading: `Welcome, ${firstName(input.to)}`,
      paragraphs: ["Your account is ready. This is where you will find your jobs, tasks, time tracking and payments. Start by finishing your onboarding, which takes about five minutes."],
      button: { label: "Open your dashboard", url: input.url },
    }, "Welcome to BBDO West Africa");
  },

  test(input: { to: string | null }) {
    return render({
      preheader: "Email is working.",
      heading: "Email is working",
      paragraphs: [`Hi ${firstName(input.to)}, this is a test message. If you can read it, notifications from the dashboard will reach people.`],
    }, "Test email from the dashboard");
  },
};

type TemplateFunctions = typeof builtinTemplates;
export const templates = Object.fromEntries(Object.entries(builtinTemplates).map(([key, fn]) => [key, (input: Record<string, unknown>) => {
  const content = (fn as (input: unknown) => EmailContent)(input);
  const variables = Object.fromEntries(Object.entries(input).map(([name, value]) => [name, typeof value === "string" ? value : ""]));
  variables.to = firstName(input.to as string | null);
  variables.by ||= "a teammate";
  variables.signer ||= "the recipient";
  variables.person ||= "a team member";
  variables.from ||= "Someone";
  if (typeof input.amount === "number") variables.amount = money(input.amount, input.currency);
  return { ...content, templateKey: key, variables };
}])) as unknown as TemplateFunctions;

export function applySavedTemplate(content: EmailContent, saved: unknown): EmailContent {
  const base = TEMPLATE_DEFAULTS.find((item) => item.key === content.templateKey);
  if (!base || !content.layout || !content.variables || !validTemplate(saved, base) || !saved.published) return content;
  try {
    const subject = fillTemplate(saved.subject, content.variables).replace(/[\r\n]/g, " ").slice(0, 200);
    return render({ ...content.layout, heading: fillTemplate(saved.heading, content.variables), paragraphs: fillTemplate(saved.message, content.variables).split(/\n\s*\n/) }, subject);
  } catch { return content; }
}
