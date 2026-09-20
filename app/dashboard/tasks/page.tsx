import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/ui";
import { TasksView } from "@/components/tasks-view";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Tasks" description="Work admins and managers have assigned to you." />
      <TasksView />
    </main>
  );
}
