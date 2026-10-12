"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ImageWithFallback } from "@/components/empty-thumbnail";
import { DashboardCard } from "@/components/dashboard-card";
import { ClientWorkspaceHeading } from "@/components/client-workspace-heading";
import { FilterBar, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { TABLE_ACTION_MENU_TRIGGER, TableActionsCell } from "@/components/dashboard/table-row-actions";
import { JobMediaAddAction, JobMediaDeleteAction } from "@/components/job-media-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { plural } from "@/lib/format";
import type { JobMedia } from "@/lib/jobs";

type MediaSort = "recent" | "name";

const MEDIA_SORTS: SortOption<MediaSort>[] = [
  { key: "recent", label: "Added order" },
  { key: "name", label: "Name (A–Z)" },
];

const LIGHTBOX_BUTTON = "absolute grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

function MediaPreview({ media, className }: { media: JobMedia; className: string }) {
  return media.kind === "video"
    ? <video className={className} preload="metadata" poster={media.poster} muted aria-label={media.alt}><source src={media.src} type="video/mp4" /></video>
    : <ImageWithFallback src={media.src} alt={media.alt} className={className} />;
}

/** A job's images and videos: searchable cards or table, with a lightbox. */
export function JobMediaPanel({ jobSlug, jobName, initialMedia, canManage }: { jobSlug: string; jobName: string; initialMedia: JobMedia[]; canManage: boolean }) {
  const [mediaItems, setMediaItems] = React.useState(initialMedia);
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<MediaSort>("recent");
  const [view, setView] = React.useState<ViewMode>("cards");
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const visible = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = mediaItems
      .map((media, mediaIndex) => ({ media, mediaIndex }))
      .filter(({ media }) => !query || media.alt.toLowerCase().includes(query) || media.src.toLowerCase().includes(query));
    return sort === "name" ? filtered.sort((a, b) => a.media.alt.localeCompare(b.media.alt)) : filtered;
  }, [mediaItems, search, sort]);

  const deleteAction = (mediaIndex: number, table = false) => canManage
    ? <JobMediaDeleteAction jobSlug={jobSlug} jobName={jobName} mediaItems={mediaItems} mediaIndex={mediaIndex} onSaved={setMediaItems} onError={setError} triggerClassName={table ? TABLE_ACTION_MENU_TRIGGER : undefined} />
    : null;
  const step = (offset: number) => setSelectedIndex((current) => current === null ? null : (current + offset + mediaItems.length) % mediaItems.length);
  const selected = selectedIndex !== null ? mediaItems[selectedIndex] : null;

  return <section className="pt-6">
    <ClientWorkspaceHeading title="Media" actions={canManage ? <JobMediaAddAction jobSlug={jobSlug} jobName={jobName} mediaItems={mediaItems} onSaved={setMediaItems} /> : null} />
    <FilterBar
      panelId={`job-${jobSlug}-media-filter`}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search media"
      sortOptions={MEDIA_SORTS}
      activeSort={sort}
      onSortChange={setSort}
      resultCount={plural(visible.length, "media item")}
      view={view}
      onViewChange={setView}
      className="my-4"
    />
    {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
    {visible.length ? view === "cards" ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {visible.map(({ media, mediaIndex }) => (
        <DashboardCard key={`${media.src}-${mediaIndex}`} className="h-full" actions={deleteAction(mediaIndex)}>
          <button type="button" onClick={() => setSelectedIndex(mediaIndex)} className="aspect-square w-full overflow-hidden bg-muted text-left" aria-label={`Open ${media.alt}`}>
            <MediaPreview media={media} className="h-full w-full object-cover" />
          </button>
        </DashboardCard>
      ))}
    </div> : <div className="overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>Media</TableHead><TableHead>Source</TableHead>{canManage ? <TableHead className="w-20 text-right">Actions</TableHead> : null}</TableRow></TableHeader>
        <TableBody>
          {visible.map(({ media, mediaIndex }) => <TableRow key={`${media.src}-${mediaIndex}`}>
            <TableCell><button type="button" onClick={() => setSelectedIndex(mediaIndex)} className="flex items-center gap-3 text-left font-semibold text-foreground hover:text-primary"><MediaPreview media={media} className="h-12 w-16 rounded-md object-cover" />{media.alt || "Untitled media"}</button></TableCell>
            <TableCell className="max-w-[320px] truncate text-sm text-muted-foreground">{media.src}</TableCell>
            {canManage ? <TableActionsCell label={`Actions for ${media.alt || "media"}`} menu={deleteAction(mediaIndex, true)} /> : null}
          </TableRow>)}
        </TableBody>
      </Table>
    </div> : <p className="py-10 text-sm text-muted-foreground">{mediaItems.length ? "No media matches your search." : "No media has been added to this job."}</p>}

    {selected ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={selected.alt} onClick={() => setSelectedIndex(null)}>
      <button type="button" aria-label="Close media" onClick={() => setSelectedIndex(null)} className={`${LIGHTBOX_BUTTON} right-4 top-4 sm:right-6 sm:top-6`}><X className="h-5 w-5" aria-hidden="true" /></button>
      {mediaItems.length > 1 ? <>
        <button type="button" aria-label="Previous media" onClick={(event) => { event.stopPropagation(); step(-1); }} className={`${LIGHTBOX_BUTTON} left-4 top-1/2 -translate-y-1/2 sm:left-6`}><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
        <button type="button" aria-label="Next media" onClick={(event) => { event.stopPropagation(); step(1); }} className={`${LIGHTBOX_BUTTON} right-4 top-1/2 -translate-y-1/2 sm:right-6`}><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
      </> : null}
      <div className="max-h-full max-w-full" onClick={(event) => event.stopPropagation()}>
        {selected.kind === "video"
          ? <video key={selected.src} className="max-h-[calc(100vh-6rem)] max-w-[calc(100vw-6rem)] rounded-xl" controls autoPlay poster={selected.poster} aria-label={selected.alt}><source src={selected.src} type="video/mp4" />Your browser does not support this video.</video>
          : <ImageWithFallback src={selected.src} alt={selected.alt} className="max-h-[calc(100vh-6rem)] max-w-[calc(100vw-6rem)] rounded-xl object-contain" />}
      </div>
    </div> : null}
  </section>;
}
