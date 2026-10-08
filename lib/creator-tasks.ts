// Creator tasks.
//
// One document per task in the `creatorTasks` collection. Staff can manage all
// task fields; assignees can edit work details while ownership remains fixed.

export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  title: string;
  description: string;
  /** Rich text instructions and supporting copy. Older tasks may not have this field. */
  content?: string;
  /** Optional client and job context for this task. */
  clientId?: string | null;
  clientName?: string | null;
  jobId?: string | null;
  jobName?: string | null;
  /** Firebase uid of the creator this task is assigned to. */
  assignedTo: string;
  assignedToName: string | null;
  /** Everyone the task is assigned to. `assignedTo` is the first of these. */
  assignees?: { uid: string; name: string }[];
  /** Just the uids of `assignees`, so tasks can be queried by person. */
  assigneeUids?: string[];
  /** Firebase uid of the admin/manager who assigned it. */
  createdBy: string;
  createdByName: string | null;
  status: TaskStatus;
  /** Enables editing through a task share link. */
  shareEnabled?: boolean;
  /** ISO date (yyyy-mm-dd), or null if there's no deadline. */
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export const TASK_COLLECTION = "creatorTasks";

export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

/** Open tasks first (oldest due date first), then done tasks, most recent first. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aOpen = a.status !== "done";
    const bOpen = b.status !== "done";
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    if (aOpen) {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function isOverdue(task: Task, now: number = Date.now()): boolean {
  if (!task.dueDate || task.status === "done") return false;
  return Date.parse(`${task.dueDate}T23:59:59`) < now;
}

/** "12 Oct 2026" from an ISO date or timestamp. */
export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export type TaskAssignee = { uid: string; name: string };

/** Everyone a task is assigned to, falling back to the single assignee on older tasks. */
export function taskAssignees(task: Pick<Task, "assignedTo" | "assignedToName" | "assignees">): TaskAssignee[] {
  if (task.assignees?.length) return task.assignees;
  return task.assignedTo ? [{ uid: task.assignedTo, name: task.assignedToName ?? "Assignee" }] : [];
}

export function isTaskAssignee(task: Pick<Task, "assignedTo" | "assignedToName" | "assignees">, uid: string | null | undefined): boolean {
  return Boolean(uid) && taskAssignees(task).some((person) => person.uid === uid);
}

/** "Ada, Tunde and Ife" for display. */
export function taskAssigneeNames(task: Pick<Task, "assignedTo" | "assignedToName" | "assignees">): string {
  const names = taskAssignees(task).map((person) => person.name).filter(Boolean);
  if (names.length < 2) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** The fields to store for a set of assignees. `assignedTo` stays the first person so older code keeps working. */
export function taskAssigneeFields(people: TaskAssignee[]) {
  return {
    assignedTo: people[0]?.uid ?? "",
    assignedToName: people[0]?.name ?? null,
    assignees: people,
    assigneeUids: people.map((person) => person.uid),
  };
}
