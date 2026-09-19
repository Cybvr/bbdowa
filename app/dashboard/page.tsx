import { getBlogPosts, getCampaigns } from "@/lib/firebase/content";
import { DashboardWelcome } from "@/components/dashboard-welcome";
import { DashboardHomeCarousels } from "@/components/dashboard-home-carousels";
import { FirestoreCreatorCarousel } from "@/components/firestore-creators";

function dateValue(value: string | null | undefined): number {
  if (!value) return 0;
  const timestamp = Date.parse(value.length === 4 ? `${value}-01-01` : value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default async function HomePage() {
  const [campaigns, posts] = await Promise.all([getCampaigns(), getBlogPosts()]);
  const latestCampaigns = [...campaigns]
    .sort((a, b) => dateValue(b.liveAt?.date) - dateValue(a.liveAt?.date))
    .slice(0, 5);
  const latestNews = [...posts].sort((a, b) => dateValue(b.publishedAt) - dateValue(a.publishedAt)).slice(0, 5);

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <DashboardWelcome />
      <FirestoreCreatorCarousel />
      <DashboardHomeCarousels campaigns={latestCampaigns} posts={latestNews} />
    </main>
  );
}
