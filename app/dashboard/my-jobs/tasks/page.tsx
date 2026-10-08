import type { Metadata } from "next";
import { JobsList } from "@/components/jobs-list";

export const metadata: Metadata = { title: "My Tasks" };

export default function MyTasksPage() {
  return <JobsList assignedOnly tab="tasks" />;
}
