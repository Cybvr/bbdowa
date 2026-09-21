import type { ReactNode } from "react";
import { Badge } from "@/components/dashboard/ui";
import { formatDateTime, getContractUpdatedAt, type Contract } from "@/lib/contracts";

function MetadataItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</dt>
      <dd className="m-0 truncate text-[13px] font-medium leading-snug text-foreground">{children}</dd>
    </div>
  );
}

export function ContractStatusBadge({ status }: { status: Contract["status"] }) {
  return <Badge tone={status === "signed" ? "inverse" : "active"}>{status === "signed" ? "Signed" : "Awaiting signature"}</Badge>;
}

/** Operational record details kept separate from the contract document itself. */
export function ContractMetadata({ contract }: { contract: Contract }) {
  return (
    <section aria-label="Contract details" className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6">
      <dl className="grid grid-cols-6 gap-x-4 gap-y-4">
        <MetadataItem label="Created">{formatDateTime(contract.createdAt)}</MetadataItem>
        <MetadataItem label="Last modified">{formatDateTime(getContractUpdatedAt(contract))}</MetadataItem>
        <MetadataItem label="Sent to">{contract.assignedToName ?? "—"}</MetadataItem>
        <MetadataItem label="Drafted by">{contract.createdByName ?? "—"}</MetadataItem>
        <MetadataItem label="Signed">{contract.signedAt ? formatDateTime(contract.signedAt) : "Not signed"}</MetadataItem>
        <MetadataItem label="Signed by">{contract.signedName ?? "—"}</MetadataItem>
      </dl>
    </section>
  );
}

/** Title, status, and every record field stacked in one column — the sidebar for the contract detail page. */
export function ContractSidebarSummary({ contract }: { contract: Contract }) {
  return (
    <section aria-label="Agreement summary" className="space-y-5 rounded-xl border border-border bg-muted/20 p-5">
      <div className="space-y-3">
        <h1 className="m-0 text-[17px] font-bold leading-tight tracking-tight text-foreground">{contract.title}</h1>
        <ContractStatusBadge status={contract.status} />
      </div>

      <dl className="space-y-4">
        <MetadataItem label="Created">{formatDateTime(contract.createdAt)}</MetadataItem>
        <MetadataItem label="Last modified">{formatDateTime(getContractUpdatedAt(contract))}</MetadataItem>
        <MetadataItem label="Sent to">{contract.assignedToName ?? "—"}</MetadataItem>
        <MetadataItem label="Drafted by">{contract.createdByName ?? "—"}</MetadataItem>
        <MetadataItem label="Signed">{contract.signedAt ? formatDateTime(contract.signedAt) : "Not signed"}</MetadataItem>
        <MetadataItem label="Signed by">{contract.signedName ?? "—"}</MetadataItem>
      </dl>
    </section>
  );
}
