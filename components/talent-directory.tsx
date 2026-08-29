"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { FaBehance, FaGlobe, FaLinkedinIn } from "react-icons/fa";
import { FiFilter, FiX } from "react-icons/fi";
import type { Talent } from "@/lib/talent";
import { baseCity, rateFloorNgn, talentHref } from "@/lib/talent";

const AVAILABILITY_DOT: Record<Talent["availability"], string> = {
  open: "bg-[#1a9a4a]",
  busy: "bg-[#d94a3a]",
  unconfirmed: "bg-muted-foreground",
};

const AVAILABILITY_LABEL: Record<Talent["availability"], string> = {
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

function Avatar({ name, imageSrc, className = "" }: { name: string; imageSrc?: string | null; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid flex-none place-items-center overflow-hidden rounded-full bg-primary font-black tracking-[-0.04em] text-white ${className}`}
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

type PlatformLink = { label: string; href: string | null; Icon: IconType };

function platformLinks(talent: Talent): PlatformLink[] {
  const portfolioIsBehance = talent.portfolio?.toLowerCase().includes("behance.net") ?? false;
  return [
    { label: "Website", href: portfolioIsBehance ? null : talent.portfolio, Icon: FaGlobe },
    { label: "LinkedIn", href: talent.linkedin ?? null, Icon: FaLinkedinIn },
    { label: "Behance", href: talent.behance ?? (portfolioIsBehance ? talent.portfolio : null), Icon: FaBehance },
  ];
}

const SELECT =
  "min-h-[44px] cursor-pointer border-2 border-foreground bg-transparent px-[14px] py-2.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-foreground hover:border-primary focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary";

const PILL =
  "inline-block rounded-full bg-foreground/[0.07] px-3 py-1.5 text-[12px] leading-none text-foreground";

const RATE_STEP = 1_000;
const RATE_MIN = 0;
const RATE_CAP = 100_000;
const PAGE_SIZE = 10;

type DirectoryUrlState = {
  search: string;
  category: string;
  location: string;
  availability: Talent["availability"] | "all";
  maxRate: number;
  page: number;
};

function readDirectoryUrlState(categories: string[], locations: string[]): DirectoryUrlState {
  const defaults: DirectoryUrlState = {
    search: "",
    category: "all",
    location: "all",
    availability: "all",
    maxRate: RATE_CAP,
    page: 1,
  };

  if (typeof window === "undefined") return defaults;

  const params = new URLSearchParams(window.location.search);
  const rawRate = params.has("maxRate") ? Number(params.get("maxRate")) : NaN;
  const rawPage = Number(params.get("page"));
  const category = params.get("category");
  const location = params.get("location");
  const availability = params.get("availability");

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

  if (state.page > 1) params.set("page", String(state.page));
  else params.delete("page");

  url.search = params.toString();
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function Stat({ children }: { children: React.ReactNode }) {
  return <span className="text-[14px] leading-none text-foreground">{children}</span>;
}

type FilterControlsProps = {
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  availability: Talent["availability"] | "all";
  setAvailability: (value: Talent["availability"] | "all") => void;
  maxRate: number;
  setMaxRate: (value: number) => void;
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
  categories,
  locations,
  activeFilterCount,
  onClear,
}: FilterControlsProps) {
  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em]">
        Search
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Name, skill, company"
          aria-label="Search talent"
          className="min-h-[44px] w-full border-2 border-foreground bg-transparent px-3 py-2.5 text-[12px] font-extrabold normal-case tracking-normal text-foreground placeholder:text-muted-foreground focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary"
        />
      </label>
      <label className="flex flex-col gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em]">
        Category
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
      </label>
      <label className="flex flex-col gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em]">
        Location
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
      </label>
      <label className="flex flex-col gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em]">
        Availability
        <select
          value={availability}
          onChange={(event) => setAvailability(event.target.value as Talent["availability"] | "all")}
          aria-label="Availability"
          className={`${SELECT} w-full`}
        >
          <option value="all">Any availability</option>
          <option value="open">Open</option>
          <option value="busy">Busy</option>
          <option value="unconfirmed">Unconfirmed</option>
        </select>
      </label>
      <label className="flex flex-col gap-3 border-2 border-foreground px-3 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em]">
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
          className="min-h-[44px] cursor-pointer border-2 border-border bg-transparent px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground hover:border-foreground hover:text-foreground focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary"
        >
          Clear filters ({activeFilterCount})
        </button>
      ) : null}
    </div>
  );
}

export function TalentDirectory({
  talents,
  categories,
  locations,
}: {
  talents: Talent[];
  categories: string[];
  locations: string[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [availability, setAvailability] = useState<Talent["availability"] | "all">("all");
  const [maxRate, setMaxRate] = useState<number>(RATE_CAP);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [urlStateInitialized, setUrlStateInitialized] = useState(false);

  const visible = talents.filter((talent) => {
    const query = search.trim().toLowerCase();
    const searchable = [
      talent.name,
      talent.category,
      talent.location,
      ...talent.tags,
      ...(talent.workHistory?.flatMap((entry) => [entry.role, entry.company]) ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!query || searchable.includes(query)) &&
      (category === "all" || talent.category === category) &&
      (location === "all" || baseCity(talent.location) === location) &&
      (availability === "all" || talent.availability === availability) &&
      (maxRate >= RATE_CAP || rateFloorNgn(talent) <= maxRate)
    );
  });

  const activeFilterCount = [
    search.trim(),
    category !== "all" ? category : "",
    location !== "all" ? location : "",
    availability !== "all" ? availability : "",
    maxRate < RATE_CAP ? "rate" : "",
  ].filter(Boolean).length;

  useEffect(() => {
    const syncFromUrl = () => {
      const next = readDirectoryUrlState(categories, locations);
      setSearch(next.search);
      setCategory(next.category);
      setLocation(next.location);
      setAvailability(next.availability);
      setMaxRate(next.maxRate);
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
    writeDirectoryUrl({ search, category, location, availability, maxRate, page: currentPage });
  }, [search, category, location, availability, maxRate, currentPage, urlStateInitialized]);

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

  const updateAvailability = (value: Talent["availability"] | "all") => {
    setAvailability(value);
    setPage(1);
  };

  const updateMaxRate = (value: number) => {
    setMaxRate(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setLocation("all");
    setAvailability("all");
    setMaxRate(RATE_CAP);
    setPage(1);
  };

  return (
    <>
      <div className="my-7 grid items-start gap-8 min-[801px]:grid-cols-[240px_minmax(0,1fr)] min-[801px]:gap-10">
        <aside className="sticky top-6 hidden border border-border bg-background p-5 min-[801px]:block">
          <h2 className="mb-5 mt-0 text-[13px] uppercase tracking-[0.14em]">Filter talent</h2>
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
              className="inline-flex min-h-[44px] items-center gap-2 border-2 border-foreground bg-transparent px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] hover:bg-foreground hover:text-white focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary"
            >
              <FiFilter aria-hidden="true" className="h-4 w-4" />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
            <span className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-primary">
              {visible.length} {visible.length === 1 ? "person" : "people"}
            </span>
          </div>

          <p aria-live="polite" className="mb-5 mt-0 hidden text-[12px] font-extrabold uppercase tracking-[0.14em] text-primary min-[801px]:block">
            {visible.length} {visible.length === 1 ? "person" : "people"}
          </p>

          <div className="flex flex-col gap-4">
        {pageVisible.map((talent) => (
          <article
            key={talent.slug}
            role="link"
            tabIndex={0}
            onClick={() => router.push(talentHref(talent.slug))}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(talentHref(talent.slug));
              }
            }}
            className="cursor-pointer rounded-2xl border border-border bg-background p-[clamp(20px,3vw,32px)] hover:border-foreground focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary"
          >
            <div className="flex items-start gap-5 max-[640px]:flex-col max-[640px]:gap-4">
              <Link
                href={talentHref(talent.slug)}
                aria-label={talent.name}
                className="flex-none focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary"
              >
                <Avatar name={talent.name} imageSrc={talent.profileImage} className="h-16 w-16 text-[18px]" />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="m-0 text-[22px] uppercase leading-none tracking-[-0.03em]">
                    <Link
                      href={talentHref(talent.slug)}
                      className="text-foreground no-underline hover:text-primary focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary"
                    >
                      {talent.name}
                    </Link>
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${AVAILABILITY_DOT[talent.availability]}`} />
                    {AVAILABILITY_LABEL[talent.availability]}
                  </span>
                </div>
                <p className="mb-0 mt-1.5 text-[14px] text-muted-foreground">
                  {talent.category} · {baseCity(talent.location)}
                </p>
              </div>

              <div className="flex flex-none items-center gap-2 max-[640px]:w-full">
                {platformLinks(talent)
                  .filter((platform) => platform.href)
                  .map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href!}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${talent.name} on ${label}`}
                      title={label}
                      onClick={(event) => event.stopPropagation()}
                      className="grid h-11 w-11 flex-none place-items-center rounded-full border border-border text-foreground hover:border-foreground focus-visible:outline-[3px] focus-visible:outline-offset-[2px] focus-visible:outline-primary"
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </a>
                  ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
              {talent.hideRate === false ? (
                <Stat>
                  <strong className="font-extrabold">{talent.dayRate}</strong> / day
                </Stat>
              ) : null}
              {talent.yearsActive !== null && (
                <Stat>
                  <strong className="font-extrabold">{talent.yearsActive}</strong> years active
                </Stat>
              )}
              <Stat>{talent.entity}</Stat>
              {talent.workedOn.length > 0 && (
                <Stat>Worked on {talent.workedOn.join(", ")}</Stat>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {talent.tags.slice(0, 6).map((tag) => (
                <span key={tag} className={PILL}>
                  {tag}
                </span>
              ))}
              {talent.tags.length > 6 && <span className={PILL}>+{talent.tags.length - 6}</span>}
            </div>

            <p className="mb-0 mt-5 line-clamp-2 max-w-[95ch] text-[15px] leading-[1.5] text-muted-foreground">
              {talent.craftNote}
            </p>
          </article>
        ))}
          </div>
          {totalPages > 1 ? (
            <nav aria-label="Talent pagination" className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="min-h-[44px] cursor-pointer border-2 border-border bg-transparent px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="min-h-[44px] cursor-pointer border-2 border-border bg-transparent px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          ) : null}
        </section>
      </div>

      {filterOpen ? (
        <div className="fixed inset-0 z-50 min-[801px]:hidden" role="dialog" aria-modal="true" aria-label="Talent filters">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setFilterOpen(false)}
            className="absolute inset-0 cursor-default bg-foreground/40"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(88vw,360px)] overflow-y-auto border-r border-border bg-background p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="m-0 text-[13px] uppercase tracking-[0.14em]">Filter talent</h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setFilterOpen(false)}
                className="grid h-11 w-11 cursor-pointer place-items-center border-2 border-foreground bg-transparent hover:bg-foreground hover:text-white focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary"
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
