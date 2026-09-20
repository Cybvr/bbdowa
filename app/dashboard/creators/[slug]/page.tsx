"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import { FaBehance, FaGlobe } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import { Briefcase, Calendar, CheckSquare, Clock, FileSignature, FileText, Link2, Mail, MapPin, ShieldCheck, Tag, UserCheck, Users } from "lucide-react";
import { creatorCategoryOptions, isCreatorNew, isCreatorUser, type Creator } from "@/lib/users";
import { useAuth } from "@/components/auth-provider";
import { useFirestoreUsers, useOwnUser } from "@/lib/firebase/client-content";
import { longDate } from "@/lib/format";
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
import { CreatorTasksPanel } from "@/components/tasks-view";
import { CreatorContractsPanel } from "@/components/contracts-view";

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

type CreatorTab = "overview" | "work-history" | "contact" | "tasks" | "contracts";

export default function CreatorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user: authUser, role, loading: authLoading } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const staff = useFirestoreUsers();
  const own = useOwnUser();
  const [tab, setTab] = useState<CreatorTab>("overview");

  // Staff can browse every creator; everyone else can only ever land on their
  // own profile (Firestore only lets a person read their own `users` doc).
  const loading = isStaff ? staff.loading : authLoading || own.loading;
  const error = isStaff ? staff.error : null;
  const creator = isStaff ? staff.users.find((user) => user.slug === slug) : own.user?.slug === slug ? own.user : undefined;
  const categorySource = isStaff ? staff.users : own.user ? [own.user] : [];

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
    { id: "tasks", label: "Tasks" },
    { id: "contracts", label: "Contracts" },
  ];

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
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
              <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]">New</span>
            ) : null}
          </span>
        }
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
      />

      <ProfileLayout
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
              <ProfileFact icon={<Calendar aria-hidden="true" className="h-4 w-4" />} label="Added to directory" value={longDate(creator.addedAt?.slice(0, 10))} />
              <ProfileFact icon={<Briefcase aria-hidden="true" className="h-4 w-4" />} label="Category" value={creator.category || "—"} />
              <ProfileFact icon={<Users aria-hidden="true" className="h-4 w-4" />} label="Engages as" value={creator.entity} />
              <ProfileFact icon={<MapPin aria-hidden="true" className="h-4 w-4" />} label="Location" value={creator.location || "—"} />
              <ProfileFact
                icon={<ShieldCheck aria-hidden="true" className="h-4 w-4" />}
                label="Clearance"
                value={creator.clearance === "cleared" ? "Cleared to engage" : "Sign-off pending"}
              />
              <ProfileFact icon={<UserCheck aria-hidden="true" className="h-4 w-4" />} label="Vouched by" value={creator.vouchedBy || "—"} />
            </ProfileFacts>
          </>
        }
      >
        {tab === "overview" && (
          <>
            {creator.craftNote ? (
              <ProfileSection icon={<FileText aria-hidden="true" className="h-3.5 w-3.5" />} title="Craft note">
                <p className="m-0 max-w-[850px] text-[15px] leading-[1.5]">{creator.craftNote}</p>
              </ProfileSection>
            ) : null}

            <ProfileSection icon={<Briefcase aria-hidden="true" className="h-3.5 w-3.5" />} title="Engagement">
              <ProfileTable
                columns={[
                  { key: "availability", label: "Availability" },
                  { key: "dayRate", label: "Day rate estimate" },
                  { key: "terms", label: "Terms" },
                  { key: "engagements", label: "Engagements" },
                ]}
                rows={[{
                  availability: <span className="capitalize">{creator.availability}</span>,
                  dayRate: creator.dayRate || "—",
                  terms: creator.terms || "—",
                  engagements: creator.workedOn.length ? creator.workedOn.join(", ") : "—",
                }]}
              />
            </ProfileSection>

            <ProfileSection icon={<Users aria-hidden="true" className="h-3.5 w-3.5" />} title="Audience profile">
              <ProfileTable
                columns={[
                  { key: "followers", label: "Follower count" },
                  { key: "gender", label: "Gender" },
                  { key: "age", label: "Age" },
                  { key: "niche", label: "Niche" },
                ]}
                rows={[{
                  followers: creator.followerCount
                    ? `${creator.followerCount}${creator.followerPlatform ? ` · ${creator.followerPlatform}` : ""}`
                    : "Not provided",
                  gender: creator.gender ?? "Not provided",
                  age: creator.age ?? "Not provided",
                  niche: creator.niche ?? "Not provided",
                }]}
              />
            </ProfileSection>
          </>
        )}

        {tab === "work-history" && (
          <ProfileSection icon={<Clock aria-hidden="true" className="h-3.5 w-3.5" />} title="Work history">
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
            />
          </ProfileSection>
        )}

        {tab === "contact" && (
          <>
            <ProfileSection icon={<Link2 aria-hidden="true" className="h-3.5 w-3.5" />} title="Platforms">
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
                <p className="m-0 text-[13px] text-muted-foreground">Public platform links not yet confirmed.</p>
              )}
            </ProfileSection>

            <ProfileSection icon={<Mail aria-hidden="true" className="h-3.5 w-3.5" />} title="Direct contact">
              <ul className="m-0 list-none p-0 text-[15px] leading-[1.35]">
                {creator.email ? (
                  <li className="border-t border-border py-2.5 first:border-t-0 first:pt-0">
                    <a href={`mailto:${creator.email}`} className="text-foreground hover:text-primary">
                      {creator.email}
                    </a>
                  </li>
                ) : null}
                {creator.phone ? <li className="border-t border-border py-2.5 first:border-t-0 first:pt-0">{creator.phone}</li> : null}
                {!creator.email && !creator.phone ? (
                  <li className="text-muted-foreground">{creator.contactNote ?? "Public contact links not yet confirmed."}</li>
                ) : creator.contactNote ? (
                  <li className="border-t border-border py-2.5 text-muted-foreground">{creator.contactNote}</li>
                ) : null}
              </ul>
            </ProfileSection>

            <ProfileSection icon={<Tag aria-hidden="true" className="h-3.5 w-3.5" />} title="Tags">
              {creator.tags.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {creator.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-[12px] text-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="m-0 text-[13px] text-muted-foreground">No tags yet.</p>
              )}
            </ProfileSection>
          </>
        )}

        {tab === "tasks" && authUser && (
          <ProfileSection icon={<CheckSquare aria-hidden="true" className="h-3.5 w-3.5" />} title="Tasks">
            <CreatorTasksPanel
              creatorUid={creator.uid}
              creatorName={creator.name}
              viewer={{ uid: authUser.uid, name: authUser.name ?? authUser.email, isStaff }}
            />
          </ProfileSection>
        )}

        {tab === "contracts" && authUser && (
          <ProfileSection icon={<FileSignature aria-hidden="true" className="h-3.5 w-3.5" />} title="Contracts">
            <CreatorContractsPanel
              creatorUid={creator.uid}
              creatorName={creator.name}
              viewer={{ uid: authUser.uid, name: authUser.name ?? authUser.email, isStaff }}
            />
          </ProfileSection>
        )}
      </ProfileLayout>
    </main>
  );
}
