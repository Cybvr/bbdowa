"use client";

import { Bookmark } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { setJobSaved, useSavedJobs } from "@/lib/firebase/saved-jobs";

/** Bookmark toggle for a job. Hidden when signed out or viewing as someone else. */
export function SaveJobButton({ slug, title }: { slug: string; title: string }) {
  const { user, isViewingAs } = useAuth();
  const saved = useSavedJobs(user?.uid).includes(slug);
  if (!user || isViewingAs) return null;
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Unsave ${title}` : `Save ${title}`}
      title={saved ? "Saved" : "Save"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void setJobSaved(user.uid, slug, !saved).catch((cause) => console.error("Unable to save job", cause));
      }}
      className="grid h-8 w-8 place-items-center rounded-full bg-background/90 text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <Bookmark aria-hidden="true" className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
    </button>
  );
}
