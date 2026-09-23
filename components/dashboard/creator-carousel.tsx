"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CreatorThumbnail } from "@/components/creator-thumbnail";
import type { Creator } from "@/lib/users";
import { baseCity, creatorHref, isCreatorNew } from "@/lib/users";

function NewBadge() {
  return (
    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
      New
    </span>
  );
}

export function CreatorCarousel({ creators }: { creators: Creator[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollLeft(track.scrollLeft > 4);
    setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [creators.length]);

  const scroll = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({
      left: direction * Math.max(260, (trackRef.current.clientWidth - 36) * 0.82),
      behavior: "smooth",
    });
  };

  return (
    <section aria-labelledby="new-creators-heading" className="mt-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 id="new-creators-heading" className="m-0 text-[15px] font-bold tracking-tight">New creators</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/discover" className="mr-1 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
            View all
          </Link>
          <button
            type="button"
            aria-label="Previous creators"
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next creators"
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0"
      >
        {creators.map((creator) => (
          <Link
            key={creator.slug}
            href={creatorHref(creator.slug)}
            className="group w-[min(78vw,280px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-background transition hover:-translate-y-0.5 hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:w-[260px] lg:w-[calc((100%_-_36px)/4)]"
          >
            <div className="relative aspect-[1.35] overflow-hidden bg-muted">
              <CreatorThumbnail
                imageSrc={creator.profileImage}
                avatarSeed={creator.name}
                rounded={false}
                className="h-full w-full"
              />
              {isCreatorNew(creator) ? <span className="absolute left-3 top-3"><NewBadge /></span> : null}
            </div>
            <div className="p-4">
              <h3 className="m-0 truncate text-[15px] font-bold text-foreground">{creator.name}</h3>
              <p className="m-0 mt-1 truncate text-[13px] text-muted-foreground">
                {creator.niche || creator.category || "Creator"}
              </p>
              <p className="m-0 mt-3 truncate text-[12px] font-medium text-muted-foreground">
                {baseCity(creator.location) || "Location not provided"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
