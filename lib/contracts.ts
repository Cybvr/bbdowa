// Creator agreements (NDAs and other contracts to sign).
//
// One document per agreement in the `contracts` collection. Admins and
// managers draft an agreement and assign it to a creator; the creator can
// only add their signature, never edit the agreement text. Admins and
// managers read and write every agreement; a creator reads and signs only
// agreements assigned to them.

export type ContractStatus = "pending" | "signed";

export type Contract = {
  id: string;
  title: string;
  /** Full agreement text, shown to the creator as-is. */
  body: string;
  /** Reusable document this contract was created from, when applicable. */
  documentId?: string | null;
  /** Firebase uid of the creator this agreement is assigned to. */
  assignedTo: string;
  assignedToName: string | null;
  /** Firebase uid of the admin/manager who drafted it. */
  createdBy: string;
  createdByName: string | null;
  status: ContractStatus;
  createdAt: string;
  /** Last time the contract record or document was changed. Legacy records may omit this. */
  updatedAt?: string | null;
  signedAt: string | null;
  /** Full name the creator typed to sign. */
  signedName: string | null;
};

export const CONTRACT_COLLECTION = "contracts";

/** Pending agreements first, most recent first within each group. */
export function sortContracts(contracts: Contract[]): Contract[] {
  return [...contracts].sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** "12 Oct 2026" from an ISO date or timestamp. */
export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** "12 Oct 2026, 14:35" for contract record timestamps. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getContractUpdatedAt(contract: Pick<Contract, "createdAt" | "updatedAt">): string {
  return contract.updatedAt ?? contract.createdAt;
}
