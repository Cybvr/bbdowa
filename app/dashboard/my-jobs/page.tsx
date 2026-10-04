import type { Metadata } from "next";
import { JobsList } from "@/components/jobs-list";

export const metadata: Metadata = { title: "My Jobs" };

export default function MyJobsPage() {
  return <JobsList assignedOnly />;
}
