"use client";

import { ImageWithFallback } from "@/components/empty-thumbnail";

export function CreatorThumbnail({
  imageSrc,
  className = "",
  imageClassName = "h-full w-full object-cover",
  rounded = true,
  avatarSeed,
}: {
  imageSrc?: string | null;
  className?: string;
  imageClassName?: string;
  rounded?: boolean;
  avatarSeed?: string;
}) {
  return (
    <span aria-hidden="true" className={`grid flex-none place-items-center overflow-hidden ${rounded ? "rounded-full" : "rounded-none"} ${className}`}>
      <ImageWithFallback src={imageSrc} alt="" className={imageClassName} fallbackClassName="h-full w-full" fallbackSeed={avatarSeed} />
    </span>
  );
}
