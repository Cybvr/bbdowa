"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { FaBehance, FaGlobe } from "react-icons/fa";
import { Mail, Pencil } from "lucide-react";
import { isCreatorNew, isCreatorUser, type User } from "@/lib/users";
import { useAuth } from "@/components/auth-provider";
import { useOwnUser, readCampaignsFromFirestore, readClientsFromFirestore, readContractsForAssignee, readTimeEntriesForUser } from "@/lib/firebase/client-content";
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
import { ProfilePageSkeleton } from "@/components/dashboard/loading-skeleton";
import { CreatorContractsPanel } from "@/components/contracts-view";
import { CreatorHoursPanel } from "@/components/creator-hours-panel";

type ProfilePlatform = { label: string; href: string; Icon?: IconType; brand?: SocialIconName };

function platformsFor(user: User): ProfilePlatform[] {
  const platforms: ProfilePlatform[] = [];
  if (user.portfolio) {
    const isBehance = user.portfolio.toLowerCase().includes("behance.net");
    if (!isBehance) platforms.push({ label: "Website", href: user.portfolio, Icon: FaGlobe });
    if (isBehance && !user.behance) platforms.push({ label: "Behance", href: user.portfolio, Icon: FaBehance });
  }
  if (user.behance) platforms.push({ label: "Behance", href: user.behance, Icon: FaBehance });
  if (user.linkedin) platforms.push({ label: "LinkedIn", href: user.linkedin, brand: "LinkedIn" });
  if (user.instagram) platforms.push({ label: "Instagram", href: user.instagram, brand: "Instagram" });
  return platforms;
}

type ProfileTab = "overview" | "work-history" | "campaigns" | "hours" | "contracts";

/**
 * "My profile" — the signed-in user's own profile, resolved by uid so it
 * works whether or not they have a slug (unlike /dashboard/discover/[slug],
 * which needs one). A real page, not a redirect.
 */
export default function MyProfilePage() {
  const { user: authUser, loading: authLoading, role, isAdmin } = useAuth();
  const { user: own, loading: ownLoading, error } = useOwnUser();
  const isStaff = role === "admin" || role === "manager";
  const creator = own ? isCreatorUser(own) : false;
  const [tab, setTab] = useState<ProfileTab>("overview");

  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contractCount, setContractCount] = useState(0);
  const [hasHours, setHasHours] = useState(false);
  useEffect(() => {
    if (!creator || !authUser) {
      setClients([]);
      setCampaigns([]);
      setContractCount(0);
      setHasHours(false);
      return;
    }
    let active = true;
    Promise.all([
      readClientsFromFirestore(),
      readCampaignsFromFirestore(),
      readContractsForAssignee(authUser.uid),
      readTimeEntriesForUser(authUser.uid),
    ])
      .then(([clientsData, campaignsData, contractsData, timeEntries]) => {
        if (!active) return;
        setClients(clientsData);
        setCampaigns(campaignsData);
        setContractCount(contractsData.length);
        setHasHours(timeEntries.length > 0);
      })
      .catch((cause) => console.error("Unable to load clients/campaigns", cause));
    return () => {
      active = false;
    };
  }, [authUser, creator]);

  if (authLoading || ownLoading) return <ProfilePageSkeleton />;

  if (!authUser) {
    return <main className="flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4 text-sm text-muted-foreground">Sign in to view your profile.</main>;
  }

  if (error || !own) {
    return <main className="flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4 text-sm text-destructive">{error ?? "Unable to load your profile."}</main>;
  }

  const platforms = platformsFor(own);
  const creatorCampaigns = creator ? getCreatorCampaigns(own.slug, clients, campaigns) : [];

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    ...(creator && own.workHistory?.length ? ([{ id: "work-history", label: "Work history" }] as const) : []),
    ...(creator && creatorCampaigns.length ? ([{ id: "campaigns", label: "Campaigns" }] as const) : []),
    ...(hasHours ? ([{ id: "hours", label: "Hours" }] as const) : []),
    ...(creator && contractCount > 0 ? ([{ id: "contracts", label: "Contracts" }] as const) : []),
  ];

  return (
    <main className="flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">
      <DetailBreadcrumb
        crumbs={[{ label: "My profile" }]}
        actions={
          <Link
            href="/dashboard/settings"
            className="inline-flex h-11 items-center gap-1.5 rounded-md border border-border px-4 text-[14px] font-semibold text-foreground transition hover:border-foreground sm:h-9 sm:px-3 sm:text-[13px]"
          >
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            Edit profile
          </Link>
        }
      />

      <ProfileBanner
        avatarSrc={own.profileImage}
        avatarAlt={own.name}
        name={own.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{creator ? own.category : own.title || "Team"}</span>
            {creator ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{own.availability}</span>
              </>
            ) : null}
            {creator && isCreatorNew(own) ? (
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
            {(own.email || own.phone || platforms.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {own.email ? (
                  <ProfileIconLink href={`mailto:${own.email}`} label="Email">
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
              {creator ? <ProfileFact label="Added" value={longDate(own.addedAt?.slice(0, 10))} /> : null}
              {creator ? <ProfileFact label="Category" value={own.category || "—"} /> : null}
              {!creator ? <ProfileFact label="Title" value={own.title || "—"} /> : null}
              {!creator ? <ProfileFact label="Department" value={own.department || "—"} /> : null}
              <ProfileFact label="Location" value={own.location || "—"} />
              {own.email ? (
                <ProfileFact label="Email" value={<a href={`mailto:${own.email}`} className="hover:text-primary">{own.email}</a>} />
              ) : null}
              {own.phone ? <ProfileFact label="Phone" value={own.phone} /> : null}
            </ProfileFacts>

            {own.tags?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {own.tags.map((tag) => (
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
            {creator && own.craftNote ? (
              <ProfileSection title="Craft note" variant="plain">
                <p className="m-0 max-w-[850px] text-[15px] leading-[1.5]">{own.craftNote}</p>
              </ProfileSection>
            ) : null}

            {creator ? (
              <ProfileSection title="Engagement" variant="plain">
                <div>
                  <ProfileFact label="Availability" value={<span className="capitalize">{own.availability}</span>} />
                  <ProfileFact label="Day rate estimate" value={own.dayRate || "—"} />
                  <ProfileFact label="Terms" value={own.terms || "—"} />
                  <ProfileFact label="Engagements" value={own.workedOn?.length ? own.workedOn.join(", ") : "—"} />
                </div>
              </ProfileSection>
            ) : null}
          </>
        )}

        {tab === "work-history" && creator && (
          <ProfileSection title="Work history" variant="plain">
            <ProfileTable
              columns={[
                { key: "period", label: "Period" },
                { key: "role", label: "Role" },
                { key: "company", label: "Company" },
                { key: "location", label: "Location" },
              ]}
              rows={(own.workHistory ?? []).map((entry) => ({
                period: entry.period,
                role: <span className="font-semibold text-foreground">{entry.role}</span>,
                company: entry.company,
                location: entry.location ?? "—",
              }))}
              emptyTitle="No work history yet"
              emptyDescription="You haven’t added any past roles yet."
            />
          </ProfileSection>
        )}

        {tab === "campaigns" && creator && (
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
              emptyDescription="You haven’t been added to a campaign yet."
            />
          </ProfileSection>
        )}

        {tab === "hours" && (
          <ProfileSection title="Hours logged" variant="plain">
            <CreatorHoursPanel creatorUid={authUser.uid} creatorName={own.name} />
          </ProfileSection>
        )}

        {tab === "contracts" && creator && (
          <ProfileSection title="Contracts" variant="plain">
            <CreatorContractsPanel
              creatorUid={authUser.uid}
              creatorSlug={own.slug}
              creatorName={own.name}
              viewer={{ uid: authUser.uid, name: authUser.name ?? authUser.email, isStaff, isAdmin }}
            />
          </ProfileSection>
        )}
      </ProfileLayout>
    </main>
  );
}
