"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { FaBehance, FaGlobe } from "react-icons/fa";
import { LayoutGrid, Mail, MapPin, Phone } from "lucide-react";
import { creatorCategoryOptions, isCreatorNew, isCreatorUser, matchesJobTeamKey, userHref, type Creator } from "@/lib/users";
import { useAuth } from "@/components/auth-provider";
import { readJobsFromFirestore, readClientsFromFirestore, readDocumentsForAssignee, readTimeEntriesForUser, useFirestoreUsers } from "@/lib/firebase/client-content";
import { longDate } from "@/lib/format";
import { byLastModified, type Job } from "@/lib/jobs";
import { JobCard } from "@/components/job-card";
import type { Client } from "@/lib/clients";
import {
  DetailBreadcrumb,
  ProfileBanner,
  ProfileFact,
  ProfileFacts,
  ProfileIconLink,
  ProfileLayout,
  ProfileSection,
} from "@/components/dashboard/detail-hero";
import { SocialIcon, type SocialIconName } from "@/components/social-icon";
import { ShareCreatorDialog } from "@/components/share-creator-dialog";
import { UserActions } from "@/components/user-actions";
import { ProfilePageSkeleton } from "@/components/dashboard/loading-skeleton";
import { MobileHeaderActions, MobileHeaderTitle } from "@/components/dashboard/mobile-header";
import { CreatorDocumentAddAction, CreatorDocumentsPanel } from "@/components/creator-documents-panel";
import { CreatorHoursPanel } from "@/components/creator-hours-panel";
import { CreatorTasksPanel, NewTaskSheet } from "@/components/tasks-view";

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

type CreatorTab = "overview" | "jobs" | "hours" | "tasks" | "documents";

const SECTIONS = {
  discover: { label: "Discover", listHref: "/dashboard/discover", variant: "creator" },
  people: { label: "Team", listHref: "/dashboard/people", variant: "team" },
} as const;

/**
 * The full profile page for any user. Creators open it from Discover and
 * everyone else from Team, but every user carries the same fields, so both
 * directories render the same page.
 */
export function UserProfile({ section }: { section: keyof typeof SECTIONS }) {
  const { label: sectionLabel, listHref, variant } = SECTIONS[section];
  const { slug } = useParams<{ slug: string }>();
  const { user: authUser, role, isAdmin } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const directory = useFirestoreUsers();
  const [tab, setTab] = useState<CreatorTab>("overview");
  const [taskRefresh, setTaskRefresh] = useState(0);

  // Public collections — no auth needed, so every viewer can see this.
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [hasHours, setHasHours] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([readClientsFromFirestore(), readJobsFromFirestore()])
      .then(([clientsData, jobsData]) => {
        if (!active) return;
        setClients(clientsData);
        setJobs(jobsData);
      })
      .catch((cause) => console.error("Unable to load clients/jobs", cause));
    return () => {
      active = false;
    };
  }, []);

  // The users directory is public so a published creator profile resolves for
  // every viewer. Staff status still controls the actions and staff-only tabs.
  const loading = directory.loading;
  const error = directory.error;
  const creator = directory.users.find((user) => user.slug === slug || user.uid === slug);
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
  if (!creator || (section === "discover" && !isCreatorUser(creator))) {
    return <main className="flex-1 px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-4">Profile not found.</main>;
  }
  const platforms = platformsFor(creator);
  const creatorJobs = [
    ...jobs.filter((job) => job.creatorSlugs?.some((key) => matchesJobTeamKey(creator, key))),
    ...jobs.filter((job) => job.leadUserId && matchesJobTeamKey(creator, job.leadUserId)),
  ].filter((job, index, list) => list.findIndex((entry) => entry.slug === job.slug) === index);
  const canSeeTasks = isStaff || Boolean(creator.uid);

  type EngagementCell = { label: string; value: ReactNode };
  const engagementCells = ([
    creator.dayRate ? { label: "Day rate", value: creator.dayRate } : null,
    creator.availability ? { label: "Availability", value: <span className="capitalize">{creator.availability}</span> } : null,
    creator.terms ? { label: "Terms", value: creator.terms } : null,
    creator.referralSource ? { label: "Referred by", value: creator.referralSource } : null,
  ] as (EngagementCell | null)[]).filter((cell): cell is EngagementCell => cell !== null);

  type DetailRow = { icon: ReactNode; label: string; value: ReactNode };
  const detailRows = ([
    { icon: <LayoutGrid className="h-5 w-5" aria-hidden="true" />, label: "Category", value: creator.category || "—" },
    creator.location ? { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, label: "Location", value: creator.location } : null,
    creator.email ? { icon: <Mail className="h-5 w-5" aria-hidden="true" />, label: "Email", value: <a href={`mailto:${creator.email}`} className="hover:text-primary">{creator.email}</a> } : null,
    creator.phone ? { icon: <Phone className="h-5 w-5" aria-hidden="true" />, label: "Phone", value: creator.phone } : null,
  ] as (DetailRow | null)[]).filter((row): row is DetailRow => row !== null);

  const tabs: { id: CreatorTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    ...(creatorJobs.length ? ([{ id: "jobs", label: "Jobs" }] as const) : []),
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
        breadcrumb={
          <div className="hidden nav:block">
            <DetailBreadcrumb crumbs={[{ label: sectionLabel, href: listHref }, { label: creator.name }]} />
          </div>
        }
        actions={
          <>
            {/* Desktop: actions sit in the banner. On phones the breadcrumb is
             * hidden and the dashboard top bar carries the creator's name plus
             * edit and share as its CTAs. */}
            <div className="hidden items-center gap-2 nav:flex">
              <UserActions user={creator} variant={variant} listHref={listHref} categoryOptions={creatorCategoryOptions(categorySource)} iconOnly />
              <ShareCreatorDialog creatorName={creator.name} path={userHref(creator, variant)} />
            </div>
            <MobileHeaderTitle title={creator.name} />
            <MobileHeaderActions>
              <UserActions user={creator} variant={variant} listHref={listHref} categoryOptions={creatorCategoryOptions(categorySource)} iconOnly />
              <ShareCreatorDialog creatorName={creator.name} path={userHref(creator, variant)} />
            </MobileHeaderActions>
          </>
        }
        eyebrow={creator.category || creator.department}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
        showSidebarOnMobile={false}
        sidebar={
          <>
            <ProfileFacts>
              <ProfileFact label="Added" value={longDate(creator.addedAt?.slice(0, 10))} />
              {creator.title ? <ProfileFact label="Title" value={creator.title} /> : null}
              {creator.department ? <ProfileFact label="Department" value={creator.department} /> : null}
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
            {creator.phone || creator.email ? (
              <div className="flex gap-2">
                {creator.phone ? (
                  <a href={`tel:${creator.phone}`} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition hover:bg-primary/90">
                    <Phone aria-hidden="true" className="h-4 w-4" />Call
                  </a>
                ) : null}
                {creator.email ? (
                  <a href={`mailto:${creator.email}`} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-muted text-[15px] font-semibold text-foreground transition hover:bg-muted/75">
                    <Mail aria-hidden="true" className="h-4 w-4" />Email
                  </a>
                ) : null}
              </div>
            ) : null}

            {creator.craftNote ? (
              <p className="m-0 text-[15px] leading-[1.55]">{creator.craftNote}</p>
            ) : null}

            {creator.tags?.length ? (
              <div className="flex flex-wrap gap-1.5 lg:hidden">
                {creator.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-foreground">{tag}</span>
                ))}
              </div>
            ) : null}

            {engagementCells.length ? (
              <ProfileSection title="Engagement" variant="plain">
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
                  {engagementCells.map((cell) => (
                    <div key={cell.label} className="bg-background p-4">
                      <p className="m-0 text-[13px] text-muted-foreground">{cell.label}</p>
                      <p className="mb-0 mt-1 text-[16px] font-semibold text-foreground">{cell.value}</p>
                    </div>
                  ))}
                </div>
              </ProfileSection>
            ) : null}

            <div className="lg:hidden">
              <ProfileSection title="Details" variant="plain">
                <div>
                  {detailRows.map((row) => (
                    <div key={row.label} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                      <span className="shrink-0 text-muted-foreground">{row.icon}</span>
                      <div className="min-w-0">
                        <p className="m-0 text-[13px] text-muted-foreground">{row.label}</p>
                        <p className="mb-0 mt-0.5 truncate text-[15px] font-semibold text-foreground">{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ProfileSection>
            </div>

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

            {creator.workHistory?.length ? (
              <ProfileSection title="Work history" variant="plain">
                <div className="space-y-4">
                  {creator.workHistory.map((entry, index) => (
                    <div key={index} className="flex items-baseline justify-between gap-4">
                      <div className="min-w-0">
                        <p className="m-0 text-[15px] font-semibold text-foreground">{entry.role}</p>
                        <p className="mb-0 mt-0.5 text-[14px] text-muted-foreground">
                          {entry.company}{entry.location ? ` · ${entry.location}` : ""}
                        </p>
                      </div>
                      {entry.period ? <span className="shrink-0 text-[13px] text-muted-foreground">{entry.period}</span> : null}
                    </div>
                  ))}
                </div>
              </ProfileSection>
            ) : null}
          </>
        )}

        {tab === "jobs" && (
          <ProfileSection title="Jobs" variant="plain">
            {creatorJobs.length ? (
              <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {[...creatorJobs].sort(byLastModified).map((job) => <li key={job.slug}><JobCard job={job} /></li>)}
              </ul>
            ) : (
              <div className="py-10 text-center">
                <p className="m-0 font-semibold">No jobs yet</p>
                <p className="mb-0 mt-1 text-sm text-muted-foreground">{creator.name} hasn’t been added to a job yet.</p>
              </div>
            )}
          </ProfileSection>
        )}

        {tab === "hours" && authUser && (
          <ProfileSection title="Hours logged" variant="plain">
            <CreatorHoursPanel creatorUid={creator.uid} creatorName={creator.name} />
          </ProfileSection>
        )}

        {tab === "tasks" && canSeeTasks && (
          <ProfileSection
            title="Tasks"
            variant="plain"
            action={isStaff && creator.uid ? (
              <NewTaskSheet
                creatorUid={creator.uid}
                creatorName={creator.name}
                createdBy={authUser?.uid ?? ""}
                createdByName={authUser?.name ?? authUser?.email ?? null}
                onCreated={() => setTaskRefresh((value) => value + 1)}
              />
            ) : undefined}
          >
            <CreatorTasksPanel
              creatorUid={creator.uid}
              creatorName={creator.name}
              viewer={{ uid: authUser?.uid ?? "", name: authUser?.name ?? authUser?.email ?? null, isStaff }}
              assignees={directory.users.flatMap((candidate) => candidate.uid ? [{ uid: candidate.uid, name: candidate.name }] : [])}
              refreshSignal={taskRefresh}
            />
          </ProfileSection>
        )}

        {tab === "documents" && (
          <ProfileSection title="Documents" variant="plain" action={isStaff ? <CreatorDocumentAddAction creatorUid={creator.uid} /> : undefined}>
            <CreatorDocumentsPanel
              creatorUid={creator.uid}
              creatorSlug={creator.slug || ""}
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
