import { redirect } from "next/navigation";

export default function PitchWorkflowPage() {
  redirect("/dashboard/help?tab=workflows&view=pitch");
}
