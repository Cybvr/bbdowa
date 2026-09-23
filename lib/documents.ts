export const DOCUMENT_COLLECTION = "documents";

export type DocumentStatus = "draft" | "pending_signature" | "signed";

export type AgencyDocument = {
  id: string;
  title: string;
  body: string;
  status: DocumentStatus;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: string | null;
  assignedToName: string | null;
  signedAt: string | null;
  signedName: string | null;
  sourceDocumentId: string | null;
};

export function sortDocuments(documents: AgencyDocument[]): AgencyDocument[] {
  const order: Record<DocumentStatus, number> = { pending_signature: 0, draft: 1, signed: 2 };
  return [...documents].sort((a, b) => order[a.status] - order[b.status] || b.createdAt.localeCompare(a.createdAt));
}

export function formatDocumentDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatDocumentDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
