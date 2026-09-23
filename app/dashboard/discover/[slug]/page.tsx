"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { FaBehance, FaGlobe } from "react-icons/fa";
import { creatorCategoryOptions, isCreatorNew, isCreatorUser, type Creator } from "@/lib/users";
import { useAuth } from "@/components/auth-provider";
import { readCampaignsFromFirestore, readClientsFromFirestore, readDocumentsForAssignee, readTimeEntriesForUser, useFirestoreUsers } from "@/lib/firebase/client-content";
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
import { MobileHeaderActions } from "@/components/dashboard/mobile-header";
import { CreatorDocumentAddAction, CreatorDocumentsPanel } from "@/components/creator-documents-panel";
import { CreatorHoursPanel } from "@/components/creator-hours-panel";
import { CreatorTasksPanel } from "@/components/tasks-view";

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

type CreatorTab = "overview" | "work-history" | "campaigns" | "hours" | "tasks" | "documents";

export default function CreatorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user: authUser, role, isAdmin } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const directory = useFirestoreUsers();
  const [tab, setTab] = useState<CreatorTab>("overview");

  // Public collections — no auth needed, so every viewer can see this.
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [hasHours, setHasHours] = useState(false);
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

  useEffect(() => {
    const assigneeKey = creator?.uid || creator?.slug;
    if (!assigneeKey) {
      setDocumentCount(0);
      setHasHours(false);
      return;
    }
    let active = true;
    Promise.all([
      readDocumentsForAssignee(creator?.uid, creator?.slug),
      authUser && creator?.uid ? readTimeEntriesForUser(creator.uid) : Promise.resolve([]),
    ])
      .then(([documentsData, timeEntries]) => {
        if (!active) return;
        setDocumentCount(documentsData.length);
        setHasHours(timeEntries.length > 0);
      })
      .catch((cause) => console.error("Unable to load creator activity", cause));
    return () => {
      active = false;
    };
  }, [authUser, creator?.slug, creator?.uid]);

  if (loading) return <ProfilePageSkeleton />;
  if (error) return <main className="flex-1 px-4 pb-10 pt-4 text-sm text-muted-foreground sm:px-8 sm:pb-16 sm:pt-4">{error}</main>;
  if (!creator || !isCreatorUser(creator)) {
    return <main className="flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">Creator not found.</main>;
  }
  const platforms = platformsFor(creator);
  const creatorCampaigns = getCreatorCampaigns(creator.slug, clients, campaigns);
  const isOwnProfile = Boolean(authUser?.uid && creator.uid && authUser.uid === creator.uid);
  const canSeeTasks = isStaff || isOwnProfile;

  const tabs: { id: CreatorTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    ...(creator.workHistory?.length ? ([{ id: "work-history", label: "Work history" }] as const) : []),
    ...(creatorCampaigns.length ? ([{ id: "campaigns", label: "Campaigns" }] as const) : []),
    ...(hasHours ? ([{ id: "hours", label: "Hours" }] as const) : []),
    ...(canSeeTasks ? ([{ id: "tasks", label: "Tasks" }] as const) : []),
    ...(documentCount > 0 || isStaff ? ([{ id: "documents", label: "Documents" }] as const) : []),
  ];

  return (
    <main className="flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
      <ProfileBanner
        avatarSrc={creator.profileImage}
        avatarAlt={creator.name}
        name={creator.name}
        breadcrumb={<DetailBreadcrumb crumbs={[{ label: "Discover", href: "/dashboard/discover" }, { label: creator.name }]} />}
        actions={
          <>
            {/* Desktop: actions sit in the banner. On phones there's no banner
             * hamburger anymore — the dashboard top bar is back, so edit and
             * share become its CTAs and the creator's name its title. */}
            <div className="hidden items-center gap-2 nav:flex">
              <UserActions user={creator} variant="creator" listHref="/dashboard/discover" categoryOptions={creatorCategoryOptions(categorySource)} iconOnly />
              <ShareCreatorDialog creatorName={creator.name} path={`/dashboard/discover/${creator.slug}`} />
            </div>
            <MobileHeaderActions>
              <UserActions user={creator} variant="creator" listHref="/dashboard/discover" categoryOptions={creatorCategoryOptions(categorySource)} iconOnly />
              <ShareCreatorDialog creatorName={creator.name} path={`/dashboard/discover/${creator.slug}`} />
            </MobileHeaderActions>
          </>
        }
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
        socials={
          platforms.length ? (
            <>
              {platforms.map(({ label, href, Icon, brand }) => (
                <ProfileIconLink key={label} href={href} label={label}>
                  {brand ? <SocialIcon name={brand} className="h-4 w-4" /> : Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
                </ProfileIconLink>
              ))}
            </>
          ) : null
        }
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
      />

      <ProfileLayout
        showSidebarOnMobile={tab === "overview"}
        sidebar={
          <>
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
              <ProfileSection title="About" variant="plain">
                <p className="m-0 max-w-[850px] text-[15px] leading-[1.5]">{creator.craftNote}</p>
              </ProfileSection>
            ) : null}

            {creator.availability || creator.dayRate || creator.terms || creator.workedOn?.length || creator.referralSource ? (
              <ProfileSection title="Engagement" variant="plain">
                <div>
                  {creator.availability ? <ProfileFact label="Availability" value={<span className="capitalize">{creator.availability}</span>} /> : null}
                  {creator.dayRate ? <ProfileFact label="Day rate estimate" value={creator.dayRate} /> : null}
                  {creator.terms ? <ProfileFact label="Terms" value={creator.terms} /> : null}
                  {creator.workedOn?.length ? <ProfileFact label="Engagements" value={creator.workedOn.join(", ")} /> : null}
                  {creator.referralSource ? <ProfileFact label="Referral source" value={creator.referralSource} /> : null}
                </div>
              </ProfileSection>
            ) : null}

            {creator.followerCount || creator.gender || creator.age != null || creator.niche ? (
              <ProfileSection title="Audience profile" variant="plain">
                <div>
                  {creator.followerCount ? (
                    <ProfileFact label="Follower count" value={`${creator.followerCount}${creator.followerPlatform ? ` · ${creator.followerPlatform}` : ""}`} />
                  ) : null}
                  {creator.gender ? <ProfileFact label="Gender" value={creator.gender} /> : null}
                  {creator.age != null ? <ProfileFact label="Age" value={creator.age} /> : null}
                  {creator.niche ? <ProfileFact label="Niche" value={creator.niche} /> : null}
                </div>
              </ProfileSection>
            ) : null}
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

        {tab === "tasks" && canSeeTasks && (
          <ProfileSection title="Tasks" variant="plain">
            <CreatorTasksPanel
              creatorUid={creator.uid}
              creatorName={creator.name}
              viewer={{ uid: authUser?.uid ?? "", name: authUser?.name ?? authUser?.email ?? null, isStaff }}
            />
          </ProfileSection>
        )}

        {tab === "documents" && (
          <ProfileSection title="Documents" variant="plain" action={isStaff ? <CreatorDocumentAddAction creatorUid={creator.uid} /> : undefined}>
            <CreatorDocumentsPanel
              creatorUid={creator.uid}
              creatorSlug={creator.slug}
              creatorName={creator.name}
              viewer={{
                uid: authUser?.uid ?? null,
                name: authUser?.name ?? authUser?.email ?? null,
                isStaff,
                isAdmin,
                canSign: Boolean(authUser && creator.uid && !isStaff && authUser.uid === creator.uid),
              }}
            />
          </ProfileSection>
        )}
      </ProfileLayout>
    </main>
  );
}
