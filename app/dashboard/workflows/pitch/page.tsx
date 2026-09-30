import { redirect } from "next/navigation";

export default function PitchWorkflowPage() {
  redirect("/dashboard/workflows?tab=pitch");
}
