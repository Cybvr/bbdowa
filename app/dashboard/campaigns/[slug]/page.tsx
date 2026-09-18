import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAMPAIGNS, getCampaign } from "@/lib/campaigns";
import { getUser, userHref } from "@/lib/users";
import { BackLink } from "@/components/back-link";
import { Badge, ImageWithFallback, MetaGrid, MetaItem, SectionHeading } from "@/components/dashboard/ui";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CAMPAIGNS.map((campaign) => ({ slug: campaign.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign) return { title: "Campaign not found" };
  return { title: campaign.campaign ?? campaign.name, description: campaign.summary };
}

const SECTION = "border-b border-border py-6";
const BODY = "m-0 max-w-[70ch] text-[15px] leading-[1.55]";

export default async function CampaignDetailPage({ params }: Params) {
  const { slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign) notFound();

  const provisional = campaign.placeholder ? "text-muted-foreground" : "";
  const leadUser = campaign.leadUserId ? getUser(campaign.leadUserId) : undefined;

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <BackLink href="/dashboard/campaigns" className="mb-5">
        All campaigns
      </BackLink>

      <section
        className="grid grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)] items-start gap-8 lg:gap-12 max-[720px]:grid-cols-1"
        aria-labelledby="campaign-name"
      >
        <div className="relative aspect-[4/3] max-w-[440px] overflow-hidden rounded-xl bg-muted">
          <ImageWithFallback src={campaign.image} alt={campaign.imageAlt} className="block h-full w-full object-cover" />
        </div>
        <div>
          <Badge tone={campaign.status === "live" ? "active" : "neutral"}>{campaign.status}</Badge>
          <h1 id="campaign-name" className="m-0 mt-3 max-w-[20ch] text-[28px] font-bold leading-tight tracking-tight sm:text-[36px]">
            {campaign.campaign ?? campaign.name}
          </h1>
          <p className="mb-0 mt-3 max-w-[60ch] text-[16px] leading-[1.45] text-muted-foreground">
            {campaign.summary}
          </p>
          {campaign.externalLinks && campaign.externalLinks.length > 0 && (
            <nav className="mt-5" aria-label={`${campaign.campaign ?? campaign.name} online`}>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {campaign.externalLinks.map((externalLink) => (
                  <li key={externalLink.href}>
                    <a
                      href={externalLink.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:text-primary focus-visible:outline-none"
                    >
                      {externalLink.label}
                      <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </section>

      {campaign.media.length > 0 && (
        <section className="mt-10 border-t border-border pt-6" aria-labelledby="campaign-media">
          <SectionHeading
            id="campaign-media"
            action={
              <span className="text-[12px] text-muted-foreground">
                {campaign.media.length} {campaign.media.length === 1 ? "asset" : "assets"}
              </span>
            }
          >
            Campaign media
          </SectionHeading>
          <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
            {campaign.media.map((media) =>
              media.kind === "video" ? (
                <video
                  key={media.src}
                  className="block aspect-video h-full w-full rounded-xl bg-muted object-cover"
                  controls
                  preload="metadata"
                  poster={media.poster}
                  aria-label={media.alt}
                >
                  <source src={media.src} type="video/mp4" />
                  Your browser does not support this video.
                </video>
              ) : (
                <ImageWithFallback
                  key={media.src}
                  src={media.src}
                  alt={media.alt}
                  className="block aspect-video h-full w-full rounded-xl bg-muted object-cover"
                />
              ),
            )}
          </div>
        </section>
      )}

      <section className="mt-10" aria-label="Campaign information">
        <MetaGrid>
          <MetaItem label="Organization">
            <Link
              href={`/dashboard/clients/${campaign.organizationId}/overview`}
              className="text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary"
            >
              {campaign.organizationName}
            </Link>
          </MetaItem>
          <MetaItem label="Category">{campaign.category}</MetaItem>
          <MetaItem label="Campaign lead">
            <span className={campaign.leadUserId ? "" : "text-muted-foreground"}>
              {leadUser ? (
                <Link
                  href={userHref(leadUser)}
                  className="text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary"
                >
                  {leadUser.name}
                </Link>
              ) : (
                campaign.leadUserId ?? "To be confirmed"
              )}
            </span>
          </MetaItem>
          <MetaItem label="Fee">
            <span className={campaign.fee === "To be confirmed" ? "text-muted-foreground" : ""}>{campaign.fee}</span>
          </MetaItem>
          <MetaItem label="Target">
            <span className={campaign.target === "To be confirmed" ? "text-muted-foreground" : ""}>{campaign.target}</span>
          </MetaItem>
          <MetaItem label="Result so far">
            <span className={campaign.result === "To be confirmed" ? "text-muted-foreground" : ""}>{campaign.result}</span>
          </MetaItem>
        </MetaGrid>
      </section>

      <section className="mt-12" aria-label="Campaign case study">
        <article className={SECTION}>
          <SectionHeading>Challenge</SectionHeading>
          <p className={`${BODY} ${provisional}`}>{campaign.challenge}</p>
        </article>
        <article className={SECTION}>
          <SectionHeading>Insight</SectionHeading>
          <p className={`${BODY} ${provisional}`}>{campaign.insight}</p>
        </article>
        <article className={SECTION}>
          <SectionHeading>Strategy</SectionHeading>
          <p className={`${BODY} ${provisional}`}>{campaign.strategy}</p>
        </article>
        <article className={SECTION}>
          <SectionHeading>Platform</SectionHeading>
          <ul className="m-0 flex flex-wrap gap-2 p-0 list-none">
            {campaign.platform.map((channel) => (
              <li
                key={channel}
                className="rounded-md border border-border px-2.5 py-1 text-[13px] font-medium"
              >
                {channel}
              </li>
            ))}
          </ul>
        </article>
        <article className={SECTION}>
          <SectionHeading>Execution</SectionHeading>
          <p className={`${BODY} ${provisional}`}>{campaign.execution}</p>
        </article>
        <article className={`${SECTION} border-b-0`}>
          <SectionHeading>Outcome</SectionHeading>
          <p className={`${BODY} ${provisional}`}>{campaign.outcome}</p>
        </article>
      </section>
    </main>
  );
}
