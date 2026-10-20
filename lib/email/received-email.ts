export type ReceivedEmailSummary = {
  id: string;
  from: string;
  to: string[];
  subject: string;
  preview?: string;
  createdAt: string;
  attachmentCount: number;
};

export type ReceivedEmailDetail = ReceivedEmailSummary & {
  body: string;
  cc: string[];
  replyTo: string[];
  attachments: { id: string; filename: string }[];
};
