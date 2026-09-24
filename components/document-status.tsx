import { Badge } from "@/components/dashboard/ui";
import type { AgencyDocument } from "@/lib/documents";

export function DocumentStatus({ status }: { status: AgencyDocument["status"] }) {
  const label = status === "draft" ? "Draft" : status === "signed" ? "Signed" : "Pending";
  return <Badge tone={status === "signed" ? "inverse" : "active"}>{label}</Badge>;
}
