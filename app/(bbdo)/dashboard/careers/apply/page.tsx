import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";
import { WorkStyleForm } from "@/components/work-style-form";

export const metadata: Metadata = { title: "Apply" };

export default function CareersApplyPage() {
  return (
    <main className="flex-1 px-[clamp(24px,6vw,96px)] pb-[100px] pt-[clamp(30px,4vw,56px)]">
      <BackLink href="/dashboard/careers">Back to careers</BackLink>
      <WorkStyleForm />
    </main>
  );
}
