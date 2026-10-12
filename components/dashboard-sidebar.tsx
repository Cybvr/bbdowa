"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuMenu, LuPause, LuPlay, LuSquare } from "react-icons/lu";
import { ADMIN_NAV_ITEMS, NAV_ITEMS } from "@/lib/nav";
import { NAV_ICON_SET } from "@/components/nav-icons";
import { ProfileNav } from "@/components/profile-nav";
import { useOptionalAuth } from "@/components/auth-provider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { firebaseDb } from "@/lib/firebase/client";
import { ACTIVITY_COLLECTION, elapsedMs, formatClock, isPaused, runningEntry, type ActivityEntry } from "@/lib/time-tracking";
import { readAssignedJobs } from "@/lib/firebase/my-jobs";

export const NAV_TEXT =
  "flex min-h-10 w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-sans text-body font-normal leading-normal text-foreground no-underline transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground focus-visible:outline-none nav:min-h-9 nav:gap-1.5 nav:px-2 nav:py-1.5";

const NAV_LABEL = "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export const NAV_ACTIVE = "bg-muted !text-foreground hover:bg-muted";

function NavIcon({ label }: { label: string }) {
  const Icon = NAV_ICON_SET[label];
  if (!Icon) return <span aria-hidden="true" className="h-5 w-5 nav:h-4 nav:w-4" />;
  return <Icon className="h-5 w-5 nav:h-4 nav:w-4" />;
}

export function DashboardLogo({ onNavigate, light = false }: { onNavigate?: () => void; light?: boolean }) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      aria-label="BBDO West Africa dashboard"
      className="inline-flex min-w-0 w-fit"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bbdo-west-africa.png"
        alt="BBDO West Africa"
        className={`block h-auto w-[clamp(112px,10vw,138px)] max-w-full ${light ? "brightness-0 invert" : "brightness-0 dark:invert"}`}
      />
    </Link>
  );
}

export function DashboardNavList({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const auth = useOptionalAuth();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [running, setRunning] = useState<ActivityEntry | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [trackerBusy, setTrackerBusy] = useState(false);
  const [myJobsCount, setMyJobsCount] = useState<number | null>(null);
  const isAdminSection = pathname.startsWith("/admin");
  const navItems = isAdminSection ? ADMIN_NAV_ITEMS : NAV_ITEMS;
  const isStaff = auth?.role === "admin" || auth?.role === "manager";
  const visibleItems = navItems.filter(
    (item) =>
      (!item.requiresAuth || Boolean(auth?.user)) &&
      (item.kind !== "link" ||
        ((!item.requiresStaff || isStaff) && (!item.requiresAdmin || auth?.role === "admin") && !item.hideInSidebar)),
  );

  useEffect(() => {
    const uid = auth?.user?.uid;
    if (!uid || isAdminSection) {
      setMyJobsCount(null);
      return;
    }
    let active = true;
    readAssignedJobs(uid, auth?.user?.email)
      .then((jobs) => { if (active) setMyJobsCount(jobs.length); })
      .catch((error) => { console.error("Unable to load My Jobs count", error); if (active) setMyJobsCount(null); });
    return () => { active = false; };
  }, [auth?.user?.email, auth?.user?.uid, isAdminSection]);

  useEffect(() => {
    const uid = auth?.user?.uid;
    if (!uid) {
      setRunning(null);
      return;
    }

    return onSnapshot(
      query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", uid)),
      (snapshot) => {
        const entries = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<ActivityEntry, "id">),
        }));
        setRunning(runningEntry(entries));
      },
      (error) => console.error("Unable to load tracker status", error),
    );
  }, [auth?.user?.uid]);

  useEffect(() => {
    if (!running || isPaused(running)) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const togglePause = async () => {
    const uid = auth?.user?.uid;
    if (!uid || !running || trackerBusy) return;
    setTrackerBusy(true);
    try {
      if (isPaused(running) && running.pausedAt) {
        const pausedMs = (running.pausedMs ?? 0) + Math.max(0, Date.now() - Date.parse(running.pausedAt));
        await updateDoc(doc(firebaseDb, ACTIVITY_COLLECTION, running.id), { pausedAt: null, pausedMs, updatedAt: new Date().toISOString() });
      } else {
        await updateDoc(doc(firebaseDb, ACTIVITY_COLLECTION, running.id), { pausedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
    } catch (error) {
      console.error("Unable to update tracker status", error);
    } finally {
      setTrackerBusy(false);
    }
  };

  const stopRunning = async () => {
    const uid = auth?.user?.uid;
    if (!uid || !running || trackerBusy) return;
    setTrackerBusy(true);
    try {
      const endedAt = new Date();
      const pausedMs = (running.pausedMs ?? 0) + (running.pausedAt ? Math.max(0, endedAt.getTime() - Date.parse(running.pausedAt)) : 0);
      await updateDoc(doc(firebaseDb, ACTIVITY_COLLECTION, running.id), {
        endedAt: endedAt.toISOString(),
        pausedAt: null,
        pausedMs,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Unable to stop tracker", error);
    } finally {
      setTrackerBusy(false);
    }
  };

  useEffect(() => {
    const activeMenu = navItems.find(
      (item) =>
        item.kind === "menu" &&
        (Array.isArray(item.match)
          ? item.match.some((match) => pathname.startsWith(match))
          : pathname.startsWith(item.match)),
    );

    if (activeMenu?.kind === "menu") setOpenMenu(activeMenu.label);
  }, [pathname]);

  return (
    <ul className="m-0 flex list-none flex-col items-stretch gap-0 p-0 nav:gap-0.5">
      {visibleItems.map((item) => {
        if (item.kind === "link") {
          const current =
            pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

          if (item.label === "Tracker" && !collapsed && running) {
            return (
              <li key={item.label} className="w-full">
                <div className={`${NAV_TEXT} ${current ? NAV_ACTIVE : ""}`}>
                  <Link href={item.href} aria-current={current ? "page" : undefined} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2 no-underline">
                    <NavIcon label={item.label} />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-body">{item.label}</span>
                  </Link>
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-primary">{formatClock(elapsedMs(running, now))}</span>
                  <button type="button" aria-label={isPaused(running) ? "Resume timer" : "Pause timer"} title={isPaused(running) ? "Resume timer" : "Pause timer"} onClick={() => void togglePause()} disabled={trackerBusy} className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-wait disabled:opacity-50">
                    {isPaused(running) ? <LuPlay aria-hidden="true" className="h-3.5 w-3.5" /> : <LuPause aria-hidden="true" className="h-3.5 w-3.5" />}
                  </button>
                  <button type="button" aria-label="Stop timer" title="Stop timer" onClick={() => void stopRunning()} disabled={trackerBusy} className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-wait disabled:opacity-50">
                    <LuSquare aria-hidden="true" className="h-3 w-3" />
                  </button>
                </div>
              </li>
            );
          }

          return (
            <li key={item.label} className="w-full">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={`${NAV_TEXT} ${collapsed ? "justify-center px-0" : ""} ${current ? NAV_ACTIVE : ""}`}
              >
                <NavIcon label={item.label} />
                <span className={`${NAV_LABEL} ${collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}>
                  {item.label}
                </span>
                {item.label === "Tracker" && !collapsed && running ? (
                  <span className="ml-auto font-mono text-[11px] font-semibold tabular-nums text-primary">
                    {formatClock(elapsedMs(running, now))}
                  </span>
                ) : item.label === "My Jobs" && !collapsed && myJobsCount !== null ? (
                  <span className="ml-auto text-xs font-semibold tabular-nums text-muted-foreground">{myJobsCount}</span>
                ) : null}
              </Link>
            </li>
          );
        }

        const sectionActive = Array.isArray(item.match)
          ? item.match.some((match) => pathname.startsWith(match))
          : pathname.startsWith(item.match);
        const open = openMenu === item.label;

        return (
          <li key={item.label} className="w-full">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenMenu(open ? null : item.label)}
              title={collapsed ? item.label : undefined}
              className={`cursor-pointer border-0 text-left ${NAV_TEXT} ${collapsed ? "justify-center px-0" : ""} ${
                sectionActive ? NAV_ACTIVE : "bg-transparent"
              }`}
            >
              <NavIcon label={item.label} />
              <span className={`${NAV_LABEL} ${collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}>
                {item.label}
              </span>
              <LuChevronDown aria-hidden="true" className={`${collapsed ? "hidden" : "ml-auto"} h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <div
              aria-hidden={!open}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                open ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <ul className="m-0 mt-0.5 w-full list-none rounded-lg p-0.5 nav:mt-1 nav:p-1">
                  {item.items
                    .filter(
                      (entry) =>
                        (!entry.requiresAuth || Boolean(auth?.user)) &&
                        (!entry.requiresStaff || isStaff) &&
                        (!entry.requiresAdmin || auth?.role === "admin"),
                    )
                    .map((entry) => {
                      const current = pathname === entry.href;
                      return (
                        <li key={entry.href} className="block w-full">
                          <Link
                            href={entry.href}
                            aria-current={current ? "page" : undefined}
                            onClick={onNavigate}
                            tabIndex={open ? 0 : -1}
                            title={collapsed ? entry.label : undefined}
                            className={`${NAV_TEXT} ${collapsed ? "justify-center px-0" : "pl-7"} ${current ? NAV_ACTIVE : ""}`}
                          >
                            <NavIcon label={entry.label} />
                            <span className={`${NAV_LABEL} ${collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}>
                              {entry.label}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardNavFooter({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const auth = useOptionalAuth();
  const pathname = usePathname();
  const helpCurrent = pathname === "/dashboard/help";

  return (
    <div className="mt-auto flex flex-col gap-0.5 pt-2">
      <Link
        href="/dashboard/help"
        aria-current={helpCurrent ? "page" : undefined}
        onClick={onNavigate}
        title={collapsed ? "Help" : undefined}
        className={`${NAV_TEXT} ${collapsed ? "justify-center px-0" : ""} ${helpCurrent ? NAV_ACTIVE : ""}`}
      >
        <NavIcon label="Help" />
        <span className={`${NAV_LABEL} ${collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"}`}>Help</span>
      </Link>
      {auth?.user ? null : (
        <Link href="/auth/login" onClick={onNavigate} className={`${NAV_TEXT} ${collapsed ? "justify-center px-0" : ""}`}>
          <NavIcon label="My profile" />
          <span className={`${NAV_LABEL} ${collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"}`}>Sign in</span>
        </Link>
      )}
    </div>
  );
}

export function DashboardSidebarContent({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  showCollapseToggle = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
}) {
  return (
    <>
      <div className={`flex min-h-9 items-center gap-2 ${collapsed ? "justify-center" : "justify-between"}`}>
        <div
          className={`min-w-0 overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
          }`}
        >
          <DashboardLogo onNavigate={onNavigate} />
        </div>
        {showCollapseToggle && onToggleCollapse ? (
          <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapse}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {collapsed ? <LuChevronRight aria-hidden="true" className="h-4 w-4" /> : <LuChevronLeft aria-hidden="true" className="h-4 w-4" />}
          </button>
          </div>
        ) : null}
      </div>
      <SidebarProfileNav onNavigate={onNavigate} collapsed={collapsed} />
      <DashboardNavList onNavigate={onNavigate} collapsed={collapsed} />
      <DashboardNavFooter onNavigate={onNavigate} collapsed={collapsed} />
    </>
  );
}

function SidebarProfileNav({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed: boolean }) {
  const auth = useOptionalAuth();
  if (!auth?.user) return null;

  return (
    <div className={`w-full shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
      <ProfileNav
        variant={collapsed ? "avatar" : "row"}
        showRole
        showChevron={!collapsed}
        showAdminForStaff
        menuAlign="start"
        menuSide="bottom"
        items={[
          { label: "My profile", href: "/dashboard/me", icon: <NavIcon label="My profile" /> },
          { label: "Settings", href: "/dashboard/settings", icon: <NavIcon label="Settings" /> },
        ]}
        onLogout={() => {
          onNavigate?.();
          void auth.logout();
        }}
      />
    </div>
  );
}

export function DashboardSidebarSheet({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <button
            type="button"
            aria-label="Open navigation menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent text-foreground hover:bg-muted focus-visible:outline-none transition cursor-pointer"
          >
            <LuMenu className="h-5 w-5" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(264px,84vw)] gap-1 overflow-y-auto border-r border-border bg-background p-2 text-foreground shadow-2xl">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <DashboardSidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
