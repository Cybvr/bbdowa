"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, ExternalLink, Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { BlogMedia } from "@/components/blog-media";
import { ItemCard, ItemCardList } from "@/components/dashboard/item-card";
import { JobCard } from "@/components/job-card";
import { TaskStatusBadge } from "@/components/tasks-view";
import { getBlogMediaType, type BlogPost } from "@/lib/blog";
import { formatBlogDate } from "@/lib/blog-dates";
import { TASK_COLLECTION, formatDate as formatTaskDate, isOverdue, sortTasks, type Task } from "@/lib/creator-tasks";
import { readJobsFromFirestore, useFirestoreAppraisals, useFirestoreUsers } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import { readMyJobIds } from "@/lib/firebase/job-team";
import { byLastModified, type Job } from "@/lib/jobs";
import { ACTIVITY_COLLECTION, elapsedMs, formatClockFull, startOfWeek, type ActivityEntry } from "@/lib/time-tracking";
import type { User } from "@/lib/users";
import { appraisalNeedsCompletion } from "@/lib/appraisals";
import { readTasksAssignedTo } from "@/lib/firebase/task-queries";

const PROFILE_FIELDS = ["Availability", "Hours this week", "Title", "Location"] as const;
const TEAM_CHAT_URL = "https://teams.microsoft.com/l/team/19%3AFC6ZMVMFoEbe1WWMY555j6wfpeaN-olxhL1bmLmnkHg1%40thread.tacv2/conversations?groupId=863aed4a-20d5-4a27-a83b-38c7a6e0dedb&tenantId=6aa7a9a2-4b93-43c4-8311-ec14d3acf30c";

function availabilityLabel(user: User | undefined, loading: boolean): string {
  if (loading) return "Loading…";
  if (user?.availability === "open") return "Available";
  if (user?.availability === "busy") return "Busy";
  if (user?.availability === "unconfirmed") return "Unconfirmed";
  return "—";
}

function compactDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h${String(minutes).padStart(2, "0")}m` : `${minutes}m`;
}

export default function HomePage() {
  const { user, isAdmin, isViewingAs } = useAuth();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const { appraisals } = useFirestoreAppraisals();
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [blogUnavailable, setBlogUnavailable] = useState(false);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [hoursLoading, setHoursLoading] = useState(true);
  const [hoursUnavailable, setHoursUnavailable] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const jobsTrackRef = useRef<HTMLUListElement>(null);
  const [canScrollJobsLeft, setCanScrollJobsLeft] = useState(false);
  const [canScrollJobsRight, setCanScrollJobsRight] = useState(false);

  const loadMyTasks = useCallback(async () => {
    const uid = user?.uid;
    if (!uid) {
      setMyTasks([]);
      return;
    }
    setMyTasks(sortTasks(await readTasksAssignedTo(uid)).slice(0, 4));
  }, [user?.uid]);

  useEffect(() => {
    let active = true;
    setTasksLoading(true);
    loadMyTasks()
      .catch((cause) => console.error("Unable to load your tasks", cause))
      .finally(() => { if (active) setTasksLoading(false); });
    return () => { active = false; };
  }, [loadMyTasks]);

  useEffect(() => {
    let active = true;
    const uid = user?.uid;
    setJobsLoading(true);
    if (!uid) {
      setMyJobs([]);
      setJobsLoading(false);
      return () => { active = false; };
    }

    Promise.all([
      readMyJobIds(uid, user?.email),
      readJobsFromFirestore(),
    ])
      .then(([myJobIds, jobs]) => {
        if (!active) return;
        setMyJobs(jobs.filter((job) => myJobIds.has(job.slug)).sort(byLastModified).slice(0, 4));
      })
      .catch((cause) => {
        console.error("Unable to load your jobs", cause);
        if (active) setMyJobs([]);
      })
      .finally(() => { if (active) setJobsLoading(false); });

    return () => { active = false; };
  }, [user?.email, user?.uid]);

  useEffect(() => {
    let active = true;
    getDocs(collection(firebaseDb, "blogs"))
      .then((snapshot) => {
        if (active) setBlogPosts(snapshot.docs.map((post) => post.data() as BlogPost));
      })
      .catch((cause) => {
        console.error("Unable to load blog posts", cause);
        if (active) setBlogUnavailable(true);
      })
      .finally(() => { if (active) setBlogLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const uid = user?.uid;
    setHoursLoading(true);
    setHoursUnavailable(false);
    if (!uid) {
      setActivities([]);
      setHoursLoading(false);
      return () => { active = false; };
    }

    getDocs(query(collection(firebaseDb, ACTIVITY_COLLECTION), where("uid", "==", uid)))
      .then((snapshot) => {
        if (active) setActivities(snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<ActivityEntry, "id">) })));
      })
      .catch((cause) => {
        console.error("Unable to load your tracked hours", cause);
        if (active) setHoursUnavailable(true);
      })
      .finally(() => { if (active) setHoursLoading(false); });

    return () => { active = false; };
  }, [user?.uid]);

  useEffect(() => {
    if (!activities.some((entry) => !entry.endedAt && !entry.pausedAt)) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activities]);

  useEffect(() => {
    const track = jobsTrackRef.current;
    if (!track) return;
    const update = () => {
      setCanScrollJobsLeft(track.scrollLeft > 4);
      setCanScrollJobsRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [jobsLoading, myJobs.length]);

  const scrollJobs = (direction: -1 | 1) => {
    const track = jobsTrackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(300, track.clientWidth * 0.82), behavior: "smooth" });
  };

  const profile = users.find((candidate) => candidate.uid === user?.uid);
  const name = user?.name?.trim().split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "there";
  const weekStart = startOfWeek();
  const weeklyHours = activities
    .filter((entry) => Date.parse(entry.startedAt) >= weekStart)
    .reduce((total, entry) => total + elapsedMs(entry, now), 0);
  const todayIndex = (new Date().getDay() + 6) % 7;
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  activities.forEach((entry) => {
    const startedAt = Date.parse(entry.startedAt);
    if (startedAt < weekStart) return;
    dayTotals[(new Date(startedAt).getDay() + 6) % 7] += elapsedMs(entry, now);
  });
  const hoursKnown = !hoursLoading && !hoursUnavailable;
  const hoursEmpty = hoursKnown && weeklyHours < 1000;
  const weeklyWholeHours = Math.floor(weeklyHours / 3_600_000);
  const weeklyMinutes = Math.floor((weeklyHours % 3_600_000) / 60_000);
  const weeklyLabel = hoursLoading ? "…" : hoursUnavailable ? "—" : `${weeklyWholeHours}h ${String(weeklyMinutes).padStart(2, "0")}m`;
  const trackedDays = dayTotals.filter((total) => total > 0).length;
  const maxDay = Math.max(...dayTotals, 1);
  const facts = [
    { label: PROFILE_FIELDS[0], value: availabilityLabel(profile, usersLoading) },
    { label: PROFILE_FIELDS[1], value: hoursLoading ? "Loading…" : hoursUnavailable ? "Unavailable" : formatClockFull(weeklyHours), alert: hoursEmpty },
    { label: PROFILE_FIELDS[2], value: usersLoading ? "Loading…" : profile?.title || "—" },
    { label: PROFILE_FIELDS[3], value: usersLoading ? "Loading…" : profile?.location || "—" },
  ];
  const visibleBlogPosts = blogPosts
    .filter((post) => post.category === "Challenges")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 4);
  const blogHref = "/dashboard/blog?category=Challenges";
  const pendingAppraisal = appraisals.find((appraisal) => appraisal.assignedTo === user?.uid && appraisalNeedsCompletion(appraisal));

  return (
    <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
      <header className="border-b border-border pb-5">
        <h1 className="m-0 text-page-title font-bold leading-tight tracking-tight sm:text-page-title-lg">
          Welcome back, {name}<span aria-hidden="true"> 👋</span>
        </h1>
        <p className="mb-0 mt-2 text-body text-muted-foreground">Here’s what’s happening across the agency.</p>
      </header>

      {/* Anyone who skipped or hasn't finished onboarding gets a way back in. */}
      {profile && !profile.onboardingCompletedAt ? (
        <section aria-label="Finish onboarding" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted p-4">
          <div className="min-w-0">
            <h2 className="m-0 text-item-title font-semibold">{isViewingAs ? `${profile.name} hasn’t finished onboarding` : "Finish setting up your profile"}</h2>
            <p className="m-0 mt-1 text-sm text-muted-foreground">{isViewingAs ? (profile.onboardingStatus === "skipped" ? "They skipped it." : "They haven’t completed it yet.") : profile.onboardingStatus === "skipped" ? "You skipped onboarding. Pick up where you left off." : "A few quick steps so the team knows who you are."}</p>
          </div>
          {/* While viewing as someone, the button would start onboarding for the admin, so it's left out. */}
          {isViewingAs ? null : <Link href="/onboarding" className="inline-flex h-9 shrink-0 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground no-underline hover:opacity-90">
            Complete onboarding
          </Link>}
        </section>
      ) : null}

      {pendingAppraisal && !isViewingAs ? (
        <section aria-label="Appraisal to complete" className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-border py-4">
          <div className="min-w-0">
            <h2 className="m-0 text-item-title font-semibold">You have a self-appraisal to complete</h2>
            <p className="m-0 mt-1 text-sm text-muted-foreground">{pendingAppraisal.period || "Performance appraisal"} · Assigned by {pendingAppraisal.createdByName || "BBDO West Africa"}</p>
          </div>
          <Link href={`/dashboard/appraisals/${pendingAppraisal.id}`} className="inline-flex h-9 shrink-0 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground no-underline hover:opacity-90">
            Complete appraisal
          </Link>
        </section>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:gap-10">
        <div className="min-w-0 space-y-8">
        <section aria-labelledby="your-tasks-heading">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 id="your-tasks-heading" className="m-0 text-item-title font-semibold">Your tasks</h2>
            <Link href="/dashboard/work" className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">View all</Link>
          </div>
          {tasksLoading ? (
            <p className="py-5 text-sm text-muted-foreground">Loading your tasks…</p>
          ) : myTasks.length ? (
            <ItemCardList>
              {myTasks.map((task) => (
                <ItemCard
                  key={task.id}
                  href={`/dashboard/work/${encodeURIComponent(task.id)}`}
                  title={task.title}
                  subtitle={task.dueDate ? `Due ${formatTaskDate(task.dueDate)}` : undefined}
                  trailing={<TaskStatusBadge status={task.status} overdue={isOverdue(task)} />}
                />
              ))}
            </ItemCardList>
          ) : (
            <p className="py-5 text-sm text-muted-foreground">No tasks assigned yet.</p>
          )}
        </section>

        <section aria-labelledby="your-jobs-heading">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 id="your-jobs-heading" className="m-0 text-item-title font-semibold">Your jobs</h2>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/my-jobs" className="mr-1 shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">View all</Link>
              {myJobs.length > 1 ? <>
                <button type="button" aria-label="Previous jobs" onClick={() => scrollJobs(-1)} disabled={!canScrollJobsLeft} className="grid h-8 w-8 place-items-center rounded-full border border-border bg-background text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
                <button type="button" aria-label="Next jobs" onClick={() => scrollJobs(1)} disabled={!canScrollJobsRight} className="grid h-8 w-8 place-items-center rounded-full border border-border bg-background text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
              </> : null}
            </div>
          </div>
          {jobsLoading ? (
            <p className="py-5 text-sm text-muted-foreground">Loading your jobs…</p>
          ) : myJobs.length ? (
            <ul ref={jobsTrackRef} className="no-scrollbar -mx-5 m-0 flex snap-x snap-mandatory list-none gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
              {myJobs.map((job) => (
                <li key={job.slug} className="w-[88%] shrink-0 snap-start sm:w-[calc(50%_-_0.375rem)]"><JobCard job={job} myJobs /></li>
              ))}
            </ul>
          ) : (
            <p className="py-5 text-sm text-muted-foreground">No jobs assigned yet.</p>
          )}
        </section>

        <section aria-labelledby="digest-heading">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h2 id="digest-heading" className="m-0 text-item-title font-semibold">Digest</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={blogHref} className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">View all</Link>
              {isAdmin ? <Link href="/admin/blog/new" aria-label="New post" title="New post" className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><Plus aria-hidden="true" className="h-4 w-4" /></Link> : null}
            </div>
          </div>
          {blogLoading ? (
            <p className="py-5 text-sm text-muted-foreground">Loading Digest…</p>
          ) : blogUnavailable ? (
            <p className="py-5 text-sm text-muted-foreground">Digest is unavailable right now.</p>
          ) : visibleBlogPosts.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {visibleBlogPosts.map((post) => (
                <Link key={post.slug} href={`/dashboard/blog/${post.slug}`} className="block min-w-0 transition hover:opacity-80">
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
                    <BlogMedia
                      src={post.image}
                      type={getBlogMediaType(post)}
                      label={post.title}
                      className="h-full w-full"
                    />
                  </div>
                  <span className="mt-3 block text-[15px] font-semibold text-foreground">{post.title}</span>
                  <span className="mt-0.5 block text-[13px] text-muted-foreground">{post.category} · {formatBlogDate(post.publishedAt)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-5 text-sm text-muted-foreground">No challenge posts yet.</p>
          )}
        </section>
        </div>

        <aside aria-labelledby="profile-overview-heading" className="min-w-0 lg:col-start-2 lg:row-start-1 lg:border-l lg:border-border lg:pl-7">
          <Link href="/dashboard/tracker" aria-label={`Hours logged this week: ${weeklyLabel}. Open tracker`} className="mb-6 block rounded-2xl bg-card p-5 text-foreground shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:ring-1 dark:ring-border">
            <span className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Hours logged this week</span>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary">{trackedDays} {trackedDays === 1 ? "day" : "days"}</span>
            </span>
            <span className={`mt-1.5 flex items-baseline leading-none tracking-tight ${hoursEmpty ? "text-primary" : "text-foreground"}`}>
              {hoursKnown ? <>
                <span className="text-4xl font-bold tabular-nums">{weeklyWholeHours}</span>
                <span className="ml-0.5 text-xl font-semibold text-muted-foreground">h</span>
                <span className="ml-1.5 text-4xl font-bold tabular-nums">{String(weeklyMinutes).padStart(2, "0")}</span>
                <span className="ml-0.5 text-xl font-semibold text-muted-foreground">m</span>
              </> : <span className="text-4xl font-bold">{weeklyLabel}</span>}
            </span>
            <span className="mt-5 grid grid-cols-7 gap-1" aria-hidden="true">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => {
                const total = dayTotals[index];
                const isToday = index === todayIndex;
                const barHeight = total ? Math.max(14, Math.round((total / maxDay) * 76)) : 5;
                return (
                  <span key={index} className="flex min-w-0 flex-col items-center">
                    <span className="flex h-28 w-full flex-col items-center justify-end">
                      {total ? <span className={`mb-1.5 whitespace-nowrap text-[10px] font-semibold tabular-nums ${isToday ? "text-primary" : "text-muted-foreground"}`}>{compactDuration(total)}</span> : null}
                      <span className={`w-full max-w-9 ${total ? "rounded-lg" : "rounded-full"} ${isToday ? "bg-primary" : total ? "bg-primary/20 dark:bg-primary/35" : "bg-muted"}`} style={{ height: `${barHeight}px` }} />
                    </span>
                    <span className={`mt-2 text-xs ${isToday ? "font-bold text-foreground" : "text-muted-foreground"}`}>{day}</span>
                  </span>
                );
              })}
            </span>
          </Link>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 id="profile-overview-heading" className="m-0 text-item-title font-semibold">Your profile</h2>
            <Link href="/dashboard/me" className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Edit profile</Link>
          </div>
          <dl className="m-0 divide-y divide-border">
            {facts.map((fact) => (
              <div key={fact.label} className="flex min-h-12 items-center justify-between gap-4 py-3">
                <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                <dd className="m-0 flex min-w-0 items-center justify-end gap-1.5 truncate text-right text-sm font-medium text-foreground">
                  <span className={`truncate ${"alert" in fact && fact.alert ? "text-primary" : ""}`}>{fact.value}</span>
                  {fact.label === "Availability" && fact.value === "Busy" ? <span aria-hidden="true" className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500"><Check className="h-3 w-3 text-white" strokeWidth={3} /></span> : null}
                </dd>
              </div>
            ))}
          </dl>
          <a
            href={TEAM_CHAT_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-7 flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-foreground no-underline transition hover:border-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#4B53BC]">
              <img src="/icons/microsoft-teams.svg" alt="" aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Team chat</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Open the agency conversation in Teams</span>
            </span>
            <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
        </aside>
      </div>

    </main>
  );
}
