"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Search } from "lucide-react";
import { LuMenu } from "react-icons/lu";
import { useAuth } from "@/components/auth-provider";
import { DashboardNotifications } from "@/components/dashboard-notifications";
import { DashboardLogo, DashboardSidebarContent, DashboardSidebarSheet } from "@/components/dashboard-sidebar";
import { ProfileNav } from "@/components/profile-nav";
import { TrackerIcon } from "@/components/nav-icons";
import { TimeTracker } from "@/components/time-tracker";
import { firebaseDb } from "@/lib/firebase/client";
import { ACTIVITY_COLLECTION, elapsedMs, formatClockFull, type ActivityEntry } from "@/lib/time-tracking";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function startOfWeek(): number {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset).getTime();
}

function WeeklyHours() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (authLoading || !user) {
      setEntries([]);
      return;
    }

    let active = true;
    getDocs(query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", user.uid)))
      .then((snapshot) => {
        if (!active) return;
        setEntries(snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<ActivityEntry, "id">) })));
      })
      .catch((error) => console.error("Unable to load weekly tracked hours", error));

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const weekStart = startOfWeek();
  const weeklyMs = entries
    .filter((entry) => Date.parse(entry.startedAt) >= weekStart)
    .reduce((total, entry) => total + elapsedMs(entry, now), 0);

  return (
    <span aria-label="Hours logged this week" className="font-mono text-[12px] font-semibold tabular-nums text-foreground">
      {authLoading ? "--:--:--" : formatClockFull(weeklyMs)}
    </span>
  );
}

export function DashboardHeader({
  hideMobile = false,
  sidebarCollapsed = false,
  onToggleSidebar,
}: {
  hideMobile?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}) {
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [desktopTrackerOpen, setDesktopTrackerOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        aria-label="Primary navigation"
        className={`hidden flex-col gap-2 overflow-y-auto rounded-2xl bg-background p-2.5 text-foreground transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] nav:fixed nav:inset-y-4 nav:left-4 nav:flex ${sidebarCollapsed ? "nav:w-[64px]" : "nav:w-[192px]"}`}
      >
        <DashboardSidebarContent
          collapsed={sidebarCollapsed}
          onToggleCollapse={onToggleSidebar}
          showCollapseToggle
        />
      </nav>

      {/* Desktop dashboard header */}
      <header
        className={`fixed right-0 top-0 z-30 hidden h-[60px] items-center gap-4 bg-background/95 px-6 backdrop-blur nav:flex ${
          sidebarCollapsed ? "nav:left-[80px]" : "nav:left-[208px]"
        }`}
      >
        <form role="search" className="flex min-w-0 items-center" onSubmit={(event) => event.preventDefault()}>
          <label className="relative block w-[min(220px,24vw)]">
            <Search aria-hidden="true" className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              aria-label="Search"
              className="h-9 w-full border-0 border-b border-border bg-transparent pl-7 pr-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-0"
            />
          </label>
        </form>
        <div className="ml-auto flex min-w-0 items-center gap-3">
          <DashboardNotifications posts={[]} />
          <Dialog open={desktopTrackerOpen} onOpenChange={setDesktopTrackerOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Open tracker"
                title="Hours logged this week — open tracker"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border-0 bg-transparent px-1.5 text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <WeeklyHours />
                <TrackerIcon aria-hidden="true" className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-x-hidden overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tracker</DialogTitle>
                <DialogDescription>Start a timer or log time from your phone.</DialogDescription>
              </DialogHeader>
              <TimeTracker compact />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Mobile top bar */}
      <div
        className={`${hideMobile ? "hidden" : "sticky top-0 z-40 flex"} items-center justify-between bg-primary px-[max(18px,env(safe-area-inset-left))] py-3 nav:hidden`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <DashboardSidebarSheet
            trigger={
              <button
                type="button"
                aria-label="Open dashboard menu"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary-foreground transition hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60"
              >
                <LuMenu aria-hidden="true" className="h-5 w-5" />
              </button>
            }
          />
          <DashboardLogo light />
        </div>
        <div className="flex items-center gap-1">
          <Dialog open={trackerOpen} onOpenChange={setTrackerOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Open tracker"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground transition hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60"
              >
                <TrackerIcon className="h-5 w-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-x-hidden overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tracker</DialogTitle>
                <DialogDescription>Start a timer or log time from your phone.</DialogDescription>
              </DialogHeader>
              <TimeTracker compact />
            </DialogContent>
          </Dialog>
          <ProfileNav variant="avatar" />
        </div>
      </div>
    </>
  );
}
