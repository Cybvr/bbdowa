import type { Metadata } from "next";
import { PitchChecklist } from "@/components/pitch-checklist";

export const metadata: Metadata = { title: "Pitch Workflow" };

export default function PitchWorkflowPage() {
  return (
    <div className="flex-1">
      <header className="flex min-h-[clamp(420px,62vh,720px)] items-center px-[clamp(24px,6vw,96px)] py-[clamp(64px,9vw,128px)]">
        <h1 className="m-0 max-w-[9ch] text-[clamp(64px,13vw,180px)] uppercase leading-[0.82] tracking-[-0.07em]">
          Pitch Workflow
        </h1>
      </header>
      <PitchChecklist />
    </div>
  );
}
