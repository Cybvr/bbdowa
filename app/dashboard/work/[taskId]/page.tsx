import type { Metadata } from "next";
import { getTaskById } from "@/lib/firebase/content";
import TaskPageClient from "./task-page-client";

type TaskPageProps = { params: Promise<{ taskId: string }> };

export async function generateMetadata({ params }: TaskPageProps): Promise<Metadata> {
  const { taskId } = await params;
  try {
    const task = await getTaskById(taskId);
    if (task) return { title: task.title, description: task.description?.trim() || "View task details." };
  } catch (error) {
    console.error("Unable to load task metadata", error);
  }
  return { title: "Task", description: "View task details." };
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { taskId } = await params;
  return <TaskPageClient taskId={taskId} />;
}
