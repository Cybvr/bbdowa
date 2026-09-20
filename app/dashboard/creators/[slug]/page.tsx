"use client";

import { useParams } from "next/navigation";
import type { IconType } from "react-icons";
import { FaBehance, FaGlobe } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import { BackLink } from "@/components/back-link";
import { creatorCategoryOptions, isCreatorNew, isCreatorUser, type Creator } from "@/lib/users";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { longDate } from "@/lib/format";
import { ImageWithFallback, MetaGrid, MetaItem, SectionHeading } from "@/components/dashboard/ui";
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

function ProfileMark({ creator, className }: { creator: Creator; className: string }) {
  return (
    <span aria-hidden="true" className={`grid flex-none place-items-center overflow-hidden bg-muted ${className}`}>
      <ImageWithFallback src={creator.profileImage} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
    </span>
  );
}

export default function CreatorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { users, loading, error } = useFirestoreUsers();
  const creator = users.find((user) => user.slug === slug);

  if (loading) return <ProfilePageSkeleton />;
  if (error) return <main className="flex-1 px-5 pb-16 pt-8 sm:px-8 text-sm text-muted-foreground">{error}</main>;
  if (!creator || !isCreatorUser(creator)) {
    return <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">Creator not found.</main>;
  }
  const platforms = platformsFor(creator);

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <BackLink href="/dashboard/creators" className="mb-5">
        Back to creators
      </BackLink>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <div className="flex items-center gap-4">
              <ProfileMark creator={creator} className="h-16 w-16 rounded-full text-[18px] sm:h-20 sm:w-20" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="block text-[13px] font-semibold text-primary">{creator.category}</span>
                  {isCreatorNew(creator) ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">New</span> : null}
                </div>
                <h1 className="mb-0 mt-1.5 text-[24px] font-bold leading-tight tracking-tight sm:text-[30px]">
                  {creator.name}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-muted-foreground">{creator.availability}</span>
              <UserActions user={creator} variant="creator" listHref="/dashboard/creators" categoryOptions={creatorCategoryOptions(users)} />
              <ShareCreatorDialog creatorName={creator.name} path={`/dashboard/creators/${creator.slug}`} showLabel />
            </div>
          </div>

          <p className="my-6 max-w-[850px] text-[17px] leading-[1.4]">{creator.craftNote}</p>

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

          <section className="mt-10">
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

          <div className="mt-10 grid grid-cols-1 gap-10">
            <section>
              <SectionHeading>Work history</SectionHeading>
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
            </section>

            <div className="grid grid-cols-1 gap-10">
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
                  <div className="grid grid-cols-1 gap-2">
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
            </div>
          </div>
        </div>

        <aside className="min-w-0 max-[900px]:order-first">
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="relative aspect-[4/5] bg-muted">
              <ImageWithFallback
                src={creator.featuredImage}
                alt={`${creator.name} featured work`}
                className="h-full w-full object-cover"
                fallbackClassName="h-full w-full"
              />
              <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
            </div>
            <div className="border-t border-border p-4">
              <span className="block text-[12px] font-semibold text-primary">Featured work</span>
              <span className="mt-1 block text-[13px] text-muted-foreground">
                {creator.featuredImage ? "Public portfolio image" : "No verified project image yet"}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
