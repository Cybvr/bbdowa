"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { TaskDetailPage } from "@/components/tasks-view";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import { TASK_COLLECTION, type Task } from "@/lib/creator-tasks";

export default function TaskPageClient({ taskId }: { taskId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, loading: authLoading } = useAuth();
  const { users } = useFirestoreUsers();
  const [task, setTask] = React.useState<Task | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const snapshot = await getDoc(doc(firebaseDb, TASK_COLLECTION, taskId));
    setTask(snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as Omit<Task, "id">) } : null);
  }, [taskId]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    getDoc(doc(firebaseDb, TASK_COLLECTION, taskId))
      .then((snapshot) => {
        if (active) setTask(snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as Omit<Task, "id">) } : null);
      })
      .catch((cause) => {
        console.error("Unable to load task", cause);
        if (active) setError("Couldn’t load this task. Try again later.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [taskId]);

  if (loading || authLoading) return <PageLoadingSkeleton titleWidth="w-48" />;
  if (error || !task) return <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-8 sm:px-8"><Link href="/dashboard/work" className="text-sm text-primary hover:underline">← Back to work</Link><h1 className="mt-8 text-page-title font-bold">{error ? "Task unavailable" : "Task not found"}</h1><p className="text-muted-foreground">{error || "This task may have been removed."}</p></main>;

  const isStaff = role === "admin" || role === "manager";
  const isAssignee = Boolean(user?.uid) && task.assignedTo === user?.uid;
  const sharedEdit = searchParams.get("shared") === "1" && task.shareEnabled === true;
  const assignees = isStaff
    ? users.filter((candidate) => candidate.uid).map((candidate) => ({ uid: candidate.uid!, name: candidate.name }))
    : undefined;

  return <TaskDetailPage
    task={task}
    canEdit={isStaff || isAssignee || sharedEdit}
    canDelete={isStaff || isAssignee}
    assignees={assignees}
    onChanged={() => void load()}
    onDeleted={() => router.push("/dashboard/work")}
  />;
}
