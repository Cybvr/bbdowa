import Link from "next/link";
import { PitchChecklist } from "@/components/pitch-checklist";
import { AgencyWorkflow } from "@/components/workflows/agency-workflow";

export const WORKFLOWS = [
  { key: "agency", label: "Agency" },
  { key: "pitch", label: "Pitch" },
] as const;

export function WorkflowsSection({ view }: { view?: string }) {
  const active = view === "pitch" ? "pitch" : "agency";
  return (
    <div>
      <div role="tablist" aria-label="Workflows" className="mb-6 flex gap-5 border-b border-border">
        {WORKFLOWS.map((item) => (
          <Link
            key={item.key}
            href={item.key === "pitch" ? "/dashboard/help?tab=workflows&view=pitch" : "/dashboard/help?tab=workflows"}
            role="tab"
            aria-selected={active === item.key}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold no-underline ${active === item.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {active === "pitch" ? <PitchChecklist /> : <AgencyWorkflow />}
    </div>
  );
}
