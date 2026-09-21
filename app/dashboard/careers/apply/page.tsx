import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";
import { WorkStyleForm } from "@/components/work-style-form";

export const metadata: Metadata = { title: "Apply" };

export default function CareersApplyPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
      <BackLink href="/dashboard/careers">Back to careers</BackLink>
      <WorkStyleForm />
    </main>
  );
}
