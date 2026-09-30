import type { Metadata } from "next";
import { TimeTracker } from "@/components/time-tracker";

export const metadata: Metadata = { title: "Tracker" };

export default function TrackerPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-2 sm:px-8">
      <TimeTracker />
    </main>
  );
}
