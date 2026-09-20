import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/ui";
import { TimeTracker } from "@/components/time-tracker";

export const metadata: Metadata = { title: "Tracker" };

export default function TrackerPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Tracker" />
      <TimeTracker />
    </main>
  );
}
