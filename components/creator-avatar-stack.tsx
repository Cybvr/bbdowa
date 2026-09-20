"use client";

import { CreatorThumbnail } from "@/components/creator-thumbnail";
import type { Creator } from "@/lib/users";

/**
 * Overlapping row of creator photos, capped at `max` with a "+N" overflow
 * badge for the rest. Used wherever a card needs to show who's on it.
 */
export function CreatorAvatarStack({
  creators,
  max = 5,
  size = "h-7 w-7",
}: {
  creators: Creator[];
  max?: number;
  size?: string;
}) {
  if (creators.length === 0) return null;

  const visible = creators.slice(0, max);
  const overflow = creators.length - visible.length;

  return (
    <div
      className="flex items-center -space-x-2"
      aria-label={`${creators.length} creator${creators.length === 1 ? "" : "s"} assigned`}
    >
      {visible.map((creator) => (
        <span key={creator.slug} title={creator.name}>
          <CreatorThumbnail imageSrc={creator.profileImage} className={`${size} border-2 border-background`} />
        </span>
      ))}
      {overflow > 0 ? (
        <span
          className={`grid ${size} place-items-center rounded-full border-2 border-background bg-foreground text-[10px] font-semibold text-background`}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
