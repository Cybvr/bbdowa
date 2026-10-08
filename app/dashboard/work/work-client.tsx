"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { TaskStatusBadge } from "@/components/tasks-view";
import TasksManagementPage from "@/components/tasks-management-page";
import { DashboardListPage } from "@/components/dashboard/list-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { FilterBar, type FilterTab, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { DashboardCard } from "@/components/dashboard-card";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { firebaseDb } from "@/lib/firebase/client";
import { TASK_COLLECTION, formatDate, isOverdue, sortTasks, type Task, type TaskStatus, TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/creator-tasks";
import { plural } from "@/lib/format";
import { readTasksAssignedTo } from "@/lib/firebase/task-queries";

const TASK_STATUS_TABS: FilterTab<TaskStatus | "all">[] = [
  { key: "all", label: "All" },
  ...TASK_STATUSES.map((key) => ({ key, label: TASK_STATUS_LABELS[key] })),
];

const TASK_SORTS: SortOption<"recent" | "due" | "title">[] = [
  { key: "recent", label: "Most recent" },
  { key: "due", label: "Due date" },
  { key: "title", label: "Name (A–Z)" },
];

function MyTasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus | "all">("all");
  const [jobId, setJobId] = React.useState("all");
  const [sort, setSort] = React.useState<"recent" | "due" | "title">("recent");
  const [view, setView] = React.useState<ViewMode>("table");

  const load = React.useCallback(async () => {
    const uid = user?.uid;
    if (!uid) {
      setTasks([]);
      return;
    }
    setTasks(sortTasks(await readTasksAssignedTo(uid)));
  }, [user?.uid]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    load().catch((cause) => console.error("Unable to load tasks", cause)).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  const visible = tasks.filter((task) => {
    if (status !== "all" && task.status !== status) return false;
    if (jobId !== "all" && task.jobId !== jobId) return false;
    return [task.title, task.description, task.content, task.assignedToName, task.clientName, task.jobName].filter(Boolean).join(" ").toLowerCase().includes(search.trim().toLowerCase());
  }).sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "due") return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
  const jobOptions = [
    { value: "all", label: "All jobs" },
    ...[...new Map(tasks.filter((task) => task.jobId && task.jobName).map((task) => [task.jobId!, task.jobName!] as const))]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label })),
  ];

  if (loading) return <PageLoadingSkeleton titleWidth="w-32" />;

  return (
    <DashboardListPage title="Tasks" toolbar={<FilterBar
      panelId="tasks-filter"
      tabs={TASK_STATUS_TABS}
      activeTab={status}
      onTabChange={setStatus}
      tabsLabel="Status"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search tasks"
      filters={[{ label: "Job", value: jobId, onChange: setJobId, options: jobOptions }]}
      sortOptions={TASK_SORTS}
      activeSort={sort}
      onSortChange={setSort}
      resultCount={plural(visible.length, "task")}
      view={view}
      onViewChange={setView}
      className="my-4"
    />}>

      {view === "cards" ? (visible.length ? <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((task) => <li key={task.id}><DashboardCard className="h-full"><Link href={`/dashboard/work/${encodeURIComponent(task.id)}`} className="flex min-h-40 w-full flex-col p-4 text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <span className="self-start"><TaskStatusBadge status={task.status} overdue={isOverdue(task)} /></span>
          <span className="mt-4 line-clamp-1 font-semibold leading-tight">{task.clientName || task.jobName || "Task"}</span>
          <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.title}</span>
          <span className="mt-auto pt-4 text-xs text-muted-foreground">{task.createdAt ? `Created ${formatDate(task.createdAt)}` : ""}{task.dueDate ? `${task.createdAt ? " · " : ""}Due ${formatDate(task.dueDate)}` : ""}</span>
        </Link></DashboardCard></li>)}
      </ul> : <p className="py-12 text-center text-sm text-muted-foreground">{tasks.length ? "No tasks match." : "No tasks yet."}</p>) : visible.length ? (
        <section className="mt-4 overflow-x-auto">
          <Table className="w-full min-w-[620px] table-fixed border-collapse">
            <TableHeader><TableRow><TableHead className="px-4 py-3">Task</TableHead><TableHead className="w-28 px-4 py-3">Created</TableHead><TableHead className="w-28 px-4 py-3">Due</TableHead><TableHead className="w-32 px-4 py-3 text-right">Status</TableHead></TableRow></TableHeader>
            <TableBody>
          {visible.map((task) => (
            <ClickableTableRow key={task.id} label={`Open task ${task.title}`} onActivate={() => router.push(`/dashboard/work/${encodeURIComponent(task.id)}`)} className="align-middle">
              <TableCell className="px-4 py-3">
                <Link href={`/dashboard/work/${encodeURIComponent(task.id)}`} className="block max-w-full truncate text-left font-semibold text-foreground hover:text-primary">{task.title}</Link>
                <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-[13px] text-muted-foreground">
                  {task.clientName ? <span className="truncate">{task.clientName}</span> : null}
                  {task.jobName ? <span className="hidden truncate sm:inline">· {task.jobName}</span> : null}
                  {!task.clientName && !task.jobName ? <span className="truncate">{task.description || "No details added."}</span> : null}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{task.createdAt ? <time dateTime={task.createdAt}>{formatDate(task.createdAt)}</time> : "—"}</TableCell>
              <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{task.dueDate ? <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time> : "—"}</TableCell>
              <TableCell className="px-4 py-3 text-right"><TaskStatusBadge status={task.status} overdue={isOverdue(task)} /></TableCell>
            </ClickableTableRow>
          ))}
            </TableBody>
          </Table>
        </section>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">{tasks.length ? "No tasks match." : "No tasks yet."}</p>
      )}

    </DashboardListPage>
  );
}

export default function TasksPage() {
  const { role, loading } = useAuth();
  if (loading) return <PageLoadingSkeleton titleWidth="w-32" />;
  return role === "admin" || role === "manager" ? <TasksManagementPage /> : <MyTasksPage />;
}
