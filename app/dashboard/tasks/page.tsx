"use client";

import * as React from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { CheckSquare } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/ui";
import { ItemCard, ItemCardList } from "@/components/dashboard/item-card";
import { TaskDetailSheet, TaskStatusBadge } from "@/components/tasks-view";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { firebaseDb } from "@/lib/firebase/client";
import { TASK_COLLECTION, formatDate, isOverdue, sortTasks, type Task, type TaskStatus, TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/creator-tasks";
import { plural } from "@/lib/format";
import { useFirestoreUsers } from "@/lib/firebase/client-content";

export default function TasksPage() {
  const { user, role } = useAuth();
  const { users } = useFirestoreUsers();
  const isStaff = role === "admin" || role === "manager";
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus | "all">("all");

  const load = React.useCallback(async () => {
    const uid = user?.uid;
    if (!uid) {
      setTasks([]);
      return;
    }
    const snapshot = await getDocs(query(collection(firebaseDb, TASK_COLLECTION), where("assignedTo", "==", uid)));
    setTasks(sortTasks(snapshot.docs.map((task) => ({ id: task.id, ...(task.data() as Omit<Task, "id">) }))));
  }, [user?.uid]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    load().catch((cause) => console.error("Unable to load tasks", cause)).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  const selected = tasks.find((task) => task.id === selectedId) ?? null;
  const visible = tasks.filter((task) => {
    if (status !== "all" && task.status !== status) return false;
    return [task.title, task.description, task.assignedToName, task.clientName, task.campaignName].filter(Boolean).join(" ").toLowerCase().includes(search.trim().toLowerCase());
  });

  if (loading) return <PageLoadingSkeleton titleWidth="w-32" />;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-2 sm:px-8">
      <PageHeader title="Tasks" description="Work assigned to you." />
      <FilterBar panelId="tasks-filter" search={search} onSearchChange={setSearch} searchPlaceholder="Search tasks" resultCount={plural(visible.length, "task")} />
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Task status filter">
        {(["all", ...TASK_STATUSES] as const).map((value) => (
          <button key={value} type="button" onClick={() => setStatus(value)} aria-pressed={status === value} className={`rounded-md border px-3 py-1.5 text-[13px] font-medium ${status === value ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"}`}>
            {value === "all" ? "All" : TASK_STATUS_LABELS[value]}
          </button>
        ))}
      </div>

      {visible.length ? (
        <ItemCardList>
          {visible.map((task) => (
            <ItemCard
              key={task.id}
              onClick={() => setSelectedId(task.id)}
              icon={<CheckSquare className="h-5 w-5" aria-hidden="true" />}
              title={task.title}
              subtitle={task.dueDate ? `Due ${formatDate(task.dueDate)}` : undefined}
              trailing={<TaskStatusBadge status={task.status} overdue={isOverdue(task)} />}
            />
          ))}
        </ItemCardList>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">{tasks.length ? "No tasks match." : "No tasks yet."}</p>
      )}

      <TaskDetailSheet
        task={selected}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        canEdit={Boolean(selected) && (isStaff || (Boolean(user?.uid) && selected?.assignedTo === user?.uid))}
        canDelete={Boolean(selected) && (isStaff || selected?.assignedTo === user?.uid)}
        assignees={isStaff ? users.flatMap((candidate) => candidate.uid ? [{ uid: candidate.uid, name: candidate.name }] : []) : undefined}
        onChanged={() => void load()}
      />
    </main>
  );
}
