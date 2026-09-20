"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { CreatorThumbnail } from "@/components/creator-thumbnail";
import { DashboardCard, DashboardCardActions } from "@/components/dashboard-card";
import { DashboardThumbnail } from "@/components/dashboard-thumbnail";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import type { BlogPost } from "@/lib/blog";
import type { Campaign } from "@/lib/campaigns";
import type { User } from "@/lib/users";
import { baseCity, creatorAddedTimestamp, creatorHref, isCreatorNew, isCreatorUser } from "@/lib/users";
import { campaignHref, campaignLiveDateLabel } from "@/lib/campaigns";
import { CreatorRailSkeleton, DashboardHomeSkeleton } from "@/components/dashboard/loading-skeleton";

async function readDashboardCollection<T>(name: string): Promise<T[]> {
  const snapshot = await getDocs(collection(firebaseDb, name));
  return snapshot.docs.map((document) => document.data() as T);
}

async function readDashboardContent(): Promise<{ campaigns: Campaign[]; posts: BlogPost[] }> {
  const [campaigns, posts] = await Promise.all([
    readDashboardCollection<Campaign>("campaigns"),
    readDashboardCollection<BlogPost>("blogs"),
  ]);

  return { campaigns, posts };
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

function moveRail(rail: HTMLDivElement | null, direction: number) {
  rail?.scrollBy({ left: direction * 280, behavior: "smooth" });
}

export default function HomePage() {
  const { user } = useAuth();
  const { users, loading: creatorsLoading, error: creatorsError } = useFirestoreUsers();
  const [content, setContent] = useState<{ campaigns: Campaign[]; posts: BlogPost[]; loading: boolean; error: string | null }>({
    campaigns: [],
    posts: [],
    loading: true,
    error: null,
  });
  const creatorsRail = useRef<HTMLDivElement>(null);
  const campaignsRail = useRef<HTMLDivElement>(null);
  const newsRail = useRef<HTMLDivElement>(null);

  const reloadContent = async () => {
    const { campaigns, posts } = await readDashboardContent();
    setContent({ campaigns, posts, loading: false, error: null });
  };

  useEffect(() => {
    let active = true;

    readDashboardContent()
      .then(({ campaigns, posts }) => {
        if (active) setContent({ campaigns, posts, loading: false, error: null });
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
    .slice(0, 8);
  const latestCampaigns = [...content.campaigns]
    .sort((a, b) => dateValue(b.liveAt?.date) - dateValue(a.liveAt?.date))
    .slice(0, 5);
  const latestNews = [...content.posts].sort((a, b) => dateValue(b.publishedAt) - dateValue(a.publishedAt)).slice(0, 5);
  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <header className="border-b border-border pb-5">
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">Welcome back, {name}.</h1>
        <p className="mb-0 mt-2 text-[14px] text-muted-foreground">Here’s what’s happening across the agency.</p>
      </header>

      {creatorsError ? <p className="mt-10 text-sm text-muted-foreground">{creatorsError}</p> : null}
      {creatorsLoading ? <CreatorRailSkeleton /> : null}
      {!creatorsLoading && latestCreators.length > 0 ? (
        <section className="mt-6" aria-labelledby="new-creators-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="new-creators-heading" className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">New creators</h2>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/creators" className="text-[12px] font-semibold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground focus-visible:text-foreground">View all</Link>
              <div className="flex items-center gap-1.5">
                <button type="button" aria-label="Previous creators" onClick={() => moveRail(creatorsRail.current, -1)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><ArrowLeft aria-hidden="true" className="h-4 w-4" /></button>
                <button type="button" aria-label="Next creators" onClick={() => moveRail(creatorsRail.current, 1)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
          <div ref={creatorsRail} className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
            {latestCreators.map((creator) => (
              <Link key={creator.slug} href={creatorHref(creator.slug)} className="group min-w-[240px] snap-start overflow-hidden rounded-xl border border-border bg-background text-foreground no-underline transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <CreatorThumbnail imageSrc={creator.profileImage} rounded={false} className="h-full w-full" imageClassName="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none" />
                  {isCreatorNew(creator) ? <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">New</span> : null}
                </div>
                <div className="p-4"><h3 className="m-0 truncate text-[15px] font-semibold tracking-tight">{creator.name}</h3><p className="mb-0 mt-1 truncate text-[12px] text-muted-foreground">{creator.niche ?? creator.category} · {baseCity(creator.location)}</p></div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {content.error ? <p className="mt-8 text-sm text-muted-foreground">{content.error}</p> : null}
      {content.loading ? <DashboardHomeSkeleton /> : null}
      {!content.loading && !content.error ? (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-5">
          <section className="min-w-0" aria-labelledby="latest-campaigns-heading">
            <div className="flex items-center justify-between gap-4">
              <h2 id="latest-campaigns-heading" className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Latest campaigns</h2>
              <div className="flex items-center gap-3"><Link href="/dashboard/campaigns" className="text-[12px] font-semibold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground focus-visible:text-foreground">View all</Link><div className="flex items-center gap-1.5"><button type="button" aria-label="Previous campaigns" onClick={() => moveRail(campaignsRail.current, -1)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><ArrowLeft aria-hidden="true" className="h-4 w-4" /></button><button type="button" aria-label="Next campaigns" onClick={() => moveRail(campaignsRail.current, 1)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><ArrowRight aria-hidden="true" className="h-4 w-4" /></button></div></div>
            </div>
            <div ref={campaignsRail} className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
              {latestCampaigns.map((campaign) => <DashboardCard key={campaign.slug} className="h-full min-w-[240px]" actions={<DashboardCardActions collection="campaigns" slug={campaign.slug} titleField="campaign" title={campaign.campaign ?? campaign.name} onMutated={reloadContent} />}><Link href={campaignHref(campaign.slug)} className="group flex h-full snap-start flex-col overflow-hidden text-foreground no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><DashboardThumbnail src={campaign.image} alt={campaign.imageAlt} className="h-28 w-full shrink-0" imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" /><div className="flex min-h-[164px] flex-col p-4"><span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{campaign.clientName}</span><strong className="mt-2 block line-clamp-3 text-[15px] font-semibold leading-[1.25]">{campaign.campaign ?? campaign.name}</strong><span className="mt-auto block pt-4 text-[12px] text-muted-foreground">{campaignLiveDateLabel(campaign)}</span></div></Link></DashboardCard>)}
            </div>
          </section>

          <section className="min-w-0" aria-labelledby="latest-news-heading">
            <div className="flex items-center justify-between gap-4">
              <h2 id="latest-news-heading" className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Latest news</h2>
              <div className="flex items-center gap-3"><Link href="/dashboard/blog" className="text-[12px] font-semibold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground focus-visible:text-foreground">View all</Link><div className="flex items-center gap-1.5"><button type="button" aria-label="Previous news" onClick={() => moveRail(newsRail.current, -1)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><ArrowLeft aria-hidden="true" className="h-4 w-4" /></button><button type="button" aria-label="Next news" onClick={() => moveRail(newsRail.current, 1)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><ArrowRight aria-hidden="true" className="h-4 w-4" /></button></div></div>
            </div>
            <div ref={newsRail} className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
              {latestNews.map((post) => <DashboardCard key={post.slug} className="h-full min-w-[240px]" actions={<DashboardCardActions collection="blogs" slug={post.slug} titleField="title" title={post.title} onMutated={reloadContent} />}><Link href={`/dashboard/blog/${post.slug}`} className="group flex h-full snap-start flex-col overflow-hidden text-foreground no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><DashboardThumbnail src={post.image} label={post.category} className="h-28 w-full shrink-0" imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" /><div className="flex min-h-[164px] flex-col p-4"><span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{post.category}</span><strong className="mt-2 block line-clamp-3 text-[15px] font-semibold leading-[1.25]">{post.title}</strong><span className="mt-auto block pt-4 text-[12px] text-muted-foreground">{formatDate(post.publishedAt)}</span></div></Link></DashboardCard>)}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
