"use client";

/* eslint-disable @next/next/no-img-element */

import { collection, getDocs, query, where } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { CreatorAvatarStack } from "@/components/creator-avatar-stack";
import { DashboardCardActions } from "@/components/dashboard-card";
import { DashboardThumbnail } from "@/components/dashboard-thumbnail";
import { DashboardListRow, DashboardSection } from "@/components/dashboard/section-list";
import { CreatorCarousel } from "@/components/dashboard/creator-carousel";
import { ItemCard, ItemCardList } from "@/components/dashboard/item-card";
import { TaskDetailSheet, TaskStatusBadge } from "@/components/tasks-view";
import { CheckSquare } from "lucide-react";
import { TASK_COLLECTION, formatDate as formatTaskDate, isOverdue, sortTasks, type Task } from "@/lib/creator-tasks";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import type { BlogPost } from "@/lib/blog";
import type { Campaign } from "@/lib/campaigns";
import type { Client } from "@/lib/clients";
import type { Creator, User } from "@/lib/users";
import { creatorAddedTimestamp, isCreatorUser } from "@/lib/users";
import { campaignHref, campaignLiveDateLabel } from "@/lib/campaigns";
import { CreatorRailSkeleton, DashboardHomeSkeleton } from "@/components/dashboard/loading-skeleton";

async function readDashboardCollection<T>(name: string): Promise<T[]> {
  const snapshot = await getDocs(collection(firebaseDb, name));
  return snapshot.docs.map((document) => document.data() as T);
}

async function readDashboardContent(): Promise<{ campaigns: Campaign[]; clients: Client[]; posts: BlogPost[] }> {
  const [campaigns, clients, posts] = await Promise.all([
    readDashboardCollection<Campaign>("campaigns"),
    readDashboardCollection<Client>("clients"),
    readDashboardCollection<BlogPost>("blogs"),
  ]);

  return { campaigns, clients, posts };
}

function dateValue(value: string | null | undefined): number {
  if (!value) return 0;
  const timestamp = Date.parse(value.length === 4 ? `${value}-01-01` : value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!month) return String(year);

  return new Intl.DateTimeFormat("en-GB", {
    day: day ? "numeric" : undefined,
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day || 1)));
}

function campaignCreators(campaign: Campaign, clients: Client[], users: User[]): Creator[] {
  const client = clients.find((item) => item.slug === campaign.clientId);
  return (client?.creatorSlugs ?? [])
    .map((slug) => users.find((user) => user.slug === slug))
    .filter((creator): creator is Creator => Boolean(creator));
}

export default function HomePage() {
  const { user, role } = useAuth();
  const { users, loading: creatorsLoading, error: creatorsError } = useFirestoreUsers();
  const [content, setContent] = useState<{ campaigns: Campaign[]; clients: Client[]; posts: BlogPost[]; loading: boolean; error: string | null }>({
    campaigns: [],
    clients: [],
    posts: [],
    loading: true,
    error: null,
  });

  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const loadMyTasks = useCallback(async () => {
    const uid = user?.uid;
    if (!uid) {
      setMyTasks([]);
      return;
    }
    const snapshot = await getDocs(query(collection(firebaseDb, TASK_COLLECTION), where("assignedTo", "==", uid)));
    const rows = snapshot.docs.map((task) => ({ id: task.id, ...(task.data() as Omit<Task, "id">) }));
    setMyTasks(sortTasks(rows).slice(0, 4));
  }, [user?.uid]);

  useEffect(() => {
    void loadMyTasks().catch((cause) => console.error("Unable to load your tasks", cause));
  }, [loadMyTasks]);

  const selectedTask = myTasks.find((task) => task.id === selectedTaskId) ?? null;

  const reloadContent = async () => {
    const { campaigns, clients, posts } = await readDashboardContent();
    setContent({ campaigns, clients, posts, loading: false, error: null });
  };

  useEffect(() => {
    let active = true;

    readDashboardContent()
      .then(({ campaigns, clients, posts }) => {
        if (active) setContent({ campaigns, clients, posts, loading: false, error: null });
      })
      .catch((error) => {
        console.error("Unable to load dashboard content from Firestore", error);
        if (active) setContent((current) => ({ ...current, loading: false, error: "Unable to load dashboard content from Firestore." }));
      });

    return () => {
      active = false;
    };
  }, []);

  const name = user?.name?.trim().split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "there";
  const latestCreators = [...users]
    .filter(isCreatorUser)
    .filter((creator) => creator.addedAt)
    .sort((a, b) => creatorAddedTimestamp(b) - creatorAddedTimestamp(a))
    .slice(0, 6);
  const latestCampaigns = [...content.campaigns]
    .sort((a, b) => dateValue(b.liveAt?.date) - dateValue(a.liveAt?.date))
    .slice(0, 5);
  const latestNews = [...content.posts].sort((a, b) => dateValue(b.publishedAt) - dateValue(a.publishedAt)).slice(0, 5);

  return (
    <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
      <header className="border-b border-border pb-5">
        <h1 className="m-0 text-page-title font-bold leading-tight tracking-tight sm:text-page-title-lg">Welcome back, {name}.</h1>
        <p className="mb-0 mt-2 text-body text-muted-foreground">Here’s what’s happening across the agency.</p>
      </header>

      {myTasks.length ? (
        <section className="mt-6 max-w-3xl">
          <h2 className="m-0 mb-1 text-eyebrow font-semibold uppercase tracking-[0.08em] text-muted-foreground">Your tasks</h2>
          <ItemCardList>
            {myTasks.map((task) => (
              <ItemCard
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                icon={<CheckSquare className="h-5 w-5" aria-hidden="true" />}
                title={task.title}
                subtitle={task.dueDate ? `Due ${formatTaskDate(task.dueDate)}` : undefined}
                trailing={<TaskStatusBadge status={task.status} overdue={isOverdue(task)} />}
              />
            ))}
          </ItemCardList>
        </section>
      ) : null}

      <TaskDetailSheet
        task={selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTaskId(null); }}
        canEdit={Boolean(selectedTask)}
        canDelete={Boolean(selectedTask && ((role === "admin" || role === "manager") || selectedTask.assignedTo === user?.uid))}
        assignees={role === "admin" || role === "manager" ? users.flatMap((candidate) => candidate.uid ? [{ uid: candidate.uid, name: candidate.name }] : []) : undefined}
        onChanged={() => void loadMyTasks()}
      />

      {creatorsError ? <p className="mt-10 text-sm text-muted-foreground">{creatorsError}</p> : null}
      {creatorsLoading ? <CreatorRailSkeleton /> : null}
      {!creatorsLoading && latestCreators.length > 0 ? (
        <CreatorCarousel creators={latestCreators} />
      ) : null}

      {content.error ? <p className="mt-8 text-sm text-muted-foreground">{content.error}</p> : null}
      {content.loading ? <DashboardHomeSkeleton /> : null}
      {!content.loading && !content.error ? (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-5">
          <DashboardSection id="latest-campaigns-heading" title="Latest campaigns" href="/dashboard/campaigns">
            {latestCampaigns.map((campaign) => (
              <DashboardListRow
                key={campaign.slug}
                href={campaignHref(campaign.slug)}
                thumbnail={<DashboardThumbnail src={campaign.image} alt={campaign.imageAlt} className="h-full w-full" />}
                eyebrow={campaign.clientName}
                title={campaign.campaign ?? campaign.name}
                meta={
                  <div className="flex items-center gap-2">
                    <CreatorAvatarStack creators={campaignCreators(campaign, content.clients, users)} max={3} size="h-5 w-5" />
                    <span>{campaignLiveDateLabel(campaign)}</span>
                  </div>
                }
                actions={
                  <DashboardCardActions
                    collection="campaigns"
                    slug={campaign.slug}
                    titleField="campaign"
                    title={campaign.campaign ?? campaign.name}
                    onMutated={reloadContent}
                  />
                }
              />
            ))}
          </DashboardSection>

          <DashboardSection id="latest-news-heading" title="Latest news" href="/dashboard/blog">
            {latestNews.map((post) => (
              <DashboardListRow
                key={post.slug}
                href={`/dashboard/blog/${post.slug}`}
                thumbnail={<DashboardThumbnail src={post.image} label={post.category} className="h-full w-full" />}
                eyebrow={post.category}
                title={post.title}
                meta={formatDate(post.publishedAt)}
                actions={
                  <DashboardCardActions
                    collection="blogs"
                    slug={post.slug}
                    titleField="title"
                    title={post.title}
                    onMutated={reloadContent}
                  />
                }
              />
            ))}
          </DashboardSection>
        </div>
      ) : null}
    </main>
  );
}
