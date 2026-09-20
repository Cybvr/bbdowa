"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { createGlyphAvatarDataUri } from "@/lib/avatar";

export const DASHBOARD_IMAGE_PLACEHOLDER = "/images/bbdowa-red-pattern-placeholder.png";

export interface EmptyThumbnailProps {
  className?: string;
  iconClassName?: string;
  label?: string;
}

/**
 * Shared BBDO pattern used whenever dashboard imagery is unavailable.
 */
export function EmptyThumbnail({
  className = "",
  iconClassName = "w-7 h-7 text-white/70",
  label,
}: EmptyThumbnailProps) {
  return (
    <span
      role="img"
      aria-label={label ?? "No image available"}
      className={`relative flex h-full w-full select-none flex-col items-center justify-center overflow-hidden bg-primary ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${DASHBOARD_IMAGE_PLACEHOLDER})` }}
      />
      <span aria-hidden="true" className="absolute inset-0 bg-black/10" />
      <ImageIcon className={`relative ${iconClassName} stroke-[1.5]`} />
      {label && (
        <span className="relative mt-2 px-3 text-center font-mono text-xs text-white/80">
          {label}
        </span>
      )}
    </span>
  );
}

export interface ImageWithFallbackProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
  fallbackLabel?: string;
  fallbackSeed?: string;
}

/**
 * Image component with automatic placeholder detection and error handling.
 * Renders EmptyThumbnail whenever src is empty, points to a placeholder, or fails to load.
 */
export function ImageWithFallback({
  src,
  alt,
  className = "w-full h-full object-cover",
  fallbackClassName,
  iconClassName,
  fallbackLabel,
  fallbackSeed,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  const isMissingOrPlaceholder =
    !src ||
    src.trim() === "" ||
    src.includes("project-placeholder");

  if (isMissingOrPlaceholder || hasError) {
    if (fallbackSeed) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={createGlyphAvatarDataUri(fallbackSeed)}
          alt={alt ?? ""}
          className={className}
        />
      );
    }

    return (
      <EmptyThumbnail
        className={fallbackClassName ?? "w-full h-full"}
        iconClassName={iconClassName}
        label={fallbackLabel}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
