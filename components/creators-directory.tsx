"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import { FaBehance, FaGlobe } from "react-icons/fa";
import { FiBookmark, FiCheck, FiChevronDown, FiEdit2, FiFilter, FiGrid, FiList, FiMail, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { ImageWithFallback } from "@/components/empty-thumbnail";
import { Badge } from "@/components/dashboard/ui";
import { SocialIcon, type SocialIconName } from "@/components/social-icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LoginDialog } from "@/components/login-dialog";
import type { Creator } from "@/lib/users";
import { baseCity, creatorAddedTimestamp, creatorHref, isCreatorNew, rateFloorNgn } from "@/lib/users";

const AVAILABILITY_DOT: Record<Creator["availability"], string> = {
  open: "bg-[#1a9a4a]",
  busy: "bg-[#d94a3a]",
  unconfirmed: "bg-muted-foreground",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

function Avatar({ imageSrc, className = "" }: { imageSrc?: string | null; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid flex-none place-items-center overflow-hidden rounded-full ${className}`}
    >
      <ImageWithFallback src={imageSrc} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
    </span>
  );
}

type PlatformLink = { label: string; href: string | null; Icon?: IconType; brand?: SocialIconName };

function platformLinks(creator: Creator): PlatformLink[] {
  const portfolioIsBehance = creator.portfolio?.toLowerCase().includes("behance.net") ?? false;
  return [
    { label: "Website", href: portfolioIsBehance ? null : creator.portfolio, Icon: FaGlobe },
    { label: "LinkedIn", href: creator.linkedin ?? null, brand: "LinkedIn" },
    { label: "Behance", href: creator.behance ?? (portfolioIsBehance ? creator.portfolio : null), Icon: FaBehance },
    { label: "Instagram", href: creator.instagram ?? null, brand: "Instagram" },
  ];
}

const PILL =
  "inline-block rounded-full bg-foreground/[0.07] px-2.5 py-1 text-[11px] leading-none text-foreground";

const RATE_STEP = 1_000;
const RATE_MIN = 0;
const RATE_CAP = 100_000;
const PAGE_SIZE = 12;
const LEGACY_CREATORS_STORAGE_KEY = "bbdowa-my-creator-list";
const CREATOR_LISTS_STORAGE_KEY = "bbdowa-creator-lists";

type CreatorList = { id: string; name: string; slugs: string[] };

function newListId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
type AddedFilter = "all" | "recent" | "older";
type AddedSort = "popular" | "newest" | "oldest";
type DirectoryView = "list" | "cards";
type DirectoryTab = "all" | "my-lists";
type VettedFilter = "all" | "vetted" | "not-vetted";
type GenderFilter = "all" | "Female" | "Male";

type DirectoryUrlState = {
  search: string;
  category: string;
  location: string;
  availability: Creator["availability"] | "all";
  gender: GenderFilter;
  maxRate: number;
  added: AddedFilter;
  vetted: VettedFilter;
  sort: AddedSort;
  view: DirectoryView;
  tab: DirectoryTab;
  tags: string[];
  page: number;
};

function readDirectoryUrlState(categories: string[], locations: string[], tags: string[]): DirectoryUrlState {
  const defaults: DirectoryUrlState = {
    search: "",
    category: "all",
    location: "all",
    availability: "all",
    gender: "all",
    maxRate: RATE_CAP,
    added: "all",
    vetted: "all",
    sort: "popular",
    view: "cards",
    tab: "all",
    tags: [],
    page: 1,
  };

  if (typeof window === "undefined") return defaults;

  const params = new URLSearchParams(window.location.search);
  const rawRate = params.has("maxRate") ? Number(params.get("maxRate")) : NaN;
  const rawPage = Number(params.get("page"));
  const category = params.get("category");
  const location = params.get("location");
  const availability = params.get("availability");
  const gender = params.get("gender");
  const added = params.get("added");
  const vetted = params.get("vetted");
  const sort = params.get("sort");
  const view = params.get("view");
  const tab = params.get("tab");
  const selectedTags = (params.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag && tags.includes(tag));

  return {
    search: params.get("search") ?? defaults.search,
    category: category && categories.includes(category) ? category : defaults.category,
    location: location && locations.includes(location) ? location : defaults.location,
    availability:
      availability === "open" || availability === "busy" || availability === "unconfirmed"
        ? availability
        : defaults.availability,
    gender: gender === "female" ? "Female" : gender === "male" ? "Male" : defaults.gender,
    maxRate:
      Number.isFinite(rawRate)
        ? Math.min(RATE_CAP, Math.max(RATE_MIN, Math.round(rawRate / RATE_STEP) * RATE_STEP))
        : defaults.maxRate,
    added: added === "recent" || added === "older" ? added : defaults.added,
    vetted: vetted === "vetted" || vetted === "not-vetted" ? vetted : defaults.vetted,
    sort: sort === "popular" || sort === "newest" || sort === "oldest" ? sort : defaults.sort,
    view: view === "list" ? view : defaults.view,
    tab: tab === "my-lists" ? tab : defaults.tab,
    tags: selectedTags,
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : defaults.page,
  };
}

function writeDirectoryUrl(state: DirectoryUrlState) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const params = url.searchParams;

  if (state.search.trim()) params.set("search", state.search.trim());
  else params.delete("search");

  if (state.category !== "all") params.set("category", state.category);
  else params.delete("category");

  if (state.location !== "all") params.set("location", state.location);
  else params.delete("location");

  if (state.availability !== "all") params.set("availability", state.availability);
  else params.delete("availability");

  if (state.gender !== "all") params.set("gender", state.gender.toLowerCase());
  else params.delete("gender");

  if (state.maxRate < RATE_CAP) params.set("maxRate", String(state.maxRate));
  else params.delete("maxRate");

  if (state.added !== "all") params.set("added", state.added);
  else params.delete("added");

  if (state.vetted !== "all") params.set("vetted", state.vetted);
  else params.delete("vetted");

  if (state.sort !== "popular") params.set("sort", state.sort);
  else params.delete("sort");

  if (state.view !== "cards") params.set("view", state.view);
  else params.delete("view");

  if (state.tab !== "all") params.set("tab", state.tab);
  else params.delete("tab");

  if (state.tags.length > 0) params.set("tags", state.tags.join(","));
  else params.delete("tags");

  if (state.page > 1) params.set("page", String(state.page));
  else params.delete("page");

  url.search = params.toString();
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function Stat({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] leading-none text-foreground">{children}</span>;
}

type FilterControlsProps = {
  location: string;
  setLocation: (value: string) => void;
  availability: Creator["availability"] | "all";
  setAvailability: (value: Creator["availability"] | "all") => void;
  gender: GenderFilter;
  setGender: (value: GenderFilter) => void;
  maxRate: number;
  setMaxRate: (value: number) => void;
  added: AddedFilter;
  setAdded: (value: AddedFilter) => void;
  vetted: VettedFilter;
  setVetted: (value: VettedFilter) => void;
  tags: string[];
  tagCounts: Record<string, number>;
  selectedTags: string[];
  setSelectedTags: (value: string[]) => void;
  locations: string[];
  activeFilterCount: number;
  onClear: () => void;
};

function FilterAccordion({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-border last:border-b-0">
      <summary className="flex min-h-[38px] cursor-pointer list-none items-center justify-between gap-2 text-[13px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <span>{label}</span>
        <span className="flex min-w-0 items-center gap-1.5 text-right text-[11px] text-muted-foreground">
          <span className="truncate">{value}</span>
          <FiChevronDown aria-hidden="true" className="h-3.5 w-3.5 flex-none transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="space-y-1 pb-2 pt-1.5">{children}</div>
    </details>
  );
}

function FilterOption({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground">
      <input type="checkbox" checked={selected} onChange={onClick} className="h-4 w-4 cursor-pointer accent-primary" />
      <span>{children}</span>
    </label>
  );
}

function FilterControls({
  location,
  setLocation,
  availability,
  setAvailability,
  gender,
  setGender,
  maxRate,
  setMaxRate,
  added,
  setAdded,
  vetted,
  setVetted,
  tags,
  tagCounts,
  selectedTags,
  setSelectedTags,
  locations,
  activeFilterCount,
  onClear,
}: FilterControlsProps) {
  return (
    <div className="flex flex-col gap-2">
      <FilterAccordion label="Location" value={location === "all" ? "All" : location}>
        <FilterOption selected={location === "all"} onClick={() => setLocation("all")}>
          All locations
        </FilterOption>
        {locations.map((key) => (
          <FilterOption key={key} selected={location === key} onClick={() => setLocation(location === key ? "all" : key)}>
            {key}
          </FilterOption>
        ))}
      </FilterAccordion>
      <FilterAccordion
        label="Availability"
        value={availability === "all" ? "Any" : availability === "unconfirmed" ? "Unconfirmed" : availability === "open" ? "Open" : "Busy"}
      >
        <FilterOption selected={availability === "all"} onClick={() => setAvailability("all")}>Any availability</FilterOption>
        <FilterOption selected={availability === "open"} onClick={() => setAvailability(availability === "open" ? "all" : "open")}>Open</FilterOption>
        <FilterOption selected={availability === "busy"} onClick={() => setAvailability(availability === "busy" ? "all" : "busy")}>Busy</FilterOption>
        <FilterOption selected={availability === "unconfirmed"} onClick={() => setAvailability(availability === "unconfirmed" ? "all" : "unconfirmed")}>Unconfirmed</FilterOption>
      </FilterAccordion>
      <FilterAccordion label="Gender" value={gender === "all" ? "Any" : gender}>
        <FilterOption selected={gender === "all"} onClick={() => setGender("all")}>Any gender</FilterOption>
        <FilterOption selected={gender === "Female"} onClick={() => setGender(gender === "Female" ? "all" : "Female")}>Female</FilterOption>
        <FilterOption selected={gender === "Male"} onClick={() => setGender(gender === "Male" ? "all" : "Male")}>Male</FilterOption>
      </FilterAccordion>
      <FilterAccordion label="Added date" value={added === "all" ? "Any" : added === "recent" ? "Recent" : "Older"}>
        <FilterOption selected={added === "all"} onClick={() => setAdded("all")}>Any added date</FilterOption>
        <FilterOption selected={added === "recent"} onClick={() => setAdded(added === "recent" ? "all" : "recent")}>Added in the last 30 days</FilterOption>
        <FilterOption selected={added === "older"} onClick={() => setAdded(added === "older" ? "all" : "older")}>Added earlier</FilterOption>
      </FilterAccordion>
      <FilterAccordion label="Vetting" value={vetted === "all" ? "Any" : vetted === "vetted" ? "Vetted" : "Not vetted"}>
        <FilterOption selected={vetted === "all"} onClick={() => setVetted("all")}>Any vetting status</FilterOption>
        <FilterOption selected={vetted === "vetted"} onClick={() => setVetted(vetted === "vetted" ? "all" : "vetted")}>Vetted only</FilterOption>
        <FilterOption selected={vetted === "not-vetted"} onClick={() => setVetted(vetted === "not-vetted" ? "all" : "not-vetted")}>Not vetted</FilterOption>
      </FilterAccordion>
      <FilterAccordion label="Tags" value={selectedTags.length ? `${selectedTags.length} selected` : "Any"}>
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {tags.map((tag) => {
            const checked = selectedTags.includes(tag);
            return (
              <label key={tag} className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setSelectedTags(checked ? selectedTags.filter((item) => item !== tag) : [...selectedTags, tag])}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate">{tag}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{tagCounts[tag]}</span>
                </span>
              </label>
            );
          })}
        </div>
      </FilterAccordion>
      <label className="flex flex-col gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em]">
        <span className="flex items-center justify-between text-muted-foreground">
          <span>₦0</span>
          <span>₦100k</span>
        </span>
        <input
          type="range"
          min={RATE_MIN}
          max={RATE_CAP}
          step={RATE_STEP}
          value={maxRate}
          onChange={(event) => setMaxRate(Number(event.target.value))}
          aria-label="Maximum day rate in naira"
          className="w-full accent-primary"
        />
      </label>
      {activeFilterCount > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="min-h-[40px] cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2 text-left text-[13px] font-medium text-muted-foreground hover:border-foreground hover:text-foreground focus-visible:outline-none"
        >
          Clear filters ({activeFilterCount})
        </button>
      ) : null}
    </div>
  );
}

function ViewToggle({ view, setView }: { view: DirectoryView; setView: (value: DirectoryView) => void }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-background p-1" role="group" aria-label="Creator view">
      <button
        type="button"
        aria-label="List view"
        aria-pressed={view === "list"}
        title="List view"
        onClick={() => setView("list")}
        className={`grid h-7 w-7 cursor-pointer place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          view === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <FiList aria-hidden="true" className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Card view"
        aria-pressed={view === "cards"}
        title="Card view"
        onClick={() => setView("cards")}
        className={`grid h-7 w-7 cursor-pointer place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          view === "cards" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <FiGrid aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

function SortSelect({ sort, setSort }: { sort: AddedSort; setSort: (value: AddedSort) => void }) {
  return (
    <label className="flex shrink-0 items-center">
      <select
        value={sort}
        onChange={(event) => setSort(event.target.value as AddedSort)}
        aria-label="Sort creators"
        className="h-9 min-w-[132px] cursor-pointer appearance-none rounded-xl border border-border bg-background px-4 text-[13px] font-medium text-foreground focus-visible:border-primary focus-visible:outline-none"
      >
        <option value="popular">Popular</option>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </label>
  );
}

function CreatorDiscoveryBar({
  search,
  setSearch,
  categories,
  selectedCategory,
  setCategory,
  sort,
  setSort,
  onJoinClick,
}: {
  search: string;
  setSearch: (value: string) => void;
  categories: string[];
  selectedCategory: string;
  setCategory: (value: string) => void;
  sort: AddedSort;
  setSort: (value: AddedSort) => void;
  onJoinClick?: () => void;
}) {
  const toggleCategory = (category: string) => {
    setCategory(selectedCategory === category ? "all" : category);
  };

  return (
    <div className="mb-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form role="search" onSubmit={(event) => event.preventDefault()} className="relative min-w-0 flex-1">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="What kind of creator are you looking for?"
          aria-label="Search creators"
          className="h-16 w-full rounded-full border border-border bg-muted/60 pl-6 pr-20 text-[15px] font-medium text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none sm:h-[72px] sm:text-base"
        />
        <button
          type="submit"
          aria-label="Search creators"
          className="absolute right-2 top-2 grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-14 sm:w-14"
        >
          <FiSearch aria-hidden="true" className="h-6 w-6" />
        </button>
        </form>

        <button
          type="button"
          onClick={onJoinClick}
          className="inline-flex h-16 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-8 text-[15px] font-bold text-primary-foreground no-underline transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-[72px] sm:text-base"
        >
          <FiPlus aria-hidden="true" className="h-5 w-5" />
          Join Bantaba
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 sm:mt-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[13px] font-bold text-foreground">Categories:</span>
          <div
            className="flex min-w-0 gap-2 overflow-x-auto pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Creator categories"
          >
            {["all", ...categories].map((category) => {
              const label = category === "all" ? "All" : category;
              const selected = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCategory(category)}
                  className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:border-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <SortSelect sort={sort} setSort={setSort} />
      </div>
    </div>
  );
}

function CreatorTabs({
  tab,
  setTab,
  allCount,
  listCount,
}: {
  tab: DirectoryTab;
  setTab: (value: DirectoryTab) => void;
  allCount: number;
  listCount: number;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4 border-b border-border sm:mb-5">
      <div className="flex items-center gap-5" role="tablist" aria-label="Creator lists">
        {([
          ["all", "All", allCount],
          ["my-lists", "Lists", listCount],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 px-0.5 pb-2 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              tab === key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {label}
            <span className="text-[11px] font-medium text-muted-foreground">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CreatorSelectionButton({
  creator,
  selected,
  onToggle,
  className = "h-8 w-8",
}: {
  creator: Creator;
  selected: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={selected ? `Edit the lists ${creator.name} is in` : `Add ${creator.name} to a list`}
      aria-pressed={selected}
      title={selected ? "Edit lists" : "Add to a list"}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={`grid ${className} shrink-0 cursor-pointer place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        selected
          ? "border-foreground bg-muted text-foreground"
          : "border-border bg-background/90 text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
    >
      <FiBookmark aria-hidden="true" className={`h-4 w-4 ${selected ? "fill-current" : ""}`} />
    </button>
  );
}

const LIST_INPUT =
  "min-h-[40px] w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

function ListBar({
  lists,
  activeListId,
  setActiveListId,
  onNewList,
  onRename,
  onDelete,
}: {
  lists: CreatorList[];
  activeListId: string | null;
  setActiveListId: (value: string) => void;
  onNewList: () => void;
  onRename: (listId: string, name: string) => void;
  onDelete: (listId: string) => void;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const commitRename = () => {
    if (renamingId) onRename(renamingId, draftName);
    setRenamingId(null);
  };

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {lists.map((list) => {
        const active = list.id === activeListId;

        if (renamingId === list.id) {
          return (
            <input
              key={list.id}
              autoFocus
              value={draftName}
              aria-label="List name"
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitRename();
                if (event.key === "Escape") setRenamingId(null);
              }}
              className={`${LIST_INPUT} w-40`}
            />
          );
        }

        return (
          <span
            key={list.id}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
              active ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:border-foreground"
            }`}
          >
            <button
              type="button"
              aria-pressed={active}
              onClick={() => setActiveListId(list.id)}
              className="cursor-pointer bg-transparent p-0 text-inherit focus-visible:outline-none focus-visible:underline"
            >
              {list.name}
              <span className={`ml-2 text-[11px] ${active ? "text-background/70" : "text-muted-foreground"}`}>{list.slugs.length}</span>
            </button>
            {active ? (
              <>
                <button
                  type="button"
                  title="Rename list"
                  aria-label={`Rename ${list.name}`}
                  onClick={() => {
                    setDraftName(list.name);
                    setRenamingId(list.id);
                  }}
                  className="cursor-pointer bg-transparent p-0 text-inherit opacity-70 hover:opacity-100 focus-visible:outline-none"
                >
                  <FiEdit2 aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Delete list"
                  aria-label={`Delete ${list.name}`}
                  onClick={() => onDelete(list.id)}
                  className="cursor-pointer bg-transparent p-0 text-inherit opacity-70 hover:opacity-100 focus-visible:outline-none"
                >
                  <FiTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </>
            ) : null}
          </span>
        );
      })}
      <button
        type="button"
        onClick={onNewList}
        className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border border-dashed border-border bg-transparent px-3.5 py-2 text-[13px] font-medium hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <FiPlus aria-hidden="true" className="h-4 w-4" />
        New list
      </button>
    </div>
  );
}

function ListDialog({
  open,
  onOpenChange,
  creator,
  lists,
  onToggleCreator,
  onCreateList,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  creator: Creator | null;
  lists: CreatorList[];
  onToggleCreator: (listId: string, slug: string) => void;
  onCreateList: (name: string, slugs: string[]) => void;
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  const submitNewList = () => {
    if (!name.trim()) return;
    onCreateList(name, creator ? [creator.slug] : []);
    setName("");
    if (!creator) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg sm:text-xl">
            {creator ? `Add ${creator.name} to a list` : "New list"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {creator && lists.length > 0 ? (
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {lists.map((list) => {
                const included = list.slugs.includes(creator.slug);
                return (
                  <button
                    key={list.id}
                    type="button"
                    aria-pressed={included}
                    onClick={() => onToggleCreator(list.id, creator.slug)}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 text-left text-[13px] hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <span className="min-w-0 truncate font-medium">{list.name}</span>
                    <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {list.slugs.length}
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full border ${
                          included ? "border-foreground bg-foreground text-background" : "border-border"
                        }`}
                      >
                        {included ? <FiCheck aria-hidden="true" className="h-3 w-3" /> : null}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <input
              value={name}
              aria-label="New list name"
              placeholder="New list name"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitNewList();
                }
              }}
              className={LIST_INPUT}
            />
            <button
              type="button"
              onClick={submitNewList}
              disabled={!name.trim()}
              className="min-h-[40px] shrink-0 cursor-pointer rounded-lg border border-foreground bg-foreground px-3.5 py-2 text-[13px] font-medium text-background disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Create
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreatorCard({
  creator,
  selected,
  onToggle,
}: {
  creator: Creator;
  selected: boolean;
  onToggle: () => void;
}) {
  const links = platformLinks(creator).filter((platform) => platform.href);

  return (
    <article
      className="group relative block self-start overflow-hidden rounded-sm border border-border bg-background text-foreground no-underline transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <Link
        href={creatorHref(creator.slug)}
        aria-label={creator.name}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <ImageWithFallback
            src={creator.profileImage}
            alt={`${creator.name} profile image`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            fallbackClassName="h-full w-full"
          />
          <div className="absolute inset-x-2 top-2 flex flex-wrap items-center justify-end gap-1.5">
            {isCreatorNew(creator) ? <Badge tone="active">NEW</Badge> : null}
            {creator.vetted ? <Badge tone="inverse">VETTED</Badge> : null}
          </div>
        </div>
      </Link>
      <CreatorSelectionButton
        creator={creator}
        selected={selected}
        onToggle={onToggle}
        className="absolute left-2 top-2 z-10 h-7 w-7"
      />

      <div className="p-2">
        <h2 className="m-0 line-clamp-2 text-[13px] font-semibold leading-[1.2] tracking-tight">
          <Link
            href={creatorHref(creator.slug)}
            className="text-foreground no-underline group-hover:text-primary focus-visible:outline-none focus-visible:text-primary"
          >
            {creator.name}
          </Link>
          <span
            role="img"
            aria-label={creator.availability}
            title={creator.availability}
            className={`ml-1.5 inline-block h-1.5 w-1.5 align-middle rounded-full ${AVAILABILITY_DOT[creator.availability]}`}
          />
        </h2>
        <p className="mb-0 mt-1 line-clamp-2 text-[11px] leading-[1.35] text-muted-foreground">
          {creator.niche ?? creator.craftNote}
        </p>

        {links.length > 0 || creator.email ? (
          <div className="mt-1.5 flex items-center gap-1">
            {links.map(({ label, href, Icon, brand }) => (
              <a
                key={label}
                href={href!}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${creator.name} on ${label}`}
                title={label}
                className="grid h-6 w-6 place-items-center rounded-full border border-border text-foreground transition hover:border-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {brand ? <SocialIcon name={brand} className="h-3 w-3" /> : Icon ? <Icon aria-hidden="true" className="h-3 w-3" /> : null}
              </a>
            ))}
            {creator.email ? (
              <a
                href={`mailto:${creator.email}`}
                aria-label={`Email ${creator.name}`}
                title={creator.email}
                className="grid h-6 w-6 place-items-center rounded-full border border-border text-foreground transition hover:border-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <FiMail aria-hidden="true" className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        ) : null}

      </div>
    </article>
  );
}

export function CreatorDirectory({
  creators,
  categories,
  locations,
}: {
  creators: Creator[];
  categories: string[];
  locations: string[];
}) {
  const router = useRouter();
  const creatorTagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    creators.forEach((creator) => {
      creator.tags.forEach((tag) => {
        counts[tag] = (counts[tag] ?? 0) + 1;
      });
    });
    return counts;
  }, [creators]);
  const creatorTags = useMemo(() => Object.keys(creatorTagCounts).sort((a, b) => a.localeCompare(b)), [creatorTagCounts]);
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [availability, setAvailability] = useState<Creator["availability"] | "all">("all");
  const [gender, setGender] = useState<GenderFilter>("all");
  const [maxRate, setMaxRate] = useState<number>(RATE_CAP);
  const [added, setAdded] = useState<AddedFilter>("all");
  const [vetted, setVetted] = useState<VettedFilter>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<AddedSort>("popular");
  const [view, setView] = useState<DirectoryView>("cards");
  const [tab, setTab] = useState<DirectoryTab>("all");
  const [lists, setLists] = useState<CreatorList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [listDialogCreator, setListDialogCreator] = useState<Creator | null>(null);
  const [listsInitialized, setListsInitialized] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [urlStateInitialized, setUrlStateInitialized] = useState(false);

  const activeList = lists.find((list) => list.id === activeListId) ?? null;
  const savedSlugs = useMemo(() => new Set(lists.flatMap((list) => list.slugs)), [lists]);

  const popularityScore = (creator: Creator) =>
    creator.tags.reduce((total, tag) => total + (creatorTagCounts[tag] ?? 0), 0);

  const visible = creators.filter((creator) => {
    const query = search.trim().toLowerCase();
    const addedTimestamp = creatorAddedTimestamp(creator);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const searchable = [
      creator.name,
      creator.category,
      creator.location,
      ...creator.tags,
      ...(creator.workHistory?.flatMap((entry) => [entry.role, entry.company]) ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!query || searchable.includes(query)) &&
      (category === "all" || creator.category === category) &&
      (location === "all" || baseCity(creator.location) === location) &&
      (availability === "all" || creator.availability === availability) &&
      (gender === "all" || creator.gender === gender) &&
      (added === "all" || (added === "recent" ? addedTimestamp >= thirtyDaysAgo : addedTimestamp < thirtyDaysAgo)) &&
      (vetted === "all" || (vetted === "vetted" ? creator.vetted === true : creator.vetted !== true)) &&
      (selectedTags.length === 0 || selectedTags.some((tag) => creator.tags.includes(tag))) &&
      (tab === "all" || (activeList?.slugs.includes(creator.slug) ?? false)) &&
      (maxRate >= RATE_CAP || rateFloorNgn(creator) <= maxRate)
    );
  }).sort((a, b) => {
    if (sort === "popular") {
      const popularityDifference = popularityScore(b) - popularityScore(a);
      return popularityDifference || creatorAddedTimestamp(b) - creatorAddedTimestamp(a);
    }
    const difference = creatorAddedTimestamp(b) - creatorAddedTimestamp(a);
    return sort === "newest" ? difference : -difference;
  });

  const activeFilterCount = [
    search.trim(),
    category !== "all" ? category : "",
    location !== "all" ? location : "",
    availability !== "all" ? availability : "",
    gender !== "all" ? gender : "",
    maxRate < RATE_CAP ? "rate" : "",
    added !== "all" ? added : "",
    vetted !== "all" ? vetted : "",
    ...selectedTags,
  ].filter(Boolean).length;

  useEffect(() => {
    const syncFromUrl = () => {
      const next = readDirectoryUrlState(categories, locations, creatorTags);
      setSearch(next.search);
      setCategory(next.category);
      setLocation(next.location);
      setAvailability(next.availability);
      setGender(next.gender);
      setMaxRate(next.maxRate);
      setAdded(next.added);
      setVetted(next.vetted);
      setSelectedTags(next.tags);
      setSort(next.sort);
      setView(next.view);
      setTab(next.tab);
      setPage(next.page);
    };

    syncFromUrl();
    setUrlStateInitialized(true);
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [categories, creatorTags, locations]);

  useEffect(() => {
    const creatorSlugs = new Set(creators.map((creator) => creator.slug));
    const cleanSlugs = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((slug): slug is string => typeof slug === "string" && creatorSlugs.has(slug))
        : [];

    try {
      const stored = window.localStorage.getItem(CREATOR_LISTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLists(
          Array.isArray(parsed)
            ? parsed
                .filter((list) => list && typeof list.id === "string" && typeof list.name === "string")
                .map((list) => ({ id: list.id, name: list.name, slugs: cleanSlugs(list.slugs) }))
            : [],
        );
      } else {
        const legacy = cleanSlugs(JSON.parse(window.localStorage.getItem(LEGACY_CREATORS_STORAGE_KEY) ?? "[]"));
        setLists(legacy.length > 0 ? [{ id: newListId(), name: "Saved", slugs: legacy }] : []);
      }
    } catch {
      setLists([]);
    } finally {
      setListsInitialized(true);
    }
  }, [creators]);

  useEffect(() => {
    if (!listsInitialized) return;
    window.localStorage.setItem(CREATOR_LISTS_STORAGE_KEY, JSON.stringify(lists));
  }, [listsInitialized, lists]);

  useEffect(() => {
    if (lists.length === 0) {
      if (activeListId !== null) setActiveListId(null);
      return;
    }
    if (!lists.some((list) => list.id === activeListId)) setActiveListId(lists[0].id);
  }, [activeListId, lists]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageVisible = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (!urlStateInitialized) return;
    writeDirectoryUrl({ search, category, location, availability, gender, maxRate, added, vetted, sort, view, tab, tags: selectedTags, page: currentPage });
  }, [search, category, location, availability, gender, maxRate, added, vetted, sort, view, tab, selectedTags, currentPage, urlStateInitialized]);

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const updateCategory = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const updateLocation = (value: string) => {
    setLocation(value);
    setPage(1);
  };

  const updateAvailability = (value: Creator["availability"] | "all") => {
    setAvailability(value);
    setPage(1);
  };

  const updateGender = (value: GenderFilter) => {
    setGender(value);
    setPage(1);
  };

  const updateMaxRate = (value: number) => {
    setMaxRate(value);
    setPage(1);
  };

  const updateAdded = (value: AddedFilter) => {
    setAdded(value);
    setPage(1);
  };

  const updateVetted = (value: VettedFilter) => {
    setVetted(value);
    setPage(1);
  };

  const updateTags = (value: string[]) => {
    setSelectedTags(value);
    setPage(1);
  };

  const updateSort = (value: AddedSort) => {
    setSort(value);
    setPage(1);
  };

  const updateTab = (value: DirectoryTab) => {
    setTab(value);
    setPage(1);
  };

  const openListDialog = (creator: Creator | null) => {
    setListDialogCreator(creator);
    setListDialogOpen(true);
  };

  const createList = (name: string, slugs: string[]) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = newListId();
    setLists((current) => [...current, { id, name: trimmed, slugs }]);
    setActiveListId(id);
    setPage(1);
  };

  const toggleCreatorInList = (listId: string, slug: string) => {
    setLists((current) =>
      current.map((list) =>
        list.id === listId
          ? {
              ...list,
              slugs: list.slugs.includes(slug) ? list.slugs.filter((item) => item !== slug) : [...list.slugs, slug],
            }
          : list,
      ),
    );
    setPage(1);
  };

  const renameList = (listId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLists((current) => current.map((list) => (list.id === listId ? { ...list, name: trimmed } : list)));
  };

  const deleteList = (listId: string) => {
    setLists((current) => current.filter((list) => list.id !== listId));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setLocation("all");
    setAvailability("all");
    setGender("all");
    setMaxRate(RATE_CAP);
    setAdded("all");
    setVetted("all");
    setSelectedTags([]);
    setSort("popular");
    setPage(1);
  };

  return (
    <>
      <div className="mb-7">
        <section className="min-w-0">
          <CreatorDiscoveryBar
            search={search}
            setSearch={updateSearch}
            categories={categories}
            selectedCategory={category}
            setCategory={updateCategory}
            sort={sort}
            setSort={updateSort}
            onJoinClick={() => setLoginModalOpen(true)}
          />
          <CreatorTabs
            tab={tab}
            setTab={updateTab}
            allCount={creators.length}
            listCount={lists.length}
          />

          {tab === "my-lists" ? (
            <ListBar
              lists={lists}
              activeListId={activeListId}
              setActiveListId={(value) => {
                setActiveListId(value);
                setPage(1);
              }}
              onNewList={() => openListDialog(null)}
              onRename={renameList}
              onDelete={deleteList}
            />
          ) : null}

          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                aria-expanded={filterOpen}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-border bg-transparent px-3.5 py-2 text-[13px] font-medium hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <FiFilter aria-hidden="true" className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1 text-[11px] font-semibold text-background">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
              <p aria-live="polite" className="m-0 text-[13px] font-medium text-muted-foreground">
                {visible.length} {visible.length === 1 ? "person" : "people"}
              </p>
            </div>
            <ViewToggle view={view} setView={setView} />
          </div>

          <div className={view === "cards" ? "grid grid-cols-1 items-start gap-2 sm:grid-cols-2 lg:grid-cols-4" : "flex flex-col gap-3"}>
        {pageVisible.length > 0 ? pageVisible.map((creator) => (
          view === "cards" ? (
            <CreatorCard
              key={creator.slug}
              creator={creator}
              selected={savedSlugs.has(creator.slug)}
              onToggle={() => openListDialog(creator)}
            />
          ) : <article
            key={creator.slug}
            role="link"
            tabIndex={0}
            onClick={() => router.push(creatorHref(creator.slug))}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(creatorHref(creator.slug));
              }
            }}
            className="cursor-pointer rounded-2xl border border-border bg-background p-[clamp(16px,2.2vw,22px)] hover:border-foreground focus-visible:outline-none"
          >
            <div className="flex items-start gap-4 max-[640px]:flex-col max-[640px]:gap-3">
              <Link
                href={creatorHref(creator.slug)}
                aria-label={creator.name}
                className="flex-none focus-visible:outline-none"
              >
                <Avatar imageSrc={creator.profileImage} className="h-12 w-12" />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="m-0 text-[17px] font-semibold leading-none tracking-tight">
                    <Link
                      href={creatorHref(creator.slug)}
                      className="text-foreground no-underline hover:text-primary focus-visible:outline-none"
                    >
                      {creator.name}
                    </Link>
                    <span
                      role="img"
                      aria-label={creator.availability}
                      title={creator.availability}
                      className={`ml-2 inline-block h-2 w-2 align-middle rounded-full ${AVAILABILITY_DOT[creator.availability]}`}
                    />
                  </h2>
                  {isCreatorNew(creator) ? <Badge tone="active">NEW</Badge> : null}
                  {creator.vetted ? <Badge tone="inverse">VETTED</Badge> : null}
                </div>
              </div>

              <div className="flex flex-none items-center gap-2 max-[640px]:w-full">
                <CreatorSelectionButton
                  creator={creator}
                  selected={savedSlugs.has(creator.slug)}
                  onToggle={() => openListDialog(creator)}
                  className="h-9 w-9"
                />
                {platformLinks(creator)
                  .filter((platform) => platform.href)
                  .map(({ label, href, Icon, brand }) => (
                    <a
                      key={label}
                      href={href!}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${creator.name} on ${label}`}
                      title={label}
                      onClick={(event) => event.stopPropagation()}
                      className="grid h-9 w-9 flex-none place-items-center rounded-full border border-border text-foreground hover:border-foreground focus-visible:outline-none"
                    >
                      {brand ? <SocialIcon name={brand} className="h-4 w-4" /> : Icon ? <Icon aria-hidden="true" className="h-3.5 w-3.5" /> : null}
                    </a>
                  ))}
                {creator.email ? (
                  <a
                    href={`mailto:${creator.email}`}
                    aria-label={`Email ${creator.name}`}
                    title={creator.email}
                    onClick={(event) => event.stopPropagation()}
                    className="grid h-9 w-9 flex-none place-items-center rounded-full border border-border text-foreground hover:border-foreground focus-visible:outline-none"
                  >
                    <FiMail aria-hidden="true" className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              {creator.hideRate === false ? (
                <Stat>
                  <strong className="font-extrabold">{creator.dayRate}</strong> / day
                </Stat>
              ) : null}
              {creator.yearsActive !== null && (
                <Stat>
                  <strong className="font-extrabold">{creator.yearsActive}</strong> years active
                </Stat>
              )}
              <Stat>{creator.entity}</Stat>
              <Stat>Gender: {creator.gender ?? "Not provided"}</Stat>
              {creator.workedOn.length > 0 && (
                <Stat>Worked on {creator.workedOn.join(", ")}</Stat>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {creator.tags.slice(0, 6).map((tag) => (
                <span key={tag} className={PILL}>
                  {tag}
                </span>
              ))}
              {creator.tags.length > 6 && <span className={PILL}>+{creator.tags.length - 6}</span>}
            </div>

            <p className="mb-0 mt-3 line-clamp-1 max-w-[95ch] text-[14px] leading-[1.5] text-muted-foreground">
              {creator.craftNote}
            </p>
          </article>
        )) : (
          <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
            <p className="m-0 text-[14px] font-semibold">
              {tab !== "my-lists"
                ? "No creators match these filters"
                : lists.length === 0
                  ? "No lists yet"
                  : `${activeList?.name ?? "This list"} is empty`}
            </p>
            <p className="mb-0 mt-1.5 text-[13px] text-muted-foreground">
              {tab !== "my-lists"
                ? "Try changing or clearing your filters."
                : lists.length === 0
                  ? "Create a list, then add creators to it from the bookmark on their card."
                  : "Use the bookmark on a creator to add them to this list."}
            </p>
            {tab === "my-lists" ? (
              <button
                type="button"
                onClick={() => (lists.length === 0 ? openListDialog(null) : updateTab("all"))}
                className="mt-4 cursor-pointer rounded-lg border border-border px-3 py-2 text-[13px] font-medium hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {lists.length === 0 ? "Create a list" : "Browse all creators"}
              </button>
            ) : null}
          </div>
        )}
          </div>
          {totalPages > 1 ? (
            <nav aria-label="Creators pagination" className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="min-h-[40px] cursor-pointer rounded-lg border border-border bg-transparent px-3.5 py-2 text-[13px] font-medium text-muted-foreground hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[13px] font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="min-h-[40px] cursor-pointer rounded-lg border border-border bg-transparent px-3.5 py-2 text-[13px] font-medium text-muted-foreground hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          ) : null}
        </section>
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent
          side="right"
          aria-describedby={undefined}
          className="[&>button]:bg-muted [&>button]:text-foreground [&>button]:opacity-100"
        >
          <SheetHeader className="border-b border-border">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <FilterControls
              location={location}
              setLocation={updateLocation}
              availability={availability}
              setAvailability={updateAvailability}
              gender={gender}
              setGender={updateGender}
              maxRate={maxRate}
              setMaxRate={updateMaxRate}
              added={added}
              setAdded={updateAdded}
              vetted={vetted}
              setVetted={updateVetted}
              tags={creatorTags}
              tagCounts={creatorTagCounts}
              selectedTags={selectedTags}
              setSelectedTags={updateTags}
              locations={locations}
              activeFilterCount={activeFilterCount}
              onClear={clearFilters}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ListDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        creator={listDialogCreator}
        lists={lists}
        onToggleCreator={toggleCreatorInList}
        onCreateList={createList}
      />

      <LoginDialog
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />
    </>
  );
}
