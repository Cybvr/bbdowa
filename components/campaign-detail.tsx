"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge, ImageWithFallback, SectionHeading } from "@/components/dashboard/ui";
import { DetailBreadcrumb, DetailHeroBanner, DetailTabs } from "@/components/dashboard/detail-hero";
import { ClientWorkspaceContent, ClientWorkspaceHeading } from "@/components/client-workspace-heading";
import { CampaignActions } from "@/components/campaign-actions";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { longDate } from "@/lib/format";
import { isCreatorUser, userHref } from "@/lib/users";
import type { Campaign } from "@/lib/campaigns";

const SECTION = "border-b border-border py-6";
const BODY = "m-0 max-w-[70ch] text-[15px] leading-[1.55]";

function updatedDate(iso: string | null | undefined): string {
  return longDate(iso?.slice(0, 10));
}

type CampaignTab = "overview" | "case-study" | "media";

export function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const { users } = useFirestoreUsers();
  const lead = users.find((user) => user.slug === campaign.leadUserId);
  const provisional = campaign.placeholder ? "text-muted-foreground" : "";
  const hasMedia = campaign.media.length > 0;
  const [tab, setTab] = useState<CampaignTab>("overview");
  const title = campaign.campaign ?? campaign.name;

  const tabs: { id: CampaignTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "case-study", label: "Case study" },
    ...(hasMedia ? [{ id: "media" as const, label: "Media" }] : []),
  ];

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <DetailBreadcrumb
        crumbs={[
          { label: "All campaigns", href: "/dashboard/campaigns" },
          { label: campaign.clientName, href: `/dashboard/clients/${campaign.clientId}/overview` },
          { label: title },
        ]}
        actions={<CampaignActions campaign={campaign} />}
      />
      <DetailHeroBanner image={campaign.image} alt={campaign.imageAlt} />
      <DetailTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <ClientWorkspaceContent>
          <ClientWorkspaceHeading title={title} />
          <div>
            <Badge tone={campaign.status === "live" ? "active" : "neutral"}>{campaign.status}</Badge>
            <p className="mb-0 mt-3 max-w-[70ch] text-[16px] leading-[1.45] text-muted-foreground">
              {campaign.summary}
            </p>
            {campaign.externalLinks && campaign.externalLinks.length > 0 && (
              <nav className="mt-5" aria-label={`${title} online`}>
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

          <section className="rounded-2xl border border-border bg-background p-5" aria-label="Campaign information">
            <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              <div className="space-y-1">
                <dt className="text-[10px] uppercase text-muted-foreground">Client</dt>
                <dd className="m-0 text-[13px] font-medium text-foreground">
                  <Link
                    href={`/dashboard/clients/${campaign.clientId}/overview`}
                    className="text-foreground underline decoration-border underline-offset-4 hover:text-primary"
                  >
                    {campaign.clientName}
                  </Link>
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] uppercase text-muted-foreground">Campaign lead</dt>
                <dd className="m-0 text-[13px] font-medium text-foreground">
                  {lead ? (
                    <Link
                      href={userHref(lead, isCreatorUser(lead) ? "creator" : "team")}
                      className="text-foreground underline decoration-border underline-offset-4 hover:text-primary"
                    >
                      {lead.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">To be confirmed</span>
                  )}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] uppercase text-muted-foreground">Category</dt>
                <dd className="m-0 text-[13px] font-medium text-foreground">{campaign.category}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] uppercase text-muted-foreground">Fee</dt>
                <dd className={`m-0 text-[13px] font-medium ${campaign.fee === "To be confirmed" ? "text-muted-foreground" : "text-foreground"}`}>{campaign.fee}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] uppercase text-muted-foreground">Target</dt>
                <dd className={`m-0 text-[13px] font-medium ${campaign.target === "To be confirmed" ? "text-muted-foreground" : "text-foreground"}`}>{campaign.target}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] uppercase text-muted-foreground">Result so far</dt>
                <dd className={`m-0 text-[13px] font-medium ${campaign.result === "To be confirmed" ? "text-muted-foreground" : "text-foreground"}`}>{campaign.result}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] uppercase text-muted-foreground">Date created</dt>
                <dd className="m-0 text-[13px] font-medium text-foreground">{updatedDate(campaign.createdAt)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-[10px] uppercase text-muted-foreground">Date modified</dt>
                <dd className="m-0 text-[13px] font-medium text-foreground">{updatedDate(campaign.updatedAt)}</dd>
              </div>
            </dl>
          </section>
        </ClientWorkspaceContent>
      )}

      {tab === "case-study" && (
        <ClientWorkspaceContent>
          <ClientWorkspaceHeading title="Case study" />
          <div>
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
                  <li key={channel} className="rounded-md border border-border px-2.5 py-1 text-[13px] font-medium">
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
          </div>
        </ClientWorkspaceContent>
      )}

      {tab === "media" && hasMedia && (
        <ClientWorkspaceContent>
          <ClientWorkspaceHeading title="Media" actions={<span className="text-[12px] text-muted-foreground">{campaign.media.length} {campaign.media.length === 1 ? "asset" : "assets"}</span>} />
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
        </ClientWorkspaceContent>
      )}
    </main>
  );
}
