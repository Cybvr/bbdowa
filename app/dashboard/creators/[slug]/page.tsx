"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { FaBehance, FaGlobe } from "react-icons/fa";
import { Mail } from "lucide-react";
import { creatorCategoryOptions, isCreatorNew, isCreatorUser, type Creator } from "@/lib/users";
import { useAuth } from "@/components/auth-provider";
import { readCampaignsFromFirestore, readClientsFromFirestore, useFirestoreUsers } from "@/lib/firebase/client-content";
import { longDate } from "@/lib/format";
import { campaignHref, type Campaign } from "@/lib/campaigns";
import { clientHref, getCreatorCampaigns, type Client } from "@/lib/clients";
import {
  DetailBreadcrumb,
  ProfileBanner,
  ProfileFact,
  ProfileFacts,
  ProfileIconLink,
  ProfileLayout,
  ProfileSection,
  ProfileTable,
} from "@/components/dashboard/detail-hero";
import { SocialIcon, type SocialIconName } from "@/components/social-icon";
import { ShareCreatorDialog } from "@/components/share-creator-dialog";
import { UserActions } from "@/components/user-actions";
import { ProfilePageSkeleton } from "@/components/dashboard/loading-skeleton";
import { CreatorContractsPanel } from "@/components/contracts-view";
import { CreatorHoursPanel } from "@/components/creator-hours-panel";

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

type CreatorTab = "overview" | "work-history" | "campaigns" | "hours" | "contracts";

export default function CreatorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user: authUser, role, isAdmin } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const directory = useFirestoreUsers();
  const [tab, setTab] = useState<CreatorTab>("overview");

  // Public collections — no auth needed, so every viewer can see this.
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  useEffect(() => {
    let active = true;
    Promise.all([readClientsFromFirestore(), readCampaignsFromFirestore()])
      .then(([clientsData, campaignsData]) => {
        if (!active) return;
        setClients(clientsData);
        setCampaigns(campaignsData);
      })
      .catch((cause) => console.error("Unable to load clients/campaigns", cause));
    return () => {
      active = false;
    };
  }, []);

  // The users directory is public so a published creator profile resolves for
  // every viewer. Staff status still controls the actions and staff-only tabs.
  const loading = directory.loading;
  const error = directory.error;
  const creator = directory.users.find((user) => user.slug === slug);
  const categorySource = directory.users;

  if (loading) return <ProfilePageSkeleton />;
  if (error) return <main className="flex-1 px-4 pb-10 pt-4 text-sm text-muted-foreground sm:px-8 sm:pb-16 sm:pt-4">{error}</main>;
  if (!creator || !isCreatorUser(creator)) {
    return <main className="flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">Creator not found.</main>;
  }
  const platforms = platformsFor(creator);
  const creatorCampaigns = getCreatorCampaigns(creator.slug, clients, campaigns);

  const tabs: { id: CreatorTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "work-history", label: "Work history" },
    { id: "campaigns", label: "Campaigns" },
    { id: "hours", label: "Hours" },
    { id: "contracts", label: "Contracts" },
  ];

  return (
    <main className="flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
      <DetailBreadcrumb
        crumbs={[{ label: "All creators", href: "/dashboard/creators" }, { label: creator.name }]}
        actions={
          <div className="flex items-center gap-2">
            <UserActions user={creator} variant="creator" listHref="/dashboard/creators" categoryOptions={creatorCategoryOptions(categorySource)} />
            <ShareCreatorDialog creatorName={creator.name} path={`/dashboard/creators/${creator.slug}`} showLabel />
          </div>
        }
      />

      <ProfileBanner
        avatarSrc={creator.profileImage}
        avatarAlt={creator.name}
        name={creator.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{creator.category}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{creator.availability}</span>
            {isCreatorNew(creator) ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">New</span>
            ) : null}
          </span>
        }
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
      />

      <ProfileLayout
        showSidebarOnMobile={tab === "overview"}
        sidebar={
          <>
            {(creator.email || creator.phone || platforms.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {creator.email ? (
                  <ProfileIconLink href={`mailto:${creator.email}`} label="Email">
                    <Mail aria-hidden="true" className="h-4 w-4" />
                  </ProfileIconLink>
                ) : null}
                {platforms.map(({ label, href, Icon, brand }) => (
                  <ProfileIconLink key={label} href={href} label={label}>
                    {brand ? <SocialIcon name={brand} className="h-4 w-4" /> : Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
                  </ProfileIconLink>
                ))}
              </div>
            )}

            <ProfileFacts>
              <ProfileFact label="Added" value={longDate(creator.addedAt?.slice(0, 10))} />
              <ProfileFact label="Category" value={creator.category || "—"} />
              <ProfileFact label="Engages as" value={creator.entity} />
              <ProfileFact label="Location" value={creator.location || "—"} />
              {creator.email ? (
                <ProfileFact label="Email" value={<a href={`mailto:${creator.email}`} className="hover:text-primary">{creator.email}</a>} />
              ) : null}
              {creator.phone ? <ProfileFact label="Phone" value={creator.phone} /> : null}
              {!creator.email && !creator.phone && creator.contactNote ? (
                <ProfileFact label="Contact" value={creator.contactNote} />
              ) : null}
            </ProfileFacts>

            {creator.tags?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {creator.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        }
      >
        {tab === "overview" && (
          <>
            {creator.craftNote ? (
              <ProfileSection title="Craft note" variant="plain">
                <p className="m-0 max-w-[850px] text-[15px] leading-[1.5]">{creator.craftNote}</p>
              </ProfileSection>
            ) : null}

            <ProfileSection title="Engagement" variant="plain">
              <div>
                <ProfileFact label="Availability" value={<span className="capitalize">{creator.availability}</span>} />
                <ProfileFact label="Day rate estimate" value={creator.dayRate || "—"} />
                <ProfileFact label="Terms" value={creator.terms || "—"} />
                <ProfileFact label="Engagements" value={creator.workedOn?.length ? creator.workedOn.join(", ") : "—"} />
              </div>
            </ProfileSection>

            <ProfileSection title="Audience profile" variant="plain">
              <div>
                <ProfileFact
                  label="Follower count"
                  value={creator.followerCount ? `${creator.followerCount}${creator.followerPlatform ? ` · ${creator.followerPlatform}` : ""}` : "Not provided"}
                />
                <ProfileFact label="Gender" value={creator.gender ?? "Not provided"} />
                <ProfileFact label="Age" value={creator.age ?? "Not provided"} />
                <ProfileFact label="Niche" value={creator.niche ?? "Not provided"} />
              </div>
            </ProfileSection>
          </>
        )}

        {tab === "work-history" && (
          <ProfileSection title="Work history" variant="plain">
            <ProfileTable
              columns={[
                { key: "period", label: "Period" },
                { key: "role", label: "Role" },
                { key: "company", label: "Company" },
                { key: "location", label: "Location" },
              ]}
              rows={(creator.workHistory ?? []).map((entry) => ({
                period: entry.period,
                role: <span className="font-semibold text-foreground">{entry.role}</span>,
                company: entry.company,
                location: entry.location ?? "—",
              }))}
              emptyTitle="No work history yet"
              emptyDescription={`${creator.name} hasn’t added any past roles yet.`}
            />
          </ProfileSection>
        )}

        {tab === "campaigns" && (
          <ProfileSection title="Campaigns" variant="plain">
            <ProfileTable
              columns={[
                { key: "campaign", label: "Campaign" },
                { key: "client", label: "Client" },
                { key: "status", label: "Status" },
              ]}
              rows={creatorCampaigns.map((campaign) => ({
                campaign: (
                  <Link href={campaignHref(campaign.slug)} className="font-semibold text-foreground hover:text-primary">
                    {campaign.campaign ?? campaign.name}
                  </Link>
                ),
                client: (
                  <Link href={clientHref(campaign.clientId)} className="text-foreground hover:text-primary">
                    {campaign.clientName}
                  </Link>
                ),
                status: <span className="capitalize">{campaign.status}</span>,
              }))}
              emptyTitle="No campaigns yet"
              emptyDescription={`${creator.name} hasn’t been added to a campaign yet.`}
            />
          </ProfileSection>
        )}

        {tab === "hours" && authUser && (
          <ProfileSection title="Hours logged" variant="plain">
            <CreatorHoursPanel creatorUid={creator.uid} creatorName={creator.name} />
          </ProfileSection>
        )}

        {tab === "contracts" && authUser && (
          <ProfileSection title="Contracts" variant="plain">
            <CreatorContractsPanel
              creatorUid={creator.uid}
              creatorSlug={creator.slug}
              creatorName={creator.name}
              viewer={{ uid: authUser.uid, name: authUser.name ?? authUser.email, isStaff, isAdmin }}
            />
          </ProfileSection>
        )}
      </ProfileLayout>
    </main>
  );
}
