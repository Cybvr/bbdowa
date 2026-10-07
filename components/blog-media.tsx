"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { EmptyThumbnail, ImageWithFallback } from "@/components/empty-thumbnail";
import type { BlogMediaType } from "@/lib/blog";

export function BlogMedia({
  src,
  type = "image",
  alt = "",
  className = "",
  mediaClassName = "h-full w-full object-cover",
  controls = false,
  label,
}: {
  src?: string | null;
  type?: BlogMediaType;
  alt?: string;
  className?: string;
  mediaClassName?: string;
  controls?: boolean;
  label?: string;
}) {
  const [videoFailed, setVideoFailed] = React.useState(false);

  if (!src || videoFailed) {
    return <EmptyThumbnail className={className} label={label ?? "No cover media available"} />;
  }

  if (type === "video") {
    return (
      <div className={`relative overflow-hidden bg-black ${className}`}>
        <video
          src={src}
          aria-label={alt || label || "Blog video"}
          className={mediaClassName}
          controls={controls}
          muted={!controls}
          playsInline
          preload="metadata"
          onError={() => setVideoFailed(true)}
        />
        {!controls ? (
          <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white shadow-lg">
            <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-muted ${className}`}>
      <ImageWithFallback
        src={src}
        alt={alt}
        className={mediaClassName}
        fallbackClassName="h-full w-full"
        fallbackLabel={label}
      />
    </div>
  );
}
