import { redirect } from "next/navigation";

export default function AgencyWorkflowPage() {
  redirect("/dashboard/help?tab=workflows");
}
