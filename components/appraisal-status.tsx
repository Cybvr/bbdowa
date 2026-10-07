import { Badge } from "@/components/dashboard/ui";
import type { Appraisal } from "@/lib/appraisals";

export function AppraisalStatus({ status }: { status: Appraisal["status"] }) {
  return <Badge tone={status === "shared" ? "inverse" : "active"}>{status === "shared" ? "Shared" : "Draft"}</Badge>;
}
