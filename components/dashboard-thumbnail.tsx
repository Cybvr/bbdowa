"use client";

import { ImageWithFallback } from "@/components/empty-thumbnail";

export function DashboardThumbnail({
  src,
  alt = "",
  className = "",
  imageClassName = "h-full w-full object-cover",
  label,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  label?: string;
}) {
  return (
    <div className={`overflow-hidden bg-muted ${className}`}>
      <ImageWithFallback
        src={src}
        alt={alt}
        className={imageClassName}
        fallbackClassName="h-full w-full"
        fallbackLabel={label}
      />
    </div>
  );
}
