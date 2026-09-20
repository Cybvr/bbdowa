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
  /** Firebase uid of the creator this agreement is assigned to. */
  assignedTo: string;
  assignedToName: string | null;
  /** Firebase uid of the admin/manager who drafted it. */
  createdBy: string;
  createdByName: string | null;
  status: ContractStatus;
  createdAt: string;
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
