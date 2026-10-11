import type { MessageAudience } from "@/lib/notifications";
import { buildMessageHtml } from "@/lib/message-html";

export type MessageTemplate = {
  key: string;
  label: string;
  description: string;
  subject: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  audience: MessageAudience;
  email: boolean;
  inApp: boolean;
  push: boolean;
};

/** Ready-to-edit messages for Admin → Send message. */
export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    key: "timesheet-reminder",
    label: "Timesheet reminder",
    description: "Ask the team to bring their time entries up to date.",
    subject: "Reminder: update your time entries",
    message: buildMessageHtml("Please make sure your time entries are complete and up to date. Check any running timers, add missing work and submit your latest entries.", "Open time tracker", "/dashboard/tracker"),
    actionLabel: "Open time tracker",
    actionHref: "/dashboard/tracker",
    audience: "team",
    email: true,
    inApp: true,
    push: true,
  },
  {
    key: "deadline-heads-up",
    label: "Deadline heads-up",
    description: "Give selected people an early warning about upcoming work.",
    subject: "Heads-up: an upcoming deadline needs your attention",
    message: buildMessageHtml("An upcoming deadline needs your attention. Please review your assigned work, confirm what is outstanding and flag anything that could affect delivery.", "Review my work", "/dashboard/work"),
    actionLabel: "Review my work",
    actionHref: "/dashboard/work",
    audience: "people",
    email: true,
    inApp: true,
    push: true,
  },
  {
    key: "task-follow-up",
    label: "Task follow-up",
    description: "Prompt selected people to review outstanding tasks.",
    subject: "Action needed on your outstanding tasks",
    message: buildMessageHtml("You have outstanding tasks that need an update. Please review them, update their status and add any information the team needs to keep the work moving.", "Review tasks", "/dashboard/work"),
    actionLabel: "Review tasks",
    actionHref: "/dashboard/work",
    audience: "people",
    email: true,
    inApp: true,
    push: true,
  },
  {
    key: "document-reminder",
    label: "Document reminder",
    description: "Remind selected people to review or sign a document.",
    subject: "Reminder: a document is waiting for you",
    message: buildMessageHtml("A document is still waiting for your review. Please open your documents, read it carefully and complete the requested action.", "Open documents", "/dashboard/documents"),
    actionLabel: "Open documents",
    actionHref: "/dashboard/documents",
    audience: "people",
    email: true,
    inApp: true,
    push: true,
  },
  {
    key: "job-update",
    label: "Job update",
    description: "Share a concise production or project update.",
    subject: "Job update",
    message: buildMessageHtml("There is a new update on an active job. Please open Bantaba for the latest information and review anything that affects your responsibilities or timing.", "Open my jobs", "/dashboard/my-jobs"),
    actionLabel: "Open my jobs",
    actionHref: "/dashboard/my-jobs",
    audience: "people",
    email: true,
    inApp: true,
    push: true,
  },
  {
    key: "payment-update",
    label: "Payment update",
    description: "Let selected people know that payment information changed.",
    subject: "Payment update",
    message: buildMessageHtml("There is an update to your payment information in Bantaba. Please review the payment record and contact the team if anything needs clarification.", "View payments", "/dashboard/payments"),
    actionLabel: "View payments",
    actionHref: "/dashboard/payments",
    audience: "people",
    email: true,
    inApp: true,
    push: true,
  },
  {
    key: "service-notice",
    label: "Service notice",
    description: "Tell everyone about access, maintenance or availability.",
    subject: "Bantaba service notice",
    message: buildMessageHtml("We have an important service update to share. Please read this notice and plan any time-sensitive work accordingly.", "Open Bantaba", "/dashboard"),
    actionLabel: "Open Bantaba",
    actionHref: "/dashboard",
    audience: "everyone",
    email: true,
    inApp: true,
    push: true,
  },
  {
    key: "general-announcement",
    label: "General announcement",
    description: "Start a clear all-company announcement.",
    subject: "An update from BBDO West Africa",
    message: buildMessageHtml("We have an update to share with everyone. Add the full details here before sending.", "Open Bantaba", "/dashboard"),
    actionLabel: "Open Bantaba",
    actionHref: "/dashboard",
    audience: "everyone",
    email: true,
    inApp: true,
    push: true,
  },
];
