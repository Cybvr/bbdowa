import { MESSAGE_TEMPLATES } from "../message-templates";
import type { MessageTemplate } from "../message-templates";
import { buildMessageHtml, messageHtmlToPlainText } from "../message-html";

export const TEMPLATE_COLLECTION = "messageTemplates";
export type SavedTemplate = MessageTemplate & { kind: "message" | "transactional"; heading: string; variables: string[]; published: boolean; updatedAt?: string };

const transactional = [
  ["taskAssigned", "Task assigned", "New task: {{title}}", "You have a new task", "Hi {{to}}, {{by}} assigned you a task.\n\n{{description}}", ["to", "by", "title", "description"]],
  ["documentSent", "Document sent", "Please sign: {{title}}", "A document needs your signature", "Hi {{to}}, {{by}} sent you \"{{title}}\" to read and sign.", ["to", "by", "title"]],
  ["documentSigned", "Document signed", "Signed: {{title}}", "Document signed", "Hi {{to}}, {{signer}} signed \"{{title}}\".", ["to", "signer", "title"]],
  ["appraisalAssigned", "Appraisal assigned", "Your appraisal for {{period}}", "Your appraisal is ready to complete", "Hi {{to}}, {{by}} asked you to complete your appraisal.\n\n{{message}}", ["to", "by", "period", "message"]],
  ["appraisalSubmitted", "Appraisal submitted", "Appraisal submitted by {{person}}", "An appraisal was submitted", "Hi {{to}}, {{person}} completed their appraisal.", ["to", "person", "period"]],
  ["invoiceSent", "Invoice sent", "Invoice {{number}} from BBDO West Africa", "Invoice {{number}}", "Hi {{to}}, a new invoice for {{client}} is ready.", ["to", "number", "client"]],
  ["paymentPaid", "Payment paid", "Payment sent: {{amount}}", "You have been paid", "Hi {{to}}, a payment to you was marked as paid.", ["to", "amount"]],
  ["jobAssigned", "Job assigned", "You were added to {{job}}", "You were added to a job", "Hi {{to}}, you are now on the team for \"{{job}}\".", ["to", "job"]],
  ["messageReceived", "Direct message", "New message from {{from}}", "New message from {{from}}", "Hi {{to}}, {{from}} sent you a message on Bantaba.\n\n{{preview}}", ["to", "from", "preview"]],
  ["clientInvite", "Client invitation", "{{by}} invited you to {{company}}", "Join {{company}}", "Hi {{to}}, {{by}} invited you to join {{company}} on BBDO West Africa. Create your account with this email address to get started.", ["to", "by", "company"]],
  ["staffInvite", "Staff invitation", "You're invited to Bantaba", "Join Bantaba", "Hi {{to}}, {{by}} added you to Bantaba, BBDO West Africa's workspace.\n\nSign in with this email address to get started.", ["to", "by"]],
  ["welcome", "Welcome", "Welcome to BBDO West Africa", "Welcome, {{to}}", "Your account is ready. This is where you will find your jobs, tasks, time tracking and payments. Start by finishing your onboarding, which takes about five minutes.", ["to"]],
  ["test", "Test email", "Test email from the dashboard", "Email is working", "Hi {{to}}, this is a test message. If you can read it, notifications from the dashboard will reach people.", ["to"]],
] as const;

export const TEMPLATE_DEFAULTS: SavedTemplate[] = [
  ...MESSAGE_TEMPLATES.map((template) => ({ ...template, kind: "message" as const, heading: template.subject, variables: [], published: true })),
  {
    key: "share-job",
    label: "Share job",
    description: "Email a job link to someone.",
    subject: "A job to share",
    message: buildMessageHtml("I thought this job might interest you. Please review the details at the link below.", "View job", "/dashboard/jobs"),
    actionLabel: "View job",
    actionHref: "/dashboard/jobs",
    audience: "people",
    email: true,
    inApp: false,
    push: false,
    kind: "message",
    heading: "A job to share",
    variables: [],
    published: true,
  },
  ...transactional.map(([key, label, subject, heading, message, variables]) => ({ key, label, subject, heading, message, variables: [...variables], kind: "transactional" as const, published: true, description: "Sent automatically when this event occurs. Record details and action links are added automatically.", audience: "people" as const, email: true, inApp: true, push: true })),
];

export function fillTemplate(value: string, variables: Record<string, string>) {
  return value.replace(/\{\{([^{}]+)\}\}/g, (_, key: string) => {
    if (!Object.hasOwn(variables, key)) throw new Error(`Unknown variable: ${key}`);
    return variables[key];
  });
}

export function validTemplate(value: unknown, base: SavedTemplate): value is SavedTemplate {
  if (!value || typeof value !== "object") return false;
  const row = value as SavedTemplate;
  if (row.key !== base.key || row.kind !== base.kind || typeof row.subject !== "string" || !row.subject.trim() || row.subject.length > 200 || typeof row.message !== "string" || !messageHtmlToPlainText(row.message) || row.message.length > 20000 || typeof row.heading !== "string" || row.heading.length > 200 || typeof row.label !== "string" || !row.label.trim() || row.label.length > 100 || typeof row.published !== "boolean" || !["everyone", "team", "people", "emails", "clients", "creators"].includes(row.audience) || [row.email, row.inApp, row.push].some((value) => typeof value !== "boolean")) return false;
  if (row.actionLabel !== undefined && (typeof row.actionLabel !== "string" || row.actionLabel.length > 80)) return false;
  if (row.actionHref !== undefined && (typeof row.actionHref !== "string" || row.actionHref.length > 500 || (row.actionHref && (!row.actionHref.startsWith("/") || row.actionHref.startsWith("//"))))) return false;
  if (Boolean(row.actionLabel?.trim()) !== Boolean(row.actionHref?.trim())) return false;
  try { const variables = Object.fromEntries(base.variables.map((key) => [key, "example"])); [row.subject, row.heading, row.message].forEach((text) => fillTemplate(text, variables)); return true; } catch { return false; }
}
