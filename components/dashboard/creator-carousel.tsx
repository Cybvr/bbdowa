"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CreatorThumbnail } from "@/components/creator-thumbnail";
import type { Creator } from "@/lib/users";
import { creatorHref } from "@/lib/users";

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
        className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0"
      >
        {creators.map((creator) => (
          <Link
            key={creator.slug}
            href={creatorHref(creator.slug)}
            className="group flex w-[84px] shrink-0 snap-start flex-col items-center gap-2 focus-visible:outline-none"
          >
            <CreatorThumbnail
              imageSrc={creator.profileImage}
              avatarSeed={creator.name}
              className="h-[72px] w-[72px] transition group-hover:ring-2 group-hover:ring-primary/40"
            />
            <span className="w-full truncate text-center text-[13px] font-semibold text-foreground">{creator.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
