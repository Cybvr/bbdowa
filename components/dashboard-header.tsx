"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { DashboardNotifications } from "@/components/dashboard-notifications";
import { DashboardSidebarContent, DashboardSidebarSheet } from "@/components/dashboard-sidebar";
import { TrackerIcon } from "@/components/nav-icons";
import { createGlyphAvatarDataUri } from "@/lib/avatar";
import { TimeTracker } from "@/components/time-tracker";
import { useMobileHeader } from "@/components/dashboard/mobile-header";
import { firebaseDb } from "@/lib/firebase/client";
import { ACTIVITY_COLLECTION, elapsedMs, formatClockFull, type ActivityEntry } from "@/lib/time-tracking";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ADMIN_NAV_ITEMS, NAV_ITEMS, type NavItem } from "@/lib/nav";
import { campaignHref, type Campaign } from "@/lib/campaigns";
import { clientHref, type Client } from "@/lib/clients";
import { jobHref, type Job } from "@/lib/jobs";
import type { BlogPost } from "@/lib/blog";
import { isCreatorUser, normalizeUser, type User } from "@/lib/users";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SearchResult = {
  id: string;
  label: string;
  detail: string;
  href: string;
  keywords: string;
};

function navigationSearchResults(items: NavItem[], canViewAuthLinks: boolean): SearchResult[] {
  return items.flatMap((item) => {
    if (item.kind === "link") {
      return !item.requiresAuth || canViewAuthLinks
        ? [{ id: `nav-${item.href}`, label: item.label, detail: "Dashboard", href: item.href, keywords: item.label }]
        : [];
    }

    const results: SearchResult[] = [
      ...((!item.requiresAuth || canViewAuthLinks)
        ? [{ id: `nav-${item.label}`, label: item.label, detail: "Dashboard", href: Array.isArray(item.match) ? item.match[0] : item.match, keywords: item.label }]
        : []),
      ...item.items
        .filter((entry) => !entry.requiresAuth || canViewAuthLinks)
        .map((entry) => ({ id: `nav-${entry.href}`, label: entry.label, detail: item.label, href: entry.href, keywords: `${entry.label} ${item.label}` })),
    ];
    return results;
  });
}

function contentSearchResults(users: User[], clients: Client[], campaigns: Campaign[], posts: BlogPost[], jobs: Job[]): SearchResult[] {
  return [
    ...users.flatMap((user) => {
      if (!user.slug) return [];
      const creator = isCreatorUser(user);
      return [{
        id: `user-${user.uid ?? user.slug}`,
        label: user.name,
        detail: creator ? `Creator${user.category ? ` · ${user.category}` : ""}` : user.title || "Team",
        href: creator ? `/dashboard/creators/${user.slug}` : `/dashboard/people/${user.slug}`,
        keywords: [user.name, user.title, user.department, user.category, ...user.tags].filter(Boolean).join(" "),
      }];
    }),
    ...clients.map((client) => ({
      id: `client-${client.slug}`,
      label: client.name,
      detail: `Client${client.industry ? ` · ${client.industry}` : ""}`,
      href: clientHref(client.slug),
      keywords: [client.name, client.industry, client.description, client.targetAudience].filter(Boolean).join(" "),
    })),
    ...campaigns.map((campaign) => ({
      id: `campaign-${campaign.slug}`,
      label: campaign.campaign ?? campaign.name,
      detail: `Campaign${campaign.clientName ? ` · ${campaign.clientName}` : ""}`,
      href: campaignHref(campaign.slug),
      keywords: [campaign.name, campaign.campaign, campaign.clientName, campaign.category, campaign.summary].filter(Boolean).join(" "),
    })),
    ...posts.map((post) => ({
      id: `post-${post.slug}`,
      label: post.title,
      detail: `Update · ${post.category}`,
      href: `/dashboard/blog/${post.slug}`,
      keywords: [post.title, post.excerpt, post.category].filter(Boolean).join(" "),
    })),
    ...jobs.map((job) => ({
      id: `job-${job.slug}`,
      label: job.title,
      detail: `Career · ${job.department}`,
      href: jobHref(job.slug),
      keywords: [job.title, job.department, job.location, job.summary].filter(Boolean).join(" "),
    })),
  ];
}

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
  const { user, isViewingAs, viewAsUser, stopViewingAs } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [desktopTrackerOpen, setDesktopTrackerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [contentResults, setContentResults] = useState<SearchResult[]>([]);
  const [searchIndexLoaded, setSearchIndexLoaded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileHeader = useMobileHeader();
  const mobileTitle =
    mobileHeader?.title ??
    NAV_ITEMS.find((item): item is Extract<NavItem, { kind: "link" }> => item.kind === "link" && item.href === pathname)?.label ??
    null;

  const staticResults = useMemo(
    () => navigationSearchResults(pathname.startsWith("/admin") ? ADMIN_NAV_ITEMS : NAV_ITEMS, Boolean(user)),
    [pathname, user],
  );

  useEffect(() => {
    if (search.trim().length < 2 || searchIndexLoaded) return;
    let active = true;
    Promise.all([
      getDocs(collection(firebaseDb, "users")),
      getDocs(collection(firebaseDb, "clients")),
      getDocs(collection(firebaseDb, "campaigns")),
      getDocs(collection(firebaseDb, "blogs")),
      getDocs(collection(firebaseDb, "jobs")),
    ])
      .then(([usersSnapshot, clientsSnapshot, campaignsSnapshot, postsSnapshot, jobsSnapshot]) => {
        if (!active) return;
        const users = usersSnapshot.docs.map((document) => normalizeUser(document.data() as User));
        const clients = clientsSnapshot.docs.map((document) => document.data() as Client);
        const campaigns = campaignsSnapshot.docs.map((document) => document.data() as Campaign);
        const posts = postsSnapshot.docs.map((document) => document.data() as BlogPost);
        const jobs = jobsSnapshot.docs.map((document) => document.data() as Job);
        setContentResults(contentSearchResults(users, clients, campaigns, posts, jobs));
      })
      .catch((error) => console.error("Unable to load dashboard search index", error))
      .finally(() => {
        if (active) setSearchIndexLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [search, searchIndexLoaded]);

  useEffect(() => {
    if (!search) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSearch("");
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [search]);

  const searchResults = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    if (!queryText) return [];
    return [...staticResults, ...contentResults]
      .filter((result) => `${result.label} ${result.detail} ${result.keywords}`.toLowerCase().includes(queryText))
      .filter((result, index, results) => results.findIndex((candidate) => candidate.id === result.id) === index)
      .slice(0, 12);
  }, [contentResults, search, staticResults]);

  const goToSearchResult = (href: string) => {
    setSearch("");
    router.push(href);
  };

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
        <form role="search" className="flex min-w-0 items-center" onSubmit={(event) => { event.preventDefault(); if (searchResults[0]) goToSearchResult(searchResults[0].href); }}>
          <div ref={searchRef} className="relative w-[min(280px,30vw)]">
            <Command shouldFilter={false} className="overflow-visible bg-transparent" onKeyDown={(event) => { if (event.key === "Escape") setSearch(""); }}>
              <CommandInput value={search} onValueChange={setSearch} placeholder="Search" aria-label="Search dashboard" />
              {search.trim() ? (
                <CommandList className="absolute left-0 top-11 z-50 w-full rounded-xl border border-border bg-background p-1 shadow-xl">
                  {searchResults.length ? (
                    <CommandGroup heading="Results">
                      {searchResults.map((result) => (
                        <CommandItem key={result.id} value={result.id} onSelect={() => goToSearchResult(result.href)}>
                          <Search aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{result.label}</span>
                          <span className="max-w-[42%] truncate text-xs text-muted-foreground">{result.detail}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : (
                    <CommandEmpty>{searchIndexLoaded ? "No dashboard results." : "Searching…"}</CommandEmpty>
                  )}
                </CommandList>
              ) : null}
            </Command>
          </div>
        </form>
        <div className="ml-auto flex min-w-0 items-center gap-3">
          {isViewingAs ? (
            <button
              type="button"
              onClick={stopViewingAs}
              className="hidden max-w-[220px] truncate rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 nav:inline-flex"
              title="Exit view as mode"
            >
              Viewing as {viewAsUser?.name ?? viewAsUser?.email ?? "user"} · Exit
            </button>
          ) : null}
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
        className={`${hideMobile ? "hidden" : "sticky top-0 z-40 flex"} items-center justify-between bg-background px-[max(18px,env(safe-area-inset-left))] py-3 text-foreground nav:hidden`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <DashboardSidebarSheet
            trigger={
              <button
                type="button"
                aria-label="Open dashboard menu"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={createGlyphAvatarDataUri(user?.name ?? user?.email?.split("@")[0] ?? "BBDO User")}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            }
          />
          {mobileTitle ? (
            <h1 className="m-0 truncate text-[20px] font-bold leading-tight tracking-tight">{mobileTitle}</h1>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div ref={mobileHeader?.setSearchSlot} className="contents" />
          <div ref={mobileHeader?.setActionSlot} className="contents" />
          {isViewingAs ? (
            <button
              type="button"
              onClick={stopViewingAs}
              className="inline-flex h-9 max-w-[150px] items-center truncate rounded-lg border border-primary/30 bg-primary/5 px-2 text-[11px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              title="Exit view as mode"
            >
              Exit view
            </button>
          ) : null}
          <Dialog open={trackerOpen} onOpenChange={setTrackerOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Open tracker"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
        </div>
      </div>
    </>
  );
}
