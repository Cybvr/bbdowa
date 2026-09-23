"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CreatorThumbnail } from "@/components/creator-thumbnail";
import { readSharedCreatorList } from "@/lib/firebase/creator-collections";
import { useFirestoreUsers } from "@/lib/firebase/client-content";
import { creatorHref, isCreatorUser, type Creator } from "@/lib/users";

export default function SharedCreatorListPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const { users, loading: usersLoading } = useFirestoreUsers();
  const [list, setList] = useState<{ name: string; slugs: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    readSharedCreatorList(shareId)
      .then((value) => {
        if (active) setList(value ? { name: value.name, slugs: value.slugs } : null);
      })
      .catch(() => {
        if (active) setList(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [shareId]);

  const creators = useMemo(() => {
    if (!list) return [];
    const bySlug = new Map(users.filter(isCreatorUser).map((creator) => [creator.slug, creator]));
    return list.slugs.map((slug) => bySlug.get(slug)).filter((creator): creator is Creator => Boolean(creator));
  }, [list, users]);

  const pageLoading = loading || usersLoading;

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-10 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard/discover" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          BBDO West Africa · Discover
        </Link>
        {pageLoading ? (
          <p className="mt-12 text-sm text-muted-foreground">Loading list…</p>
        ) : !list ? (
          <section className="mt-12 border-t border-border pt-8">
            <h1 className="m-0 text-3xl font-bold">List unavailable</h1>
            <p className="mt-3 text-muted-foreground">This shared creator list no longer exists.</p>
          </section>
        ) : (
          <>
            <header className="mt-12 border-b border-border pb-8">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Shared creator list</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{list.name}</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {creators.length} {creators.length === 1 ? "creator" : "creators"}
              </p>
            </header>
            {creators.length ? (
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {creators.map((creator) => (
                  <Link
                    key={creator.slug}
                    href={creatorHref(creator.slug)}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition hover:border-foreground"
                  >
                    <CreatorThumbnail imageSrc={creator.profileImage} className="h-14 w-14" avatarSeed={creator.name} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{creator.name}</span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">{creator.category || "Creator"}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-8 text-sm text-muted-foreground">This list has no available creators.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
