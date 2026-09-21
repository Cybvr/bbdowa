import type { Metadata } from "next";
import { PitchChecklist } from "@/components/pitch-checklist";
import { PageHeader } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Pitch Workflow" };

export default function PitchWorkflowPage() {
  return (
    <div className="flex-1 px-5 pt-4 sm:px-8">
      <PageHeader title="Pitch Workflow" />
      <PitchChecklist />
    </div>
  );
}
