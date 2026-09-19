import Link from "next/link";
import type { BlogPost } from "@/lib/blog";
import {
  campaignHref,
  campaignLiveDateLabel,
  campaignsDueFrom,
  campaignsLiveNow,
  campaignsWithTrackedTarget,
} from "@/lib/campaigns";
import type { Campaign } from "@/lib/campaigns";
import { getBlogPosts, getCampaigns, getUsers } from "@/lib/firebase/content";
import { PageHeader, SectionHeading, StatItem, StatRow, TextLink } from "@/components/dashboard/ui";
import { DashboardNotifications } from "@/components/dashboard-notifications";
import { CreatorCarousel } from "@/components/creator-carousel";
import { NAV_ICON_SET, type NavIconComponent } from "@/components/nav-icons";
import { isCreatorUser } from "@/lib/users";

type ActionTile = {
  label: string;
  href: string;
  description: string;
  Icon: NavIconComponent;
};

const ACTIONS: ActionTile[] = [
  { label: "Clients", href: "/dashboard/clients", description: "Client users and account workspaces", Icon: NAV_ICON_SET.People },
  { label: "Campaigns", href: "/dashboard/campaigns", description: "Live campaigns and targets", Icon: NAV_ICON_SET.Projects },
  { label: "Products", href: "/dashboard/products", description: "Client brands and lines", Icon: NAV_ICON_SET.Products },
  { label: "Workflows", href: "/dashboard/workflows/agency", description: "Agency and pitch playbooks", Icon: NAV_ICON_SET.Workflows },
  { label: "Assets", href: "/dashboard/brand", description: "Brand kit and resources", Icon: NAV_ICON_SET.Assets },
  { label: "Directory", href: "/dashboard/people", description: "Team and creators", Icon: NAV_ICON_SET.Directory },
  { label: "Updates", href: "/dashboard/blog", description: "Latest agency news", Icon: NAV_ICON_SET.Updates },
  { label: "Careers", href: "/dashboard/careers", description: "Open roles and referrals", Icon: NAV_ICON_SET.Careers },
  { label: "About", href: "/dashboard/about", description: "Who we are and how we work", Icon: NAV_ICON_SET.About },
];

export default async function HomePage() {
  const [posts, campaigns, users] = await Promise.all([getBlogPosts(), getCampaigns(), getUsers()]);
  const latestPosts = posts.slice(0, 5);
  const liveNow = campaignsLiveNow(campaigns);
  const dueSoon = campaignsDueFrom(campaigns, new Date());
  const trackedTargets = campaignsWithTrackedTarget(campaigns);
  const creators = users.filter(isCreatorUser);

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader
        title="Home"
        actions={<DashboardNotifications posts={latestPosts} />}
      />

      <section className="mt-8" aria-labelledby="wins-heading">
        <SectionHeading id="wins-heading">This month</SectionHeading>
        <StatRow>
          <StatItem
            label="Live now"
            value={liveNow.length}
            detail={liveNow.length > 0 ? liveNow.map((project) => project.name).join(", ") : "No campaigns are live yet"}
          />
          <StatItem
            label="Due next"
            value={dueSoon.length}
            detail={
              dueSoon.length > 0 ? (
                <ul className="m-0 list-none space-y-1 p-0">
                  {dueSoon.map((project) => (
                    <li key={project.slug}>
                      <Link
                        href={campaignHref(project.slug)}
                        className="text-foreground no-underline hover:text-primary focus-visible:text-primary"
                      >
                        {project.name}
                      </Link>{" "}
                      <span className="text-muted-foreground">{campaignLiveDateLabel(project)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                "Nothing scheduled yet"
              )
            }
          />
          <StatItem
            label="Targets tracked"
            value={`${trackedTargets.length}/${campaigns.length}`}
            detail={<TextLink href="/dashboard/campaigns">View campaigns</TextLink>}
          />
        </StatRow>
      </section>

      <section className="mt-10" aria-labelledby="jump-in-heading">
        <SectionHeading id="jump-in-heading">Jump in</SectionHeading>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
          {ACTIONS.map(({ label, href, description, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-2.5 rounded-xl border border-border bg-background p-4 text-foreground no-underline hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Icon className="h-6 w-6 shrink-0 text-muted-foreground group-hover:text-foreground" />
                <span className="text-[14px] font-semibold leading-none">{label}</span>
                <span className="text-[12px] leading-[1.35] text-muted-foreground">{description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <CreatorCarousel creators={creators} />
    </main>
  );
}
