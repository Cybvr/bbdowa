// Creator tasks.
//
// One document per task in the `creatorTasks` collection. Admins and
// managers write a task and assign it to a creator; the assignee can move it
// through status but can't edit its content. Admins and managers read and
// write every task; a creator reads and updates only tasks assigned to them.

export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  title: string;
  description: string;
  /** Firebase uid of the creator this task is assigned to. */
  assignedTo: string;
  assignedToName: string | null;
  /** Firebase uid of the admin/manager who assigned it. */
  createdBy: string;
  createdByName: string | null;
  status: TaskStatus;
  /** ISO date (yyyy-mm-dd), or null if there's no deadline. */
  dueDate: string | null;
  /** Optional client this task belongs to (client slug + name). */
  clientId?: string | null;
  clientName?: string | null;
  /** Optional campaign this task belongs to (campaign slug + name). */
  campaignId?: string | null;
  campaignName?: string | null;
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
