"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { ImageWithFallback } from "@/components/empty-thumbnail";
import { SectionHeading } from "@/components/dashboard/ui";
import {
  baseCity,
  creatorAddedTimestamp,
  creatorHref,
  isCreatorNew,
  type Creator,
} from "@/lib/users";

export function CreatorCarousel({ creators }: { creators: Creator[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const latestCreators = useMemo(
    () => [...creators].filter((creator) => creator.addedAt).sort((a, b) => creatorAddedTimestamp(b) - creatorAddedTimestamp(a)).slice(0, 8),
    [creators],
  );

  const move = (direction: number) => {
    railRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  };

  if (latestCreators.length === 0) return null;

  return (
    <section className="mt-10" aria-labelledby="new-creators-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionHeading id="new-creators-heading">New creators</SectionHeading>
          <p className="m-0 text-[13px] text-muted-foreground">The latest people added to the creator directory.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous creators"
            onClick={() => move(-1)}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next creators"
            onClick={() => move(1)}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={railRef} className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {latestCreators.map((creator) => (
          <Link
            key={creator.slug}
            href={creatorHref(creator.slug)}
            className="group min-w-[220px] snap-start overflow-hidden rounded-xl border border-border bg-background text-foreground no-underline transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:min-w-[240px]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <ImageWithFallback
                src={creator.profileImage}
                alt={`${creator.name} profile screenshot`}
                className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
                fallbackClassName="h-full w-full"
              />
              {isCreatorNew(creator) ? (
                <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                  New
                </span>
              ) : null}
            </div>
            <div className="p-4">
              <h3 className="m-0 truncate text-[15px] font-semibold tracking-tight">{creator.name}</h3>
              <p className="mb-0 mt-1 truncate text-[12px] text-muted-foreground">
                {creator.niche ?? creator.category} · {baseCity(creator.location)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
