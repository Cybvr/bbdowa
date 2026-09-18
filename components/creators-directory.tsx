"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { FaBehance, FaGlobe } from "react-icons/fa";
import { FiFilter, FiGrid, FiList, FiMail, FiX } from "react-icons/fi";
import { ImageWithFallback } from "@/components/empty-thumbnail";
import { Badge } from "@/components/dashboard/ui";
import { SocialIcon, type SocialIconName } from "@/components/social-icon";
import type { Creator } from "@/lib/users";
import { baseCity, creatorAddedTimestamp, creatorHref, isCreatorNew, rateFloorNgn } from "@/lib/users";

const AVAILABILITY_DOT: Record<Creator["availability"], string> = {
  open: "bg-[#1a9a4a]",
  busy: "bg-[#d94a3a]",
  unconfirmed: "bg-muted-foreground",
};

const AVAILABILITY_LABEL: Record<Creator["availability"], string> = {
  open: "Open for work",
  busy: "Busy",
  unconfirmed: "Unconfirmed",
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

const SELECT =
  "min-h-[44px] cursor-pointer rounded-none border-0 border-b border-border bg-background px-0 py-2.5 font-mono text-[13px] font-medium text-foreground hover:border-foreground focus-visible:border-primary focus-visible:outline-none";

const PILL =
  "inline-block rounded-full bg-foreground/[0.07] px-2.5 py-1 text-[11px] leading-none text-foreground";

const RATE_STEP = 1_000;
const RATE_MIN = 0;
const RATE_CAP = 100_000;
const PAGE_SIZE = 12;
type AddedFilter = "all" | "recent" | "older";
type AddedSort = "newest" | "oldest";
type DirectoryView = "list" | "cards";

type DirectoryUrlState = {
  search: string;
  category: string;
  location: string;
  availability: Creator["availability"] | "all";
  maxRate: number;
  added: AddedFilter;
  sort: AddedSort;
  view: DirectoryView;
  page: number;
};

function readDirectoryUrlState(categories: string[], locations: string[]): DirectoryUrlState {
  const defaults: DirectoryUrlState = {
    search: "",
    category: "all",
    location: "all",
    availability: "all",
    maxRate: RATE_CAP,
    added: "all",
    sort: "newest",
    view: "cards",
    page: 1,
  };

  if (typeof window === "undefined") return defaults;

  const params = new URLSearchParams(window.location.search);
  const rawRate = params.has("maxRate") ? Number(params.get("maxRate")) : NaN;
  const rawPage = Number(params.get("page"));
  const category = params.get("category");
  const location = params.get("location");
  const availability = params.get("availability");
  const added = params.get("added");
  const sort = params.get("sort");
  const view = params.get("view");

  return {
    search: params.get("search") ?? defaults.search,
    category: category && categories.includes(category) ? category : defaults.category,
    location: location && locations.includes(location) ? location : defaults.location,
    availability:
      availability === "open" || availability === "busy" || availability === "unconfirmed"
        ? availability
        : defaults.availability,
    maxRate:
      Number.isFinite(rawRate)
        ? Math.min(RATE_CAP, Math.max(RATE_MIN, Math.round(rawRate / RATE_STEP) * RATE_STEP))
        : defaults.maxRate,
    added: added === "recent" || added === "older" ? added : defaults.added,
    sort: sort === "oldest" ? sort : defaults.sort,
    view: view === "list" ? view : defaults.view,
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

  if (state.maxRate < RATE_CAP) params.set("maxRate", String(state.maxRate));
  else params.delete("maxRate");

  if (state.added !== "all") params.set("added", state.added);
  else params.delete("added");

  if (state.sort !== "newest") params.set("sort", state.sort);
  else params.delete("sort");

  if (state.view !== "cards") params.set("view", state.view);
  else params.delete("view");

  if (state.page > 1) params.set("page", String(state.page));
  else params.delete("page");

  url.search = params.toString();
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function Stat({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] leading-none text-foreground">{children}</span>;
}

type FilterControlsProps = {
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  availability: Creator["availability"] | "all";
  setAvailability: (value: Creator["availability"] | "all") => void;
  maxRate: number;
  setMaxRate: (value: number) => void;
  added: AddedFilter;
  setAdded: (value: AddedFilter) => void;
  sort: AddedSort;
  setSort: (value: AddedSort) => void;
  categories: string[];
  locations: string[];
  activeFilterCount: number;
  onClear: () => void;
};

function FilterControls({
  search,
  setSearch,
  category,
  setCategory,
  location,
  setLocation,
  availability,
  setAvailability,
  maxRate,
  setMaxRate,
  added,
  setAdded,
  sort,
  setSort,
  categories,
  locations,
  activeFilterCount,
  onClear,
}: FilterControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Name, skill, company"
        aria-label="Search creators"
        className="min-h-[44px] w-full rounded-lg border border-border bg-card px-3 py-2.5 font-mono text-[13px] font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
      />
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        aria-label="Category"
        className={`${SELECT} w-full`}
      >
        <option value="all">All categories</option>
        {categories.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      <select
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        aria-label="Location"
        className={`${SELECT} w-full`}
      >
        <option value="all">All locations</option>
        {locations.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      <select
        value={availability}
        onChange={(event) => setAvailability(event.target.value as Creator["availability"] | "all")}
        aria-label="Availability"
        className={`${SELECT} w-full`}
      >
        <option value="all">Any availability</option>
        <option value="open">Open</option>
        <option value="busy">Busy</option>
        <option value="unconfirmed">Unconfirmed</option>
      </select>
      <select value={added} onChange={(event) => setAdded(event.target.value as AddedFilter)} aria-label="Added date" className={`${SELECT} w-full`}>
        <option value="all">Any added date</option>
        <option value="recent">Added in the last 30 days</option>
        <option value="older">Added earlier</option>
      </select>
      <select value={sort} onChange={(event) => setSort(event.target.value as AddedSort)} aria-label="Sort creators" className={`${SELECT} w-full`}>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
      <label className="flex flex-col gap-3 text-[11px] font-extrabold uppercase tracking-[0.12em]">
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

function CreatorCard({ creator }: { creator: Creator }) {
  const links = platformLinks(creator).filter((platform) => platform.href);

  return (
    <article
      className="group block self-start overflow-hidden rounded-2xl border border-border bg-background text-foreground no-underline transition hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <Link
        href={creatorHref(creator.slug)}
        aria-label={creator.name}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <ImageWithFallback
            src={creator.featuredImage ?? creator.profileImage}
            alt={`${creator.name} featured image`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            fallbackClassName="h-full w-full"
          />
          <div className="absolute inset-x-3 top-3 flex flex-wrap items-center justify-end gap-2">
            {isCreatorNew(creator) ? <Badge tone="active">NEW</Badge> : null}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1.5 text-[11px] font-medium leading-none text-muted-foreground">
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${AVAILABILITY_DOT[creator.availability]}`} />
              {AVAILABILITY_LABEL[creator.availability]}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-3">
        <h2 className="m-0 line-clamp-2 text-[14px] font-semibold leading-[1.2] tracking-tight">
          <Link
            href={creatorHref(creator.slug)}
            className="text-foreground no-underline group-hover:text-primary focus-visible:outline-none focus-visible:text-primary"
          >
            {creator.name}
          </Link>
        </h2>
        <p className="mb-0 mt-0.5 text-[12px] leading-snug text-muted-foreground">
          {creator.category} · {baseCity(creator.location)}
        </p>
        <p className="mb-0 mt-1.5 line-clamp-2 text-[12px] leading-[1.4] text-muted-foreground">
          {creator.niche ?? creator.craftNote}
        </p>

        {links.length > 0 || creator.email ? (
          <div className="mt-2 flex items-center gap-1.5">
            {links.map(({ label, href, Icon, brand }) => (
              <a
                key={label}
                href={href!}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${creator.name} on ${label}`}
                title={label}
                className="grid h-7 w-7 place-items-center rounded-full border border-border text-foreground transition hover:border-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {brand ? <SocialIcon name={brand} className="h-3.5 w-3.5" /> : Icon ? <Icon aria-hidden="true" className="h-3.5 w-3.5" /> : null}
              </a>
            ))}
            {creator.email ? (
              <a
                href={`mailto:${creator.email}`}
                aria-label={`Email ${creator.name}`}
                title={creator.email}
                className="grid h-7 w-7 place-items-center rounded-full border border-border text-foreground transition hover:border-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <FiMail aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2">
          <div className="min-w-0">
            <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Audience</span>
            <strong className="mt-1 block truncate text-[12px] font-semibold">{creator.followerCount ?? "Not provided"}</strong>
          </div>
          <div className="min-w-0">
            <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Contact</span>
            <strong className="mt-1 block truncate text-[12px] font-semibold">{creator.email ?? "Instagram DM"}</strong>
          </div>
        </div>
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
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [availability, setAvailability] = useState<Creator["availability"] | "all">("all");
  const [maxRate, setMaxRate] = useState<number>(RATE_CAP);
  const [added, setAdded] = useState<AddedFilter>("all");
  const [sort, setSort] = useState<AddedSort>("newest");
  const [view, setView] = useState<DirectoryView>("cards");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [urlStateInitialized, setUrlStateInitialized] = useState(false);

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
      (added === "all" || (added === "recent" ? addedTimestamp >= thirtyDaysAgo : addedTimestamp < thirtyDaysAgo)) &&
      (maxRate >= RATE_CAP || rateFloorNgn(creator) <= maxRate)
    );
  }).sort((a, b) => {
    const difference = creatorAddedTimestamp(b) - creatorAddedTimestamp(a);
    return sort === "newest" ? difference : -difference;
  });

  const activeFilterCount = [
    search.trim(),
    category !== "all" ? category : "",
    location !== "all" ? location : "",
    availability !== "all" ? availability : "",
    maxRate < RATE_CAP ? "rate" : "",
    added !== "all" ? added : "",
  ].filter(Boolean).length;

  useEffect(() => {
    const syncFromUrl = () => {
      const next = readDirectoryUrlState(categories, locations);
      setSearch(next.search);
      setCategory(next.category);
      setLocation(next.location);
      setAvailability(next.availability);
      setMaxRate(next.maxRate);
      setAdded(next.added);
      setSort(next.sort);
      setView(next.view);
      setPage(next.page);
    };

    syncFromUrl();
    setUrlStateInitialized(true);
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [categories, locations]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageVisible = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (!urlStateInitialized) return;
    writeDirectoryUrl({ search, category, location, availability, maxRate, added, sort, view, page: currentPage });
  }, [search, category, location, availability, maxRate, added, sort, view, currentPage, urlStateInitialized]);

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

  const updateMaxRate = (value: number) => {
    setMaxRate(value);
    setPage(1);
  };

  const updateAdded = (value: AddedFilter) => {
    setAdded(value);
    setPage(1);
  };

  const updateSort = (value: AddedSort) => {
    setSort(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setLocation("all");
    setAvailability("all");
    setMaxRate(RATE_CAP);
    setAdded("all");
    setSort("newest");
    setPage(1);
  };

  return (
    <>
      <div className="mb-7 grid items-start gap-8 min-[801px]:grid-cols-[190px_minmax(0,1fr)] min-[801px]:gap-8">
        <aside className="sticky top-6 hidden bg-background min-[801px]:block">
          <FilterControls
            search={search}
            setSearch={updateSearch}
            category={category}
            setCategory={updateCategory}
            location={location}
            setLocation={updateLocation}
            availability={availability}
            setAvailability={updateAvailability}
            maxRate={maxRate}
            setMaxRate={updateMaxRate}
            added={added}
            setAdded={updateAdded}
            sort={sort}
            setSort={updateSort}
            categories={categories}
            locations={locations}
            activeFilterCount={activeFilterCount}
            onClear={clearFilters}
          />
        </aside>

        <section className="min-w-0">
          <div className="mb-5 flex items-center justify-between gap-3 min-[801px]:hidden">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-border bg-transparent px-3.5 py-2 text-[13px] font-medium hover:border-foreground focus-visible:outline-none"
            >
              <FiFilter aria-hidden="true" className="h-4 w-4" />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-muted-foreground">
                {visible.length} {visible.length === 1 ? "person" : "people"}
              </span>
              <ViewToggle view={view} setView={setView} />
            </div>
          </div>

          <div className="mb-5 hidden items-center justify-between gap-3 min-[801px]:flex">
            <p aria-live="polite" className="m-0 text-[13px] font-medium text-muted-foreground">
              {visible.length} {visible.length === 1 ? "person" : "people"}
            </p>
            <ViewToggle view={view} setView={setView} />
          </div>

          <div className={view === "cards" ? "grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"}>
        {pageVisible.map((creator) => (
          view === "cards" ? <CreatorCard key={creator.slug} creator={creator} /> : <article
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
                  </h2>
                  {isCreatorNew(creator) ? <Badge tone="active">NEW</Badge> : null}
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${AVAILABILITY_DOT[creator.availability]}`} />
                    {AVAILABILITY_LABEL[creator.availability]}
                  </span>
                </div>
                <p className="mb-0 mt-1 text-[13px] text-muted-foreground">
                  {creator.category} · {baseCity(creator.location)}
                </p>
              </div>

              <div className="flex flex-none items-center gap-2 max-[640px]:w-full">
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
        ))}
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

      {filterOpen ? (
        <div className="fixed inset-0 z-50 min-[801px]:hidden" role="dialog" aria-modal="true" aria-label="Creators filters">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setFilterOpen(false)}
            className="absolute inset-0 cursor-default bg-foreground/40"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(88vw,360px)] overflow-y-auto bg-background shadow-2xl">
            <div className="mb-6 flex items-center justify-end">
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setFilterOpen(false)}
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-border bg-transparent hover:border-foreground focus-visible:outline-none"
              >
                <FiX aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <FilterControls
              search={search}
              setSearch={updateSearch}
              category={category}
              setCategory={updateCategory}
              location={location}
              setLocation={updateLocation}
              availability={availability}
              setAvailability={updateAvailability}
              maxRate={maxRate}
              setMaxRate={updateMaxRate}
              added={added}
              setAdded={updateAdded}
              sort={sort}
              setSort={updateSort}
              categories={categories}
              locations={locations}
              activeFilterCount={activeFilterCount}
              onClear={clearFilters}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
