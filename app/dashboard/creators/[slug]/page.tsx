"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import { FaBehance, FaGlobe } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import { creatorCategoryOptions, isCreatorNew, isCreatorUser, type Creator } from "@/lib/users";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { longDate } from "@/lib/format";
import { MetaGrid, MetaItem, SectionHeading } from "@/components/dashboard/ui";
import { DetailBreadcrumb, DetailHeroBanner, DetailTabs } from "@/components/dashboard/detail-hero";
import { ClientWorkspaceContent, ClientWorkspaceHeading } from "@/components/client-workspace-heading";
import { SocialIcon, type SocialIconName } from "@/components/social-icon";
import { ShareCreatorDialog } from "@/components/share-creator-dialog";
import { UserActions } from "@/components/user-actions";
import { ProfilePageSkeleton } from "@/components/dashboard/loading-skeleton";

const HISTORY_ROW = "border-t border-border py-3";

type CreatorPlatform = { label: string; href: string; Icon?: IconType; brand?: SocialIconName };

function platformsFor(creator: Creator): CreatorPlatform[] {
  const platforms: CreatorPlatform[] = [];
  if (creator.portfolio) {
    const isBehance = creator.portfolio.toLowerCase().includes("behance.net");
    if (!isBehance) platforms.push({ label: "Website", href: creator.portfolio, Icon: FaGlobe });
    if (isBehance && !creator.behance) platforms.push({ label: "Behance", href: creator.portfolio, Icon: FaBehance });
  }
  if (creator.behance) platforms.push({ label: "Behance", href: creator.behance, Icon: FaBehance });
  if (creator.linkedin) platforms.push({ label: "LinkedIn", href: creator.linkedin, brand: "LinkedIn" });
  if (creator.instagram) platforms.push({ label: "Instagram", href: creator.instagram, brand: "Instagram" });
  return platforms;
}

type CreatorTab = "overview" | "work-history" | "contact";

export default function CreatorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { users, loading, error } = useFirestoreUsers();
  const creator = users.find((user) => user.slug === slug);
  const [tab, setTab] = useState<CreatorTab>("overview");

  if (loading) return <ProfilePageSkeleton />;
  if (error) return <main className="flex-1 px-5 pb-16 pt-8 sm:px-8 text-sm text-muted-foreground">{error}</main>;
  if (!creator || !isCreatorUser(creator)) {
    return <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">Creator not found.</main>;
  }
  const platforms = platformsFor(creator);

  const tabs: { id: CreatorTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "work-history", label: "Work history" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <DetailBreadcrumb
        crumbs={[{ label: "All creators", href: "/dashboard/creators" }, { label: creator.name }]}
        actions={
          <div className="flex items-center gap-2">
            <UserActions user={creator} variant="creator" listHref="/dashboard/creators" categoryOptions={creatorCategoryOptions(users)} />
            <ShareCreatorDialog creatorName={creator.name} path={`/dashboard/creators/${creator.slug}`} showLabel />
          </div>
        }
      />
      <DetailHeroBanner
        image={creator.featuredImage ?? creator.profileImage}
        alt={`${creator.name} featured work`}
        badgeImage={creator.profileImage}
        badgeAlt={creator.name}
      />
      <DetailTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <ClientWorkspaceContent>
          <ClientWorkspaceHeading
            title={creator.name}
            actions={
              <>
                {isCreatorNew(creator) ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">New</span> : null}
                <span className="text-[13px] font-medium text-muted-foreground">{creator.availability}</span>
              </>
            }
          />
          <div>
            <span className="block text-[13px] font-semibold text-primary">{creator.category}</span>
            <p className="mb-0 mt-2 max-w-[850px] text-[16px] leading-[1.45]">{creator.craftNote}</p>
          </div>

          <MetaGrid>
            <MetaItem label="Day rate estimate">{creator.dayRate}</MetaItem>
            <MetaItem label="Terms">{creator.terms}</MetaItem>
            <MetaItem label="Clearance">{creator.clearance === "cleared" ? "Cleared to engage" : "Sign-off pending"}</MetaItem>
            <MetaItem label="Location">{creator.location}</MetaItem>
            <MetaItem label="Engages as">{creator.entity}</MetaItem>
            <MetaItem label="Years active">{creator.yearsActive ?? "Not provided"}</MetaItem>
            <MetaItem label="Vouched by">{creator.vouchedBy}</MetaItem>
            <MetaItem label="Last engaged">{longDate(creator.lastEngaged)}</MetaItem>
            <MetaItem label="Added to directory">{longDate(creator.addedAt?.slice(0, 10))}</MetaItem>
            <MetaItem label="Engagements">{creator.workedOn.length ? creator.workedOn.join(", ") : "—"}</MetaItem>
          </MetaGrid>

          <section>
            <SectionHeading>Audience profile</SectionHeading>
            <p className="mb-4 mt-[-8px] max-w-[70ch] text-[13px] text-muted-foreground">
              Public profile details are shown only when verified or supplied.
            </p>
            <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
              <div className="border-b border-border py-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Follower count</span>
                <strong className="mt-1.5 block text-[16px] leading-tight">{creator.followerCount ?? "Not provided"}</strong>
                {creator.followerPlatform ? <span className="mt-1 block text-[12px] text-muted-foreground">{creator.followerPlatform}</span> : null}
              </div>
              <div className="border-b border-border py-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Gender</span>
                <strong className="mt-1.5 block text-[16px] leading-tight">{creator.gender ?? "Not provided"}</strong>
              </div>
              <div className="border-b border-border py-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Age</span>
                <strong className="mt-1.5 block text-[16px] leading-tight">{creator.age ?? "Not provided"}</strong>
              </div>
              <div className="border-b border-border py-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Niche</span>
                <strong className="mt-1.5 block text-[16px] leading-tight">{creator.niche ?? "Not provided"}</strong>
              </div>
            </div>
          </section>
        </ClientWorkspaceContent>
      )}

      {tab === "work-history" && (
        <ClientWorkspaceContent>
          <ClientWorkspaceHeading title="Work history" />
          {creator.workHistory?.length ? (
            <ul className="m-0 list-none p-0">
              {creator.workHistory.map((entry) => (
                <li key={`${entry.company}-${entry.role}-${entry.period}`} className={HISTORY_ROW}>
                  <div className="flex items-start justify-between gap-5 max-[560px]:flex-col max-[560px]:gap-1">
                    <div>
                      <strong className="block text-[16px] font-semibold leading-[1.15]">{entry.role}</strong>
                      <span className="mt-1 block text-[14px] text-muted-foreground">{entry.company}</span>
                    </div>
                    <span className="text-right text-[13px] font-medium text-muted-foreground max-[560px]:text-left">
                      {entry.period}
                      {entry.location ? <span className="block font-normal">{entry.location}</span> : null}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 border-t border-border py-3 text-[14px] text-muted-foreground">
              Public work history not yet confirmed.
            </p>
          )}
        </ClientWorkspaceContent>
      )}

      {tab === "contact" && (
        <ClientWorkspaceContent>
          <ClientWorkspaceHeading title="Contact" />
          <section>
            <SectionHeading>Tags</SectionHeading>
            <div className="flex flex-wrap gap-1.5">
              {creator.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-[12px] text-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </section>
          <section>
            <SectionHeading>Platforms</SectionHeading>
            {platforms.length ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {platforms.map(({ label, href, Icon, brand }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${creator.name} on ${label}`}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-foreground no-underline transition-colors hover:border-foreground hover:bg-muted focus-visible:outline-none"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background group-hover:bg-primary">
                        {brand ? <SocialIcon name={brand} className="h-5 w-5" /> : Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
                      </span>
                      <span>
                        <strong className="block text-[14px] font-semibold leading-none">{label}</strong>
                        <span className="mt-1 block text-[12px] text-muted-foreground">Open profile</span>
                      </span>
                    </span>
                    <FiArrowUpRight aria-hidden="true" className="h-4 w-4 flex-none text-muted-foreground group-hover:text-foreground" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="m-0 border-t border-border pt-3 text-[14px] text-muted-foreground">
                Public platform links not yet confirmed.
              </p>
            )}
          </section>
          <section>
            <SectionHeading>Contact</SectionHeading>
            <ul className="m-0 list-none p-0 text-[15px] leading-[1.35]">
              {creator.email ? (
                <li className="border-t border-border py-2.5">
                  <a href={`mailto:${creator.email}`} className="text-foreground hover:text-primary">
                    {creator.email}
                  </a>
                </li>
              ) : null}
              {creator.phone ? <li className="border-t border-border py-2.5">{creator.phone}</li> : null}
              {!creator.email && !creator.phone ? (
                <li className="border-t border-border py-2.5 text-muted-foreground">{creator.contactNote ?? "Public contact links not yet confirmed."}</li>
              ) : creator.contactNote ? (
                <li className="border-t border-border py-2.5 text-muted-foreground">{creator.contactNote}</li>
              ) : null}
            </ul>
          </section>
        </ClientWorkspaceContent>
      )}
    </main>
  );
}
