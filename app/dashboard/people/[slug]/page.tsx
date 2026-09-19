"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { campaignHref } from "@/lib/campaigns";
import { useFirestoreUsers, readCampaignsFromFirestore } from "@/lib/firebase/client-content";
import { useEffect, useState } from "react";
import type { Campaign } from "@/lib/campaigns";
import { ImageWithFallback, MetaGrid, MetaItem, SectionHeading } from "@/components/dashboard/ui";
import { UserActions } from "@/components/user-actions";

const WORK_LINK =
  "group flex items-baseline justify-between gap-5 border-b border-border py-3.5 text-foreground no-underline hover:text-primary focus-visible:text-primary focus-visible:outline-none";

export default function UserDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { users, loading: usersLoading, error: usersError } = useFirestoreUsers();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);
  const user = users.find((candidate) => candidate.slug === slug);

  useEffect(() => {
    let active = true;
    readCampaignsFromFirestore()
      .then((campaignsData) => {
        if (!active) return;
        setCampaigns(campaignsData);
        setContentLoading(false);
      })
      .catch((error) => {
        console.error("Unable to load linked content from Firestore", error);
        if (active) {
          setContentLoading(false);
          setContentError("Unable to load linked content from Firestore.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (usersLoading || contentLoading) return <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">Loading profile…</main>;
  if (usersError || contentError) return <main className="flex-1 px-5 pb-16 pt-8 sm:px-8 text-sm text-muted-foreground">{usersError ?? contentError}</main>;
  if (!user) return <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">User not found.</main>;

  const linkedCampaigns = campaigns.filter((campaign) => campaign.leadUserId === user.slug);

  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <BackLink href="/dashboard/people">Back to directory</BackLink>
        <UserActions user={user} variant="team" listHref="/dashboard/people" />
      </div>

      <section className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-6 border-b border-border pb-8 max-[560px]:grid-cols-1">
        <div
          aria-hidden="true"
          className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-primary text-[24px] font-bold text-white sm:h-24 sm:w-24"
        >
          <ImageWithFallback
            src={user.profileImage}
            alt=""
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
          />
        </div>
        <div>
          <p className="mb-1.5 mt-0 text-[13px] font-semibold text-primary">{user.department}</p>
          <h1 className="m-0 text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">{user.name}</h1>
          <p className="mb-0 mt-2 text-[15px] leading-[1.35] text-muted-foreground">{user.title}</p>
        </div>
      </section>

      <section className="mt-6" aria-label="User information">
        <MetaGrid columns={2}>
          <MetaItem label="Role">{user.title}</MetaItem>
          <MetaItem label="Department">{user.department}</MetaItem>
        </MetaGrid>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2" aria-label="Linked work">
        <div>
          <SectionHeading>Campaigns led</SectionHeading>
          {linkedCampaigns.length ? (
            <ul className="m-0 list-none border-t border-border p-0">
              {linkedCampaigns.map((campaign) => (
                <li key={campaign.slug}>
                  <Link href={campaignHref(campaign.slug)} className={WORK_LINK}>
                    <span className="text-[16px] font-semibold leading-[1.15]">{campaign.name}</span>
                    <span className="text-[12px] font-medium text-muted-foreground group-hover:text-primary">
                      {campaign.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 border-t border-border py-4 text-[14px] text-muted-foreground">
              No linked campaigns yet.
            </p>
          )}
        </div>

      </section>
    </main>
  );
}
