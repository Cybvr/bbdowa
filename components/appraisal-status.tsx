import { Badge } from "@/components/dashboard/ui";
import type { Appraisal } from "@/lib/appraisals";

export function AppraisalStatus({ status }: { status: Appraisal["status"] }) {
  if (status === "submitted") return <Badge tone="active">Submitted</Badge>;
  return <Badge tone="inverse">Assigned</Badge>;
}
