"use client";

import * as React from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { TaskDetailSheet, TaskStatusBadge } from "@/components/tasks-view";
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
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [sharedTask, setSharedTask] = React.useState<Task | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus | "all">("all");
  const [campaignId, setCampaignId] = React.useState("all");
  const [sort, setSort] = React.useState<"recent" | "due" | "title">("recent");
  const [view, setView] = React.useState<ViewMode>("table");

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

  React.useEffect(() => {
    const taskId = new URLSearchParams(window.location.search).get("task");
    if (taskId) setSelectedId(taskId);
  }, []);

  React.useEffect(() => {
    if (!selectedId || tasks.some((task) => task.id === selectedId) || sharedTask?.id === selectedId) return;
    let active = true;
    getDoc(doc(firebaseDb, TASK_COLLECTION, selectedId))
      .then((snapshot) => {
        if (active && snapshot.exists()) setSharedTask({ id: snapshot.id, ...(snapshot.data() as Omit<Task, "id">) });
      })
      .catch((cause) => console.error("Unable to open shared task", cause));
    return () => { active = false; };
  }, [selectedId, tasks, sharedTask?.id]);

  const selected = tasks.find((task) => task.id === selectedId) ?? (sharedTask?.id === selectedId ? sharedTask : null);
  const visible = tasks.filter((task) => {
    if (status !== "all" && task.status !== status) return false;
    if (campaignId !== "all" && task.campaignId !== campaignId) return false;
    return [task.title, task.description, task.content, task.assignedToName, task.clientName, task.campaignName].filter(Boolean).join(" ").toLowerCase().includes(search.trim().toLowerCase());
  }).sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "due") return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
  const campaignOptions = [
    { value: "all", label: "All campaigns" },
    ...[...new Map(tasks.filter((task) => task.campaignId && task.campaignName).map((task) => [task.campaignId!, task.campaignName!] as const))]
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
      filters={[{ label: "Campaign", value: campaignId, onChange: setCampaignId, options: campaignOptions }]}
      sortOptions={TASK_SORTS}
      activeSort={sort}
      onSortChange={setSort}
      resultCount={plural(visible.length, "task")}
      view={view}
      onViewChange={setView}
      className="my-4"
    />}>

      {view === "cards" ? (visible.length ? <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((task) => <li key={task.id}><DashboardCard className="h-full"><button type="button" onClick={() => setSelectedId(task.id)} className="flex min-h-40 w-full flex-col p-4 text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <span className="line-clamp-2 font-semibold leading-tight">{task.title}</span>
          <span className="mt-2 line-clamp-2 text-sm text-muted-foreground">{task.description || task.content?.replace(/<[^>]*>/g, " ").trim() || "No details added."}</span>
          <span className="mt-auto flex w-full items-center justify-between gap-2 pt-4 text-xs text-muted-foreground"><span className="truncate">{task.clientName}{task.campaignName ? ` · ${task.campaignName}` : ""}</span><TaskStatusBadge status={task.status} overdue={isOverdue(task)} /></span>
          {task.dueDate ? <span className="mt-1 text-xs text-muted-foreground">Due {formatDate(task.dueDate)}</span> : null}
        </button></DashboardCard></li>)}
      </ul> : <p className="py-12 text-center text-sm text-muted-foreground">{tasks.length ? "No tasks match." : "No tasks yet."}</p>) : visible.length ? (
        <section className="mt-4 overflow-x-auto">
          <Table className="w-full table-fixed border-collapse">
            <TableHeader><TableRow><TableHead className="px-4 py-3">Task</TableHead><TableHead className="w-32 px-4 py-3 text-right">Status</TableHead></TableRow></TableHeader>
            <TableBody>
          {visible.map((task) => (
            <ClickableTableRow key={task.id} label={`Open task ${task.title}`} onActivate={() => setSelectedId(task.id)} className="align-middle">
              <TableCell className="px-4 py-3">
                <button type="button" onClick={() => setSelectedId(task.id)} className="block max-w-full truncate text-left font-semibold text-foreground hover:text-primary">{task.title}</button>
                <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-[13px] text-muted-foreground">
                  {task.clientName ? <span className="truncate">{task.clientName}</span> : null}
                  {task.campaignName ? <span className="hidden truncate sm:inline">· {task.campaignName}</span> : null}
                  {task.dueDate ? <span className="shrink-0">Due {formatDate(task.dueDate)}</span> : null}
                  {!task.clientName && !task.campaignName && !task.dueDate ? <span className="truncate">{task.description || "No details added."}</span> : null}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 text-right"><TaskStatusBadge status={task.status} overdue={isOverdue(task)} /></TableCell>
            </ClickableTableRow>
          ))}
            </TableBody>
          </Table>
        </section>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">{tasks.length ? "No tasks match." : "No tasks yet."}</p>
      )}

      <TaskDetailSheet
        task={selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            const url = new URL(window.location.href);
            if (url.searchParams.has("task")) {
              url.searchParams.delete("task");
              window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
            }
          }
        }}
        canEdit={Boolean(selected) && Boolean(user?.uid) && selected?.assignedTo === user?.uid}
        canDelete={Boolean(selected) && selected?.assignedTo === user?.uid}
        onChanged={() => void load()}
      />
    </DashboardListPage>
  );
}

export default function TasksPage() {
  const { role, loading } = useAuth();
  if (loading) return <PageLoadingSkeleton titleWidth="w-32" />;
  return role === "admin" || role === "manager" ? <TasksManagementPage /> : <MyTasksPage />;
}
