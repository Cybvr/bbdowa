"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { EmptyThumbnail, ImageWithFallback } from "@/components/empty-thumbnail";
import { Badge as DashboardBadge } from "@/components/dashboard/ui";
import type { Job, JobStatus } from "@/lib/jobs";
import { getClient, getClientWorkspace, type Client } from "@/lib/clients";
import { creatorCategoryOptions as knownCreatorCategories, isCreatorUser, userHref, type User } from "@/lib/users";
import { readContentFromFirestore, useFirestoreTasks } from "@/lib/firebase/client-content";
import { firebaseDb } from "@/lib/firebase/client";
import { jobsCollection } from "@/lib/firebase/job-collections";
import { ClientCreatorAddAction } from "@/components/client-creator-add-action";
import { ClientMediaAddAction, ClientMediaDeleteAction } from "@/components/client-media-add-action";
import { ClientWorkspaceContent, ClientWorkspaceHeading } from "@/components/client-workspace-heading";
import { DashboardCard, DashboardCardActions } from "@/components/dashboard-card";
import { FilterBar, type FilterTab, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { useAuth } from "@/components/auth-provider";
import { UserActions } from "@/components/user-actions";
import { longDate, plural } from "@/lib/format";
import { jobWorkspaceStatuses } from "@/lib/client-data";
import { fontOptions, ctaOptions } from "@/lib/job-options";
import { ClientWorkspaceSkeleton } from "@/components/dashboard/loading-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableTableRow } from "@/components/ui/clickable-table-row";
import { TaskStatusBadge } from "@/components/tasks-view";
import { NewTaskDialog, type AssigneeOption } from "@/components/tasks-management-page";
import { formatDate as formatTaskDate, isOverdue } from "@/lib/creator-tasks";
import type {
  PhaseContent,
  JobListItem,
  JobWorkspaceStatus,
} from "@/lib/client-data";

// The public job data uses active/completed/archived; the workspace exposes a
// slightly richer editable set. Map the real status onto that set so the card
// and overview reflect the actual job rather than a flat "Draft".
function workspaceStatusFromJob(status: JobStatus): JobWorkspaceStatus {
  if (status === "active") return "Live";
  if (status === "completed") return "Completed";
  return "Draft";
}

function jobImageFor(jobId: string, jobs: Job[]): string {
  return jobs.find((job) => job.slug === jobId)?.image ?? "/images/projects/project-placeholder.svg";
}

type CaseStudyDraft = Pick<Job, "challenge" | "insight" | "strategy" | "execution" | "outcome"> & {
  platform: string;
};

function caseStudyFromJob(job?: Job): CaseStudyDraft {
  return {
    challenge: job?.challenge ?? "",
    insight: job?.insight ?? "",
    strategy: job?.strategy ?? "",
    platform: job?.platform.join(", ") ?? "",
    execution: job?.execution ?? "",
    outcome: job?.outcome ?? "",
  };
}

function dateOnly(value: unknown): string | undefined {
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (!value || typeof value !== "object") return undefined;

  const timestamp = value as {
    toDate?: () => Date;
    toMillis?: () => number;
    seconds?: number;
  };
  if (typeof timestamp.toDate === "function") return timestamp.toDate().toISOString().slice(0, 10);
  if (typeof timestamp.toMillis === "function") return new Date(timestamp.toMillis()).toISOString().slice(0, 10);
  if (typeof timestamp.seconds === "number") return new Date(timestamp.seconds * 1000).toISOString().slice(0, 10);
  return undefined;
}

function ClientWorkspaceHero({
  clientName,
  title,
  heroImage,
  clientProfileImage,
  onHome,
  shareAction,
  creators,
  navigation,
}: {
  clientName: string;
  title: string;
  heroImage: string;
  clientProfileImage: string;
  onHome: () => void;
  shareAction: React.ReactNode;
  creators: Array<Pick<User, "slug" | "name" | "profileImage" | "featuredImage">>;
  navigation?: React.ReactNode;
}) {
  const visibleCreators = creators.slice(0, 5);
  const remainingCreators = Math.max(creators.length - visibleCreators.length, 0);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 px-1">
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0 text-xs text-muted-foreground sm:text-sm">
            <li>
              <Link href="/admin/clients" className="transition hover:text-foreground">
                All
              </Link>
            </li>
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li>
              <button
                type="button"
                onClick={onHome}
                className="text-left transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {clientName}
              </button>
            </li>
            <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li aria-current="page" className="text-foreground">{title}</li>
          </ol>
        </nav>
        <div className="shrink-0">{shareAction}</div>
      </div>

      <div className="relative h-[140px] overflow-hidden rounded-2xl bg-muted sm:h-[180px]">
        <ImageWithFallback
          src={heroImage}
          alt={`${clientName} job`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/5 to-black/20" aria-hidden="true" />
        <button
          type="button"
          onClick={onHome}
          aria-label={`${clientName} home`}
          className="absolute bottom-0 left-4 flex h-12 w-20 items-center justify-center rounded-t-xl bg-card p-2 sm:left-6 sm:h-16 sm:w-24 sm:p-3"
        >
          <ImageWithFallback
            src={clientProfileImage}
            alt={`${clientName} logo`}
            className="h-full w-full object-contain"
            fallbackClassName="h-full w-full rounded-xl"
          />
        </button>
        <div className="absolute bottom-4 right-4 flex items-center -space-x-1.5 sm:bottom-10 sm:right-6" aria-label={`${creators.length} selected team members`}>
          {visibleCreators.map((creator) => (
            <span
              key={creator.slug}
              title={creator.name}
              className="h-8 w-8 overflow-hidden rounded-full border border-white bg-muted"
            >
              <ImageWithFallback
                src={creator.profileImage ?? creator.featuredImage}
                alt={creator.name}
                className="h-full w-full object-cover"
                fallbackClassName="h-full w-full rounded-full"
                fallbackSeed={creator.name}
              />
            </span>
          ))}
          {remainingCreators > 0 ? (
            <span
              title={`${remainingCreators} more team members`}
              className="grid h-8 min-w-8 place-items-center rounded-full border border-white bg-foreground px-1.5 text-[10px] font-semibold text-background"
            >
              +{remainingCreators}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-2">{navigation}</div>
    </div>
  );
}
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  Palette,
  Smartphone,
  Info,
  Layers,
  Feather,
  ScanLine,
  Box,
  Share2,
  ChevronDown,
  ChevronRight,
  Film,
  Mic,
  Megaphone,
  Newspaper,
  Users,
  BarChart3,
  Plus,
  ChevronLeft,
  ArrowRight,
  TrendingUp,
  Bold,
  Italic,
  List,
  Heading2,
  Pilcrow,
  Save,
  X,
} from "lucide-react";

export default function ClientPage() {
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();
  const { loading: authLoading, user } = useAuth();
  const [content, setContent] = useState<Awaited<ReturnType<typeof readContentFromFirestore>> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoadError("Sign in to load this client workspace.");
      return;
    }

    let active = true;
    readContentFromFirestore()
      .then((nextContent) => {
        if (active) setContent(nextContent);
      })
      .catch((error) => {
        console.error("Unable to load Firestore content", error);
        if (active) setLoadError("Unable to load this client workspace from Firestore.");
      });
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const initialView: OneUtilityWorkspaceView = pathname.endsWith("/jobs")
    ? "job"
    : pathname.endsWith("/overview")
      ? "brand"
    : pathname.endsWith("/brand-dna")
      ? "brand"
      : pathname.endsWith("/moodboard") || pathname.endsWith("/media")
        ? "moodboard"
        : pathname.endsWith("/creators")
          ? "creators"
          : "job";

  if (loadError) {
    return (
      <main className="flex-1 px-5 pb-16 pt-4 sm:px-8">
        <p className="text-sm text-muted-foreground">{loadError}</p>
      </main>
    );
  }

  if (!content) {
    return <ClientWorkspaceSkeleton />;
  }

  // key={slug} forces a remount when navigating between clients so all
  // slug-derived initial state (preset, palette, copy) re-initialises.
  return (
    <OneUtilityClientWorkspace
      key={slug}
      slug={slug}
      initialView={initialView}
      clients={content.clients}
      jobs={content.jobs}
      users={content.users}
      createdBy={user?.uid ?? ""}
      createdByName={user?.name ?? user?.email ?? null}
    />
  );
}

function CopyField({
  label,
  value,
  onChange,
  textarea,
  rows,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between text-sm font-medium text-foreground">
        <span>{label}</span>
        {hint && <span className="text-sm text-muted-foreground font-mono">{hint}</span>}
      </label>
      {textarea ? (
        <textarea
          rows={rows ?? 2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition"
        />
      )}
    </div>
  );
}

function CopySelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const opts = options.includes(value) ? options : [value, ...options];
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
      >
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function CopyGroup({
  icon,
  title,
  children,
  open,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 py-3.5 text-left"
      >
        <span className="text-xs font-mono text-primary uppercase tracking-widest font-semibold flex items-center gap-1.5">
          {icon} {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""
            }`}
        />
      </button>
      {open && <div className="pb-5 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

const FONT_STACKS: Record<string, { heading: string; body: string }> = {
  "Outfit Display & Jakarta Sans": { heading: "'Outfit', sans-serif", body: "'Plus Jakarta Sans', sans-serif" },
  "Inter & Inter": { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
  "Playfair Display & Source Sans": { heading: "'Playfair Display', serif", body: "'Source Sans 3', sans-serif" },
  "Space Grotesk & IBM Plex Sans": { heading: "'Space Grotesk', sans-serif", body: "'IBM Plex Sans', sans-serif" },
  "Clash Display & General Sans": { heading: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif" },
  "DM Serif Display & DM Sans": { heading: "'DM Serif Display', serif", body: "'DM Sans', sans-serif" },
  "Archivo & Archivo Narrow": { heading: "'Archivo', sans-serif", body: "'Archivo Narrow', sans-serif" },
};

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineToHtml(text: string) {
  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      out.push(`<h1>${inlineToHtml(line.slice(2))}</h1>`);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(`<h2>${inlineToHtml(line.slice(3))}</h2>`);
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(`<li>${inlineToHtml(lines[i].slice(2))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    out.push(`<p>${inlineToHtml(line)}</p>`);
    i++;
  }
  return out.join("");
}

function StrategyEditor({ markdown }: { markdown: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [initialHtml] = useState(() => markdownToHtml(markdown));

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const ToolButton = ({
    onRun,
    label,
    children,
  }: {
    onRun: () => void;
    label: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onRun}
      className="grid h-10 w-10 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
    >
      {children}
    </button>
  );

  return (
    <div className="-mx-4 bg-muted px-4 py-6 sm:-mx-6 sm:px-6">
      <div className="mx-auto w-full max-w-[720px] space-y-3">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-background/95 backdrop-blur px-1.5 py-1 shadow-sm">
          <ToolButton label="Heading" onRun={() => exec("formatBlock", "H2")}>
            <Heading2 className="w-4 h-4" />
          </ToolButton>
          <ToolButton label="Body text" onRun={() => exec("formatBlock", "P")}>
            <Pilcrow className="w-4 h-4" />
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolButton label="Bold" onRun={() => exec("bold")}>
            <Bold className="w-4 h-4" />
          </ToolButton>
          <ToolButton label="Italic" onRun={() => exec("italic")}>
            <Italic className="w-4 h-4" />
          </ToolButton>
          <ToolButton label="Bulleted list" onRun={() => exec("insertUnorderedList")}>
            <List className="w-4 h-4" />
          </ToolButton>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          dangerouslySetInnerHTML={{ __html: initialHtml }}
          className="strategy-doc min-h-[65vh] rounded-xl border border-border bg-background px-6 sm:px-10 py-8 sm:py-12 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </div>
    </div>
  );
}

type OneUtilityWorkspaceView = "overview" | "job" | "tasks" | "brand" | "moodboard" | "creators";
type ClientJobFilter = "all" | JobWorkspaceStatus;
type ClientJobSort = "recent" | "name";
type ClientCreatorSort = "name" | "category" | "availability";

const CLIENT_JOB_FILTERS: FilterTab<ClientJobFilter>[] = [
  { key: "all", label: "All" },
  ...jobWorkspaceStatuses.map((status) => ({ key: status, label: status })),
];
const CLIENT_JOB_SORTS: SortOption<ClientJobSort>[] = [
  { key: "recent", label: "Most recent" },
  { key: "name", label: "Name (A–Z)" },
];
const CLIENT_CREATOR_SORTS: SortOption<ClientCreatorSort>[] = [
  { key: "name", label: "Name (A–Z)" },
  { key: "category", label: "Category (A–Z)" },
  { key: "availability", label: "Availability" },
];

function OneUtilityClientWorkspace({
  slug,
  initialView = "job",
  clients,
  jobs: availableJobs,
  users: availableUsers,
  createdBy,
  createdByName,
}: {
  slug: string;
  initialView?: OneUtilityWorkspaceView;
  clients: Client[];
  jobs: Job[];
  users: User[];
  createdBy: string;
  createdByName: string | null;
}) {
  const client = getClient(slug, clients);
  const clientName = client?.name ?? "Client";
  const workspace = getClientWorkspace(slug, clientName, availableJobs);
  const preset = workspace.preset;
  const clientProfileImage = client?.profileImage ?? "/images/projects/project-placeholder.svg";
  const initialClientJobs = availableJobs.filter((job) => job.clientId === slug);
  const primaryJob = initialClientJobs[0];
  const [projectName, setProjectName] = useState(
    primaryJob?.title ?? primaryJob?.name ?? preset.name,
  );
  const [activeMainTab, setActiveMainTab] = useState<
    OneUtilityWorkspaceView
  >(initialView);
  const [taskRefreshToken, setTaskRefreshToken] = useState(0);
  const { tasks: allTasks, loading: tasksLoading } = useFirestoreTasks(taskRefreshToken);
  const clientJobIds = React.useMemo(
    () => new Set(availableJobs.filter((job) => job.clientId === slug).map((job) => job.slug)),
    [availableJobs, slug],
  );
  const clientTasks = React.useMemo(
    () => allTasks.filter((task) => task.clientId === slug || (task.jobId ? clientJobIds.has(task.jobId) : false)),
    [allTasks, clientJobIds, slug],
  );
  const assignees = React.useMemo<AssigneeOption[]>(
    () => availableUsers
      .filter((candidate) => candidate.uid)
      .map((candidate) => ({
        uid: candidate.uid as string,
        name: candidate.name,
        slug: candidate.slug,
        isCreator: isCreatorUser(candidate),
        hint: isCreatorUser(candidate) ? (candidate.category || "Creator") : (candidate.title || candidate.role || ""),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [availableUsers],
  );
  const [profileSection, setProfileSection] = useState<"company" | "design">("company");
  const [jobView, setJobView] = useState<"home" | "editor">("home");
  const [jobSubTab, setJobSubTab] = useState<"overview" | "case-study" | "strategy" | "creative" | "marketing">("overview");
  const [selectedCreative, setSelectedCreative] = useState<{ src: string; alt: string } | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [jobs, setJobs] = useState<JobListItem[]>(() =>
    initialClientJobs.length > 0
      ? initialClientJobs.map((job) => ({
        id: job.slug,
        title: job.title ?? job.name,
        status: workspaceStatusFromJob(job.status),
      }))
      : [{ id: "client-job", title: "Job to be defined", status: "Draft" }]
  );
  const [jobSearch, setJobSearch] = useState("");
  const [jobFilter, setJobFilter] = useState<ClientJobFilter>("all");
  const [jobSort, setJobSort] = useState<ClientJobSort>("recent");
  const [jobListView, setJobListView] = useState<ViewMode>("cards");
  const [activeJobId, setActiveJobId] = useState(() => initialClientJobs[0]?.slug ?? "client-job");
  const [jobDescriptions, setJobDescriptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialClientJobs.map((job) => [job.slug, job.summary])),
  );
  const [caseStudies, setCaseStudies] = useState<Record<string, CaseStudyDraft>>(() =>
    Object.fromEntries(initialClientJobs.map((job) => [job.slug, caseStudyFromJob(job)])),
  );
  type Section =
    | "social"
    | "film"
    | "audio"
    | "ooh"
    | "print"
    | "retail"
    | "experiential";
  const [activeSection, setActiveSection] = useState<Section | null>("social");
  const toggleSection = (id: Section) =>
    setActiveSection((prev) => (prev === id ? null : id));

  // Strategy input fields state
  const [marketAudience, setMarketAudience] = useState(client?.targetAudience?.trim() || preset.footprintShort);

  // Brand DNA state
  const [palette, setPalette] = useState<string[]>(workspace.palette);
  const [fontPairing, setFontPairing] = useState(fontOptions[0]);
  const [businessProfileDirty, setBusinessProfileDirty] = useState(false);
  const [businessProfileSaving, setBusinessProfileSaving] = useState(false);
  const [designDirty, setDesignDirty] = useState(false);
  const updatePaletteColor = (index: number, value: string) => {
    setPalette((prev) => prev.map((c, i) => (i === index ? value : c)));
    setDesignDirty(true);
  };
  const addPaletteColor = () => {
    setPalette((prev) => [...prev, "#888888"]);
    setDesignDirty(true);
  };
  const removePaletteColor = (index: number) => {
    setPalette((prev) => prev.filter((_, i) => i !== index));
    setDesignDirty(true);
  };

  // Job overview state
  // Job lead is stored as the person's slug (leadUserId on the real
  // job record), so the workspace and the public job page always
  // resolve to the same person.
  const [jobLeadSlug, setJobLeadSlug] = useState(initialClientJobs[0]?.leadUserId ?? "");
  const [jobStart, setJobStart] = useState("2026-08-01");
  const [jobEnd, setJobEnd] = useState("2026-10-31");
  const [jobDeadline, setJobDeadline] = useState("2026-07-25");

  // Settings state
  const [clientDescription, setClientDescription] = useState(client?.description?.trim() ?? "");
  const [brandUrl, setBrandUrl] = useState(client?.website ?? preset.url);
  const [footprint, setFootprint] = useState(client?.targetAudience ?? preset.footprint);
  const [clientNameInput, setClientNameInput] = useState(client?.name ?? "");
  const [clientIndustry, setClientIndustry] = useState(client?.industry ?? "");
  const [clientDate, setClientDate] = useState(client?.date ?? "");
  const [clientTeamSize, setClientTeamSize] = useState(client?.teamSize == null ? "" : String(client.teamSize));
  const [clientYearFounded, setClientYearFounded] = useState(client?.yearFounded == null ? "" : String(client.yearFounded));
  const [clientLocation, setClientLocation] = useState(client?.location ?? "");
  const [clientLinkedIn, setClientLinkedIn] = useState(client?.linkedIn ?? "");
  const [clientTimezone, setClientTimezone] = useState(client?.timezone ?? "");
  const [clientHours, setClientHours] = useState(client?.hours ?? "");
  const [clientHoursConverted, setClientHoursConverted] = useState(client?.hoursConverted ?? "");
  const [aesthetic, setAesthetic] = useState(preset.aesthetic);
  const [brandArchetype, setBrandArchetype] = useState(workspace.brandArchetype);
  const [toneVal, setToneVal] = useState(preset.toneVal);
  const [toneLabel, setToneLabel] = useState(preset.toneText);

  // Brand DNA: editable core value proposition
  const [valueProp, setValueProp] = useState(workspace.valueProposition.coreHeadline);
  // Page accent follows the client's primary brand colour.
  const [primaryColor] = useState<string>(workspace.primaryColor);
  const [selectedCreatorSlugs, setSelectedCreatorSlugs] = useState(client?.creatorSlugs ?? []);
  const [mediaItems, setMediaItems] = useState(workspace.moodboardImages);
  const [creatorSearch, setCreatorSearch] = useState("");
  const [creatorCategory, setCreatorCategory] = useState("all");
  const [creatorSort, setCreatorSort] = useState<ClientCreatorSort>("name");
  const [creatorListView, setCreatorListView] = useState<ViewMode>("cards");
  const selectedCreators = React.useMemo(
    () => availableUsers.filter((user) => selectedCreatorSlugs.includes(user.slug)),
    [availableUsers, selectedCreatorSlugs],
  );
  const visibleJobs = React.useMemo(() => {
    const query = jobSearch.trim().toLowerCase();
    const filtered = jobs.filter((job) => {
      const matchesStatus = jobFilter === "all" || job.status === jobFilter;
      const matchesSearch = !query || [job.title, job.status].join(" ").toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (jobSort === "name") return a.title.localeCompare(b.title);
      const aDate = availableJobs.find((job) => job.slug === a.id)?.liveAt?.date ?? "";
      const bDate = availableJobs.find((job) => job.slug === b.id)?.liveAt?.date ?? "";
      return bDate.localeCompare(aDate);
    });
  }, [availableJobs, jobFilter, jobSearch, jobSort, jobs]);
  const creatorCategoryOptions = React.useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...[...new Set(selectedCreators.map((creator) => creator.category))]
        .sort((a, b) => a.localeCompare(b))
        .map((category) => ({ value: category, label: category })),
    ],
    [selectedCreators],
  );
  const visibleCreators = React.useMemo(() => {
    const query = creatorSearch.trim().toLowerCase();
    const filtered = selectedCreators.filter((creator) => {
      const matchesCategory = creatorCategory === "all" || creator.category === creatorCategory;
      const matchesSearch =
        !query ||
        [creator.name, creator.category, creator.location, creator.availability, ...creator.tags]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (creatorSort === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      if (creatorSort === "availability") return a.availability.localeCompare(b.availability) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [creatorCategory, creatorSearch, creatorSort, selectedCreators]);
  const latestJobs = React.useMemo(
    () => [...jobs]
      .sort((a, b) => {
        const aDate = availableJobs.find((job) => job.slug === a.id)?.liveAt?.date ?? "";
        const bDate = availableJobs.find((job) => job.slug === b.id)?.liveAt?.date ?? "";
        return bDate.localeCompare(aDate);
      })
      .slice(0, 3),
    [availableJobs, jobs],
  );
  const latestCreators = selectedCreators.slice(0, 4);

  const nextJobNumberRef = useRef(2);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveBusinessProfile = async () => {
    if (businessProfileSaving) return;
    const teamSize = clientTeamSize.trim() ? Number(clientTeamSize) : null;
    const yearFounded = clientYearFounded.trim() ? Number(clientYearFounded) : null;
    if (teamSize !== null && (!Number.isInteger(teamSize) || teamSize < 0)) {
      showToast("Enter a valid team size.");
      return;
    }
    if (yearFounded !== null && (!Number.isInteger(yearFounded) || yearFounded < 1800 || yearFounded > new Date().getFullYear())) {
      showToast("Enter a valid founding year.");
      return;
    }
    setBusinessProfileSaving(true);
    try {
      await updateDoc(doc(firebaseDb, "clients", slug), {
        name: clientNameInput.trim() || clientName,
        industry: clientIndustry.trim(),
        date: clientDate || null,
        website: brandUrl.trim() || null,
        targetAudience: footprint.trim() || null,
        description: clientDescription.trim() || null,
        teamSize,
        yearFounded,
        location: clientLocation.trim() || null,
        linkedIn: clientLinkedIn.trim() || null,
        timezone: clientTimezone.trim() || null,
        hours: clientHours.trim() || null,
        hoursConverted: clientHoursConverted.trim() || null,
        updatedAt: serverTimestamp(),
      });
      setBusinessProfileDirty(false);
      showToast("About saved.");
    } catch (cause) {
      console.error("Unable to save client about", cause);
      showToast("Couldn’t save About. Try again.");
    } finally {
      setBusinessProfileSaving(false);
    }
  };

  const handleSaveBrandDna = () => {
    setDesignDirty(false);
    showToast("Profile saved.");
  };

  const handleShareJob = async () => {
    const link = typeof window !== "undefined" ? window.location.href : "";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${clientName} — ${projectName}`, url: link });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(link);
      showToast(`Job link copied.\n\n${link}`);
      return;
    }

    showToast("Sharing is unavailable in this browser.");
  };

  const handleNewJob = () => {
    const jobNumber = nextJobNumberRef.current;
    const id = `job-${jobNumber}`;
    const title = `Untitled job ${jobNumber}`;
    nextJobNumberRef.current += 1;
    setJobs((prev) => [...prev, { id, title, status: "Draft" }]);
    setActiveJobId(id);
    setProjectName(title);
    setJobDescriptions((previous) => ({ ...previous, [id]: "" }));
    setActiveSection("social");
    setMarketAudience(preset.footprintShort);
    setBrandUrl(client?.website ?? preset.url);
    setFootprint(client?.targetAudience ?? preset.footprint);
    setAesthetic(preset.aesthetic);
    setToneVal(preset.toneVal);
    setToneLabel(preset.toneText);
    setJobCopy(workspace.phaseContent.launch);
    setActiveMainTab("job");
    setJobView("editor");
    showToast("New job draft created.");
  };

  const handleSelectJob = (jobId: string) => {
    const selectedJob = jobs.find((job) => job.id === jobId);
    if (!selectedJob) return;

    setActiveJobId(selectedJob.id);
    setProjectName(selectedJob.title);
    const realJob = availableJobs.find((job) => job.slug === selectedJob.id);
    setJobLeadSlug(realJob?.leadUserId ?? "");
  };

  const handleOpenJob = (job: JobListItem) => {
    handleSelectJob(job.id);
    setActiveMainTab("job");
    setJobView("editor");
  };

  const handleProjectNameChange = (title: string) => {
    setProjectName(title);
    setJobs((prev) =>
      prev.map((job) =>
        job.id === activeJobId ? { ...job, title } : job
      )
    );
  };

  const handleJobStatusChange = (status: JobWorkspaceStatus) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === activeJobId ? { ...job, status } : job
      )
    );
  };

  const updateTone = (val: number) => {
    setToneVal(val);
    setDesignDirty(true);
    const toneMap: Record<number, string> = {
      1: "Direct & Sharp",
      2: "Conversational & Familiar",
      3: "Expressive & Cultural",
      4: "Premium & Editorial",
    };
    setToneLabel(toneMap[val] || "Conversational");
  };

  const [jobCopy, setJobCopy] = useState<PhaseContent>(workspace.phaseContent.launch);
  const phase = jobCopy;
  const creativePreview =
    activeSection === "social"
      ? {
        src: workspace.creativePreviews.social.src,
        alt: workspace.creativePreviews.social.alt,
        format: "SOCIAL & DIGITAL",
        title: phase.socialTitle,
        description: phase.socialBody,
        cta: phase.socialCta,
        aspect: "aspect-square",
      }
      : activeSection === "film"
        ? {
          src: workspace.creativePreviews.film.src,
          alt: workspace.creativePreviews.film.alt,
          format: "30 SECOND FILM",
          title: phase.filmTitle,
          description: phase.filmDesc,
          cta: phase.filmCta,
          aspect: "aspect-video",
        }
        : activeSection === "audio"
          ? {
            src: workspace.creativePreviews.audio.src,
            alt: workspace.creativePreviews.audio.alt,
            format: "RADIO SPOT",
            title: phase.audioTitle,
            description: phase.audioDesc,
            cta: phase.audioCta,
            aspect: "aspect-[4/5]",
          }
          : activeSection === "ooh"
            ? {
              src: workspace.creativePreviews.ooh.src,
              alt: workspace.creativePreviews.ooh.alt,
              format: `${preset.oohFormat} / ${preset.oohPlacement}`,
              title: phase.oohTitle,
              description: phase.oohDesc,
              cta: phase.oohCta,
              aspect: "aspect-[16/7]",
            }
            : activeSection === "print"
              ? {
                src: workspace.creativePreviews.print.src,
                alt: workspace.creativePreviews.print.alt,
                format: "PRINT",
                title: phase.printTitle,
                description: phase.printDesc,
                cta: phase.printCta,
                aspect: "aspect-[3/4]",
              }
              : null;
  const activeJob =
    jobs.find((job) => job.id === activeJobId) ?? jobs[0];
  const jobDescription = jobDescriptions[activeJobId] ?? "";
  const activeJobRecord = availableJobs.find((job) => job.slug === activeJob?.id);
  const overviewDescription = client?.description?.trim() || jobDescription.trim() || activeJobRecord?.summary || "No description available yet.";
  const jobLeadUser = availableUsers.find((user) => user.slug === jobLeadSlug);
  const updateJobLead = async (nextSlug: string) => {
    setJobLeadSlug(nextSlug);
    if (!activeJobRecord) return;
    try {
      await updateDoc(doc(firebaseDb, await jobsCollection(), activeJobRecord.slug), {
        leadUserId: nextSlug || null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Unable to update job lead", error);
      showToast("Couldn’t update the job lead. Try again.");
    }
  };
  const updateJobDescription = (value: string) =>
    setJobDescriptions((previous) => ({ ...previous, [activeJobId]: value }));
  const activeJobMediaPlan = workspace.jobMediaPlans[activeJobId];
  const activeCaseStudy = caseStudies[activeJobId] ?? caseStudyFromJob();
  const updateCaseStudy = (field: keyof CaseStudyDraft, value: string) =>
    setCaseStudies((previous) => ({
      ...previous,
      [activeJobId]: { ...activeCaseStudy, [field]: value },
    }));
  const updateCopy = (field: keyof PhaseContent, value: string) =>
    setJobCopy((prev) => ({ ...prev, [field]: value }));

  const getContrastTextColor = (hex: string) => {
    const value = hex.replace("#", "");
    const red = parseInt(value.substring(0, 2), 16);
    const green = parseInt(value.substring(2, 4), 16);
    const blue = parseInt(value.substring(4, 6), 16);
    return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? "#0f172a" : "#f8fafc";
  };

  const selectedFonts = FONT_STACKS[fontPairing] ?? FONT_STACKS[fontOptions[0]];

  const workspaceTabs: {
    view: OneUtilityWorkspaceView;
    label: string;
    onSelect: () => void;
  }[] = [
    {
      view: "job",
      label: "Jobs",
      onSelect: () => {
        setActiveMainTab("job");
        setJobView("home");
      },
    },
    { view: "tasks", label: "Tasks", onSelect: () => setActiveMainTab("tasks") },
    { view: "moodboard", label: "Media", onSelect: () => setActiveMainTab("moodboard") },
    { view: "creators", label: "Team", onSelect: () => setActiveMainTab("creators") },
    { view: "brand", label: "About", onSelect: () => setActiveMainTab("brand") },
  ];
  const activeWorkspaceTabRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeWorkspaceTabRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeMainTab]);

  const workspaceNavigation = (
    <nav aria-label="Client workspace">
      <div role="tablist" className="no-scrollbar flex touch-pan-x items-center gap-1 overflow-x-auto overscroll-x-contain border-b border-border/70 px-0.5">
        {workspaceTabs.map((tab) => {
          const isActive = activeMainTab === tab.view;
          return (
            <button
              type="button"
              role="tab"
              key={tab.view}
              ref={isActive ? activeWorkspaceTabRef : undefined}
              onClick={tab.onSelect}
              aria-selected={isActive}
              className={`relative flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 text-[13px] font-semibold tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${isActive
                ? "text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
  const workspaceHeroProps = {
    clientName,
    heroImage: jobImageFor(activeJobId, availableJobs),
    clientProfileImage,
    onHome: () => setActiveMainTab("job"),
    creators: selectedCreators,
    navigation: workspaceNavigation,
    shareAction: (
      <button
        type="button"
        onClick={handleShareJob}
        aria-label="Share"
        className="flex h-7 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        Share
      </button>
    ),
  };
  const activeWorkspaceTitle =
    workspaceTabs.find((tab) => tab.view === activeMainTab)?.label ?? "Jobs";

  const jobSubTabs: { id: typeof jobSubTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "case-study", label: "Case study" },
    { id: "strategy", label: "Strategy" },
    { id: "creative", label: "Creatives" },
    { id: "marketing", label: "Marketing" },
  ];

  const activeSubTabRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeSubTabRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [jobSubTab]);

  return (
    <div
      className="utility-workspace min-h-screen overflow-x-hidden px-0 py-2 text-foreground antialiased font-sans sm:p-2 [&_h1]:[font-family:var(--workspace-font-heading)] [&_h2]:[font-family:var(--workspace-font-heading)] [&_h3]:[font-family:var(--workspace-font-heading)] [&_h4]:[font-family:var(--workspace-font-heading)] [&_h5]:[font-family:var(--workspace-font-heading)] [&_h6]:[font-family:var(--workspace-font-heading)]"
      style={
        {
          "--primary": primaryColor,
          "--ring": primaryColor,
          "--primary-foreground": getContrastTextColor(primaryColor),
          "--font-sans": selectedFonts.body,
          "--workspace-font-body": selectedFonts.body,
          "--workspace-font-heading": selectedFonts.heading,
        } as React.CSSProperties
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed inset-x-4 bottom-4 z-50 flex items-start gap-3 rounded-xl border border-border bg-card px-5 py-4 font-sans text-sm text-card-foreground shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-sm">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="whitespace-pre-line leading-relaxed">{toastMessage}</div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {/* MAIN CANVAS: TABS + CONTENT */}
        <main className="order-1">
          <div className="px-4 pt-2 sm:px-6">
            <div className="mx-auto w-full max-w-7xl">
              <ClientWorkspaceHero {...workspaceHeroProps} title={activeWorkspaceTitle} />
            </div>
          </div>

          {/* JOB VIEW */}
          {activeMainTab === "job" && (
            jobView === "home" ? (
              <ClientWorkspaceContent>
                  <ClientWorkspaceHeading
                    title="Jobs"
                    actions={
                      <>
                        <button
                          type="button"
                          onClick={handleNewJob}
                          className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          New
                        </button>
                      </>
                    }
                  />
                  <FilterBar
                    panelId="client-job-filter-panel"
                    tabs={CLIENT_JOB_FILTERS}
                    activeTab={jobFilter}
                    onTabChange={setJobFilter}
                    tabsLabel="Status"
                    search={jobSearch}
                    onSearchChange={setJobSearch}
                    searchPlaceholder="Search jobs"
                    sortOptions={CLIENT_JOB_SORTS}
                    activeSort={jobSort}
                    onSortChange={setJobSort}
                    resultCount={plural(visibleJobs.length, "job")}
                    view={jobListView}
                    onViewChange={setJobListView}
                    className="my-0"
                  />
                  <section id="client-job-filter-panel" aria-label={`${clientName} jobs`} className="pt-2">
                    {visibleJobs.length > 0 ? (
                      jobListView === "cards" ? (
                        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
                          {visibleJobs.map((job) => {
                            const record = availableJobs.find((item) => item.slug === job.id);
                            return (
                              <li key={job.id}>
                                <DashboardCard
                                  className="h-full"
                                  actions={record ? <DashboardCardActions collection="jobs" slug={record.slug} titleField="title" title={record.title ?? record.name} copyLabel="Duplicate" /> : undefined}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleOpenJob(job)}
                                    className="group flex h-full w-full flex-col text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                  >
                                    <div className="h-28 shrink-0 overflow-hidden bg-muted">
                                      <ImageWithFallback
                                        src={jobImageFor(job.id, availableJobs)}
                                        alt={record?.imageAlt ?? job.title}
                                        className="h-full w-full object-cover"
                                        iconClassName="h-10 w-10"
                                      />
                                    </div>
                                    <div className="flex min-h-[170px] flex-col gap-3 p-4">
                                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                                        {clientName}
                                      </span>
                                      <h3 className="m-0 line-clamp-2 text-[16px] font-semibold leading-tight group-hover:text-primary">
                                        {job.title}
                                      </h3>
                                      <div className="mt-auto flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
                                        <DashboardBadge tone={job.status === "Live" ? "active" : "neutral"}>
                                          {job.status}
                                        </DashboardBadge>
                                        <span>{record?.category ?? "Job"}</span>
                                      </div>
                                    </div>
                                  </button>
                                </DashboardCard>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table className="w-full border-collapse">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Job</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Year</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {visibleJobs.map((job) => {
                                const record = availableJobs.find((item) => item.slug === job.id);
                                return (
                                  <ClickableTableRow key={job.id} label={`Open job ${job.title}`} onActivate={() => handleOpenJob(job)}>
                                    <TableCell className="px-4 py-3.5 font-semibold">
                                      <button type="button" onClick={() => handleOpenJob(job)} className="text-left text-foreground hover:text-primary focus-visible:text-primary">
                                        {job.title}
                                      </button>
                                    </TableCell>
                                    <TableCell className="px-4 py-3.5"><DashboardBadge tone={job.status === "Live" ? "active" : "neutral"}>{job.status}</DashboardBadge></TableCell>
                                    <TableCell className="px-4 py-3.5 text-muted-foreground">{record?.category ?? "—"}</TableCell>
                                    <TableCell className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{record?.year ?? "—"}</TableCell>
                                    <TableCell className="px-4 py-3.5 text-right">
                                      {record ? (
                                        <span className="inline-flex">
                                          <DashboardCardActions
                                            collection="jobs"
                                            slug={record.slug}
                                            titleField="title"
                                            title={record.title ?? record.name}
                                            copyLabel="Duplicate"
                                          />
                                        </span>
                                      ) : null}
                                    </TableCell>
                                  </ClickableTableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )
                    ) : (
                      <p className="m-0 py-8 text-center text-sm text-muted-foreground">
                        No jobs match this search or filter.
                      </p>
                    )}
                  </section>
              </ClientWorkspaceContent>
            ) : (
              <ClientWorkspaceContent>
                {/* TAB CONTENT AREA */}
                    <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-border pb-3">
                      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:flex-1">
                        <button
                          onClick={() => setJobView("home")}
                          aria-label="Back to jobs"
                          className="grid h-10 w-10 flex-none place-items-center rounded-md border border-border text-foreground transition hover:bg-muted hover:text-primary sm:h-8 sm:w-8"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={projectName}
                          onChange={(e) => handleProjectNameChange(e.target.value)}
                          aria-label="Job title"
                          className="min-w-0 flex-1 bg-transparent border-b border-transparent hover:border-border focus:border-primary px-1 py-0.5 text-sm font-semibold tracking-tight text-foreground outline-none transition placeholder:text-muted-foreground"
                        />
                      </div>

                      {/* JOB SUB-TABS */}
                      <div
                        role="tablist"
                        aria-label="Job sections"
                        className="no-scrollbar -mx-4 flex w-full items-center gap-1 overflow-x-auto px-4 text-sm sm:mx-0 sm:w-auto sm:px-0"
                      >
                        {jobSubTabs.map((tab, index) => {
                          const isActive = jobSubTab === tab.id;
                          return (
                            <React.Fragment key={tab.id}>
                              {index > 0 && (
                                <span aria-hidden="true" className="hidden shrink-0 text-muted-foreground/50 sm:inline">
                                  ›
                                </span>
                              )}
                              <button
                                role="tab"
                                aria-selected={isActive}
                                ref={isActive ? activeSubTabRef : undefined}
                                onClick={() => setJobSubTab(tab.id)}
                                className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 font-medium transition ${isActive
                                  ? "bg-muted font-semibold text-foreground sm:bg-transparent"
                                  : "text-muted-foreground hover:text-foreground"
                                  }`}
                              >
                                {tab.label}
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* JOB SUB-TAB: OVERVIEW */}
                    {jobSubTab === "overview" && (
                      <div className="py-4">
                        <div className="space-y-4 max-w-2xl">
                          <CopyField
                            label="Job name"
                            value={projectName}
                            onChange={handleProjectNameChange}
                          />

                          <CopyField
                            label="Job description"
                            value={jobDescription}
                            onChange={updateJobDescription}
                            textarea
                            rows={4}
                          />

                          <div className="space-y-1.5">
                            <label htmlFor="jobStatusOverview" className="text-sm font-medium text-foreground">
                              Status
                            </label>
                            <select
                              id="jobStatusOverview"
                              value={activeJob?.status ?? "Draft"}
                              onChange={(e) => handleJobStatusChange(e.target.value as JobWorkspaceStatus)}
                              className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                            >
                              {jobWorkspaceStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor="jobLeadOverview" className="text-sm font-medium text-foreground">
                              Job lead
                            </label>
                            <select
                              id="jobLeadOverview"
                              value={jobLeadSlug}
                              onChange={(e) => void updateJobLead(e.target.value)}
                              className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                            >
                              <option value="">Unassigned</option>
                              {selectedCreators.map((person) => (
                                <option key={person.slug} value={person.slug}>
                                  {person.name}
                                </option>
                              ))}
                            </select>
                            {selectedCreators.length === 0 ? (
                              <p className="m-0 text-xs text-muted-foreground">Add people to the Team tab first to pick a lead.</p>
                            ) : null}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label htmlFor="jobStart" className="text-sm font-medium text-foreground">Job start</label>
                              <input
                                type="date"
                                id="jobStart"
                                value={jobStart}
                                onChange={(e) => setJobStart(e.target.value)}
                                className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor="jobEnd" className="text-sm font-medium text-foreground">Job end</label>
                              <input
                                type="date"
                                id="jobEnd"
                                value={jobEnd}
                                onChange={(e) => setJobEnd(e.target.value)}
                                className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor="jobDeadline" className="text-sm font-medium text-foreground">Deadline</label>
                              <input
                                type="date"
                                id="jobDeadline"
                                value={jobDeadline}
                                onChange={(e) => setJobDeadline(e.target.value)}
                                className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* JOB SUB-TAB: CASE STUDY */}
                    {jobSubTab === "case-study" && (
                      <div className="py-4">
                        <div className="max-w-2xl space-y-5">
                          <div>
                            <h3 className="m-0 text-base font-semibold text-foreground">Job case study</h3>
                            <p className="mb-0 mt-1 text-sm leading-[1.45] text-muted-foreground">
                              Edit the strategic narrative that appears on the published job record.
                            </p>
                          </div>
                          <CopyField label="Challenge" value={activeCaseStudy.challenge} onChange={(value) => updateCaseStudy("challenge", value)} textarea rows={4} />
                          <CopyField label="Insight" value={activeCaseStudy.insight} onChange={(value) => updateCaseStudy("insight", value)} textarea rows={4} />
                          <CopyField label="Strategy" value={activeCaseStudy.strategy} onChange={(value) => updateCaseStudy("strategy", value)} textarea rows={4} />
                          <CopyField label="Platform" value={activeCaseStudy.platform} onChange={(value) => updateCaseStudy("platform", value)} textarea rows={3} hint="Separate channels with commas" />
                          <CopyField label="Execution" value={activeCaseStudy.execution} onChange={(value) => updateCaseStudy("execution", value)} textarea rows={4} />
                          <CopyField label="Outcome" value={activeCaseStudy.outcome} onChange={(value) => updateCaseStudy("outcome", value)} textarea rows={4} />
                        </div>
                      </div>
                    )}

                    {/* JOB SUB-TAB: STRATEGY */}
                    {jobSubTab === "strategy" && (
                      <StrategyEditor markdown={workspace.strategyMarkdown} />
                    )}

                    {/* JOB SUB-TAB: CREATIVES GALLERY */}
                    {jobSubTab === "creative" && (
                      <div className="py-4">
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                          {Object.values(workspace.creativePreviews).map((item, index) => (
                            <button
                              key={`${item.src}-${item.alt}-${index}`}
                              type="button"
                              onClick={() => setSelectedCreative(item)}
                              aria-label={`Open ${item.alt}`}
                              className="aspect-square overflow-hidden rounded-xl bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            >
                              <ImageWithFallback
                                src={item.src}
                                alt={item.alt}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>

                        {selectedCreative ? (
                          <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
                            role="dialog"
                            aria-modal="true"
                            aria-label={selectedCreative.alt}
                            onClick={() => setSelectedCreative(null)}
                          >
                            <button
                              type="button"
                              aria-label="Close image"
                              onClick={() => setSelectedCreative(null)}
                              className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                              <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <div className="max-h-full max-w-full" onClick={(event) => event.stopPropagation()}>
                              <ImageWithFallback
                                src={selectedCreative.src}
                                alt={selectedCreative.alt}
                                className="max-h-[calc(100vh-4rem)] max-w-full rounded-xl object-contain"
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* JOB SUB-TAB: MARKETING */}
                    {jobSubTab === "marketing" && (
                      <div className="space-y-6 py-4">
                        {/* MEDIA BUYING */}
                        <section className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                              <Megaphone className="w-3.5 h-3.5" />
                            </span>
                            <h3 className="text-base font-semibold text-foreground">Media buying</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeJobMediaPlan?.mediaBuying.map((card, index) => {
                              const Icon = [BarChart3, TrendingUp, ScanLine][index] ?? BarChart3;
                              return (
                                <div key={card.title} className="rounded-2xl p-5 bg-card border border-border shadow-sm space-y-3">
                                  <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                                    <Icon className="w-3.5 h-3.5" /> {card.title}
                                  </span>
                                  <ul className="text-sm space-y-1.5">
                                    {card.rows.map((row) => (
                                      <li key={row.label} className="flex justify-between gap-2"><span className="text-muted-foreground">{row.label}</span><span className="text-foreground font-medium">{row.value}</span></li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </section>

                        {/* INFLUENCER MARKETING */}
                        <section className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                              <Users className="w-3.5 h-3.5" />
                            </span>
                            <h3 className="text-base font-semibold text-foreground">Influencer marketing</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeJobMediaPlan?.influencerMarketing.map((card, index) => {
                              const Icon = [Users, Film, BarChart3][index] ?? Users;
                              return (
                                <div key={card.title} className="rounded-2xl p-5 bg-card border border-border shadow-sm space-y-3">
                                  <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                                    <Icon className="w-3.5 h-3.5" /> {card.title}
                                  </span>
                                  <ul className="text-sm space-y-1.5">
                                    {card.rows.map((row) => (
                                      <li key={row.label} className="flex justify-between gap-2"><span className="text-muted-foreground">{row.label}</span><span className="text-foreground font-medium">{row.value}</span></li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      </div>
                    )}
              </ClientWorkspaceContent>
            )
          )}

          {/* TASKS VIEW */}
          {activeMainTab === "tasks" && (
            <ClientWorkspaceContent>
              <ClientWorkspaceHeading
                title="Tasks"
                actions={<NewTaskDialog assignees={assignees} createdBy={createdBy} createdByName={createdByName} initialClientId={slug} onCreated={() => setTaskRefreshToken((value) => value + 1)} />}
              />
              {tasksLoading ? (
                <p className="py-10 text-sm text-muted-foreground">Loading tasks…</p>
              ) : clientTasks.length ? (
                <ul className="m-0 divide-y divide-border border-y border-border p-0">
                  {clientTasks.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/dashboard/work/${encodeURIComponent(task.id)}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-4 text-foreground hover:text-primary"
                      >
                        <span className="min-w-0">
                          <span className="block font-semibold">{task.title}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {task.assignedToName ? `${task.assignedToName} · ` : ""}
                            {task.dueDate ? `Due ${formatTaskDate(task.dueDate)}` : "No due date"}
                          </span>
                        </span>
                        <TaskStatusBadge status={task.status} overdue={isOverdue(task)} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-10 text-sm text-muted-foreground">No tasks have been added for this client yet.</p>
              )}
            </ClientWorkspaceContent>
          )}

          {/* OVERVIEW VIEW */}
          {activeMainTab === "overview" && (
            <ClientWorkspaceContent>
                <ClientWorkspaceHeading title="Overview" />
                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_230px]">
                  <div className="space-y-8">
                    <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                      <div className="aspect-video overflow-hidden rounded-sm bg-muted">
                        {workspace.overviewVideo ? (
                          <video
                            className="h-full w-full object-cover"
                            controls
                            preload="metadata"
                            poster={jobImageFor(activeJobId, availableJobs)}
                            aria-label={`${clientName} job film`}
                          >
                            <source src={workspace.overviewVideo} type="video/mp4" />
                            Your browser does not support this video.
                          </video>
                        ) : (
                          <EmptyThumbnail
                            className="h-full w-full"
                            iconClassName="h-12 w-12 text-muted-foreground/35"
                            label="No job video available"
                          />
                        )}
                      </div>
                      <div className="flex items-center">
                        <p className="m-0 text-sm leading-relaxed text-muted-foreground">{overviewDescription}</p>
                      </div>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2">
                  <section className="space-y-3" aria-labelledby="latest-jobs-heading">
                    <div className="flex items-center justify-between gap-3">
                      <h3 id="latest-jobs-heading" className="m-0 text-base font-semibold text-foreground">Latest jobs</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMainTab("job");
                          setJobView("home");
                        }}
                        className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        View all
                      </button>
                    </div>
                    {latestJobs.length ? (
                      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        {latestJobs.map((job) => {
                          const record = availableJobs.find((item) => item.slug === job.id);
                          return (
                            <DashboardCard key={job.id}>
                              <button
                                type="button"
                                onClick={() => handleOpenJob(job)}
                                className="group flex w-full items-center gap-3 p-3 text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                              >
                                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                                  <ImageWithFallback
                                    src={jobImageFor(job.id, availableJobs)}
                                    alt={record?.imageAlt ?? job.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <h4 className="m-0 truncate text-sm font-semibold group-hover:text-primary">{job.title}</h4>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <DashboardBadge tone={job.status === "Live" ? "active" : "neutral"}>{job.status}</DashboardBadge>
                                    <span className="truncate">{record?.category ?? "Job"}</span>
                                  </div>
                                </div>
                              </button>
                            </DashboardCard>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="m-0 text-sm text-muted-foreground">No jobs yet.</p>
                    )}
                  </section>

                  <section className="space-y-3" aria-labelledby="latest-creators-heading">
                    <div className="flex items-center justify-between gap-3">
                      <h3 id="latest-creators-heading" className="m-0 text-base font-semibold text-foreground">Latest team</h3>
                      <button
                        type="button"
                        onClick={() => setActiveMainTab("creators")}
                        className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        View all
                      </button>
                    </div>
                    {latestCreators.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {latestCreators.map((creator) => (
                          <DashboardCard key={creator.slug}>
                            <Link
                              href={`/dashboard/discover/${creator.slug}`}
                              className="group flex items-center gap-3 p-3 text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            >
                              <ImageWithFallback
                                src={creator.profileImage ?? creator.featuredImage ?? "/images/projects/project-placeholder.svg"}
                                alt={`${creator.name} profile`}
                                className="h-12 w-12 shrink-0 rounded-full bg-muted object-cover"
                                fallbackClassName="h-12 w-12 rounded-full"
                                fallbackSeed={creator.name}
                              />
                              <div className="min-w-0 space-y-1">
                                <h4 className="m-0 truncate text-sm font-semibold group-hover:text-primary">{creator.name}</h4>
                                <p className="m-0 truncate text-xs text-muted-foreground">{creator.category} · {creator.availability}</p>
                              </div>
                            </Link>
                          </DashboardCard>
                        ))}
                      </div>
                    ) : (
                      <p className="m-0 text-sm text-muted-foreground">No team assigned yet.</p>
                    )}
                  </section>
                    </div>
                  </div>

                  <aside className="rounded-2xl border border-border bg-background p-5 lg:min-h-full">
                    <dl className="m-0 space-y-5">
                      <div className="space-y-1">
                        <dt className="text-[10px] uppercase text-muted-foreground">Client</dt>
                        <dd className="m-0 text-[13px] font-medium text-foreground">{clientName}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-[10px] uppercase text-muted-foreground">Job lead</dt>
                        <dd className="m-0 text-[13px] font-medium text-foreground">
                          {jobLeadUser ? (
                            <Link
                              href={userHref(jobLeadUser, isCreatorUser(jobLeadUser) ? "creator" : "team")}
                              className="text-foreground underline decoration-border underline-offset-4 hover:text-primary"
                            >
                              {jobLeadUser.name}
                            </Link>
                          ) : (
                            "To be confirmed"
                          )}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-[10px] uppercase text-muted-foreground">Target audience</dt>
                        <dd className="m-0 break-words text-[13px] font-medium leading-relaxed text-foreground">{marketAudience}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-[10px] uppercase text-muted-foreground">Number of jobs</dt>
                        <dd className="m-0 text-[13px] font-medium text-foreground">{jobs.length}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-[10px] uppercase text-muted-foreground">Date created</dt>
                        <dd className="m-0 text-[13px] font-medium text-foreground">{longDate(dateOnly(activeJobRecord?.createdAt))}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-[10px] uppercase text-muted-foreground">Date modified</dt>
                        <dd className="m-0 text-[13px] font-medium text-foreground">{longDate(dateOnly(activeJobRecord?.updatedAt))}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-[10px] uppercase text-muted-foreground">Status</dt>
                        <dd className="m-0 flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {activeJob?.status ?? "Draft"}
                        </dd>
                      </div>
                    </dl>
                  </aside>
                </div>
            </ClientWorkspaceContent>
          )}

          {/* PROFILE VIEW */}
          {activeMainTab === "brand" && (
            <ClientWorkspaceContent>
                <ClientWorkspaceHeading title="About" />
                <div className="grid w-full max-w-4xl grid-cols-1 items-start gap-6 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8">
                  <nav aria-label="Profile sections" className="border-b border-border/70 md:border-b-0 md:border-r md:pr-4">
                    <div role="tablist" aria-orientation="vertical" className="flex flex-col gap-1">
                      {[
                        { id: "company" as const, label: "About" },
                      ].map((section) => {
                        const isActive = profileSection === section.id;
                        return (
                          <button
                            key={section.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`profile-panel-${section.id}`}
                            onClick={() => setProfileSection(section.id)}
                            className={`relative flex min-h-10 w-full items-center justify-start whitespace-nowrap rounded-md px-3 text-left text-[13px] font-semibold tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 md:after:bottom-3 md:after:left-auto md:after:right-[-1px] md:after:top-3 md:after:h-auto md:after:w-0.5 ${isActive
                              ? "bg-primary/5 text-primary after:bg-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                          >
                            {section.label}
                          </button>
                        );
                      })}
                    </div>
                  </nav>

                  <div className="min-w-0">
                  {profileSection === "company" && (
                  <section id="profile-panel-company" role="tabpanel" aria-label="About" className="space-y-5">
                    <div className="border-b border-border pb-3">
                      <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
                        About
                      </span>
                      <h2 className="text-base font-semibold text-foreground mt-0.5">Client information</h2>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="clientNameInput" className="text-sm font-medium text-foreground">Name</label>
                      <input id="clientNameInput" type="text" value={clientNameInput} onChange={(e) => { setClientNameInput(e.target.value); setBusinessProfileDirty(true); }} className="w-full border-0 border-b border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-0" />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label htmlFor="clientIndustry" className="text-sm font-medium text-foreground">Industry</label>
                        <input id="clientIndustry" type="text" value={clientIndustry} onChange={(e) => { setClientIndustry(e.target.value); setBusinessProfileDirty(true); }} className="w-full border-0 border-b border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-0" />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="clientDate" className="text-sm font-medium text-foreground">First live date</label>
                        <input id="clientDate" type="date" value={clientDate} onChange={(e) => { setClientDate(e.target.value); setBusinessProfileDirty(true); }} className="w-full border-0 border-b border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-0" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="brandUrl" className="text-sm font-medium text-foreground">
                        Website
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="brandUrl"
                          value={brandUrl}
                          onChange={(e) => {
                            setBrandUrl(e.target.value);
                            setBusinessProfileDirty(true);
                          }}
                          className="w-full bg-background border-0 border-b border-input focus:border-primary focus:ring-0 rounded-none px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="footprintInput" className="text-sm font-medium text-foreground">
                        Target Audience
                      </label>
                      <input
                        type="text"
                        id="footprintInput"
                        value={footprint}
                        onChange={(e) => {
                          setFootprint(e.target.value);
                          setBusinessProfileDirty(true);
                        }}
                        className="w-full bg-background border-0 border-b border-input focus:border-primary focus:ring-0 rounded-none px-3 py-2 text-sm text-foreground outline-none transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="clientDescription" className="text-sm font-medium text-foreground">
                        Description
                      </label>
                      <textarea
                        id="clientDescription"
                        rows={4}
                        value={clientDescription}
                        onChange={(e) => {
                          setClientDescription(e.target.value);
                          setBusinessProfileDirty(true);
                        }}
                        className="min-h-[112px] w-full resize-y border-0 border-b border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-0"
                        placeholder="Add a short description of this client"
                      />
                    </div>

                    <div className="border-t border-border pt-5">
                      <h3 className="m-0 text-sm font-semibold text-foreground">Company information</h3>
                      <div className="mt-4 grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="clientTeamSize" className="text-sm font-medium text-foreground">Team size</label>
                          <input id="clientTeamSize" type="number" min="0" value={clientTeamSize} onChange={(e) => { setClientTeamSize(e.target.value); setBusinessProfileDirty(true); }} className="w-full border-0 border-b border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-0" />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="clientYearFounded" className="text-sm font-medium text-foreground">Year founded</label>
                          <input id="clientYearFounded" type="number" min="1800" value={clientYearFounded} onChange={(e) => { setClientYearFounded(e.target.value); setBusinessProfileDirty(true); }} className="w-full border-0 border-b border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-0" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-1.5">
                        <label htmlFor="clientLocation" className="text-sm font-medium text-foreground">City / Country</label>
                        <input id="clientLocation" type="text" value={clientLocation} onChange={(e) => { setClientLocation(e.target.value); setBusinessProfileDirty(true); }} className="w-full border-0 border-b border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-0" />
                      </div>
                      <div className="mt-4 space-y-1.5">
                        <label htmlFor="clientLinkedIn" className="text-sm font-medium text-foreground">LinkedIn</label>
                        <input id="clientLinkedIn" type="url" value={clientLinkedIn} onChange={(e) => { setClientLinkedIn(e.target.value); setBusinessProfileDirty(true); }} className="w-full border-0 border-b border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-0" placeholder="https://linkedin.com/company/" />
                      </div>
                    </div>

                    <div className="border-t border-border pt-5">
                      <h3 className="m-0 text-sm font-semibold text-foreground">Working hours</h3>
                      <div className="mt-4 space-y-1.5">
                        <label htmlFor="clientTimezone" className="text-sm font-medium text-foreground">Client time zone</label>
                        <input id="clientTimezone" type="text" value={clientTimezone} onChange={(e) => { setClientTimezone(e.target.value); setBusinessProfileDirty(true); }} className="w-full border-0 border-b border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-0" placeholder="Los Angeles (8 hrs behind)" />
                      </div>
                      <div className="mt-4 grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="clientHours" className="text-sm font-medium text-foreground">Client hours</label>
                          <input id="clientHours" type="text" value={clientHours} onChange={(e) => { setClientHours(e.target.value); setBusinessProfileDirty(true); }} className="w-full border-0 border-b border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-0" placeholder="09:00 – 17:00" />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="clientHoursConverted" className="text-sm font-medium text-foreground">Client hours in our time</label>
                          <input id="clientHoursConverted" type="text" value={clientHoursConverted} onChange={(e) => { setClientHoursConverted(e.target.value); setBusinessProfileDirty(true); }} className="w-full border-0 border-b border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-0" placeholder="17:00 – 01:00 Lagos" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end border-t border-border pt-4">
                      <button
                        type="button"
                        onClick={() => void handleSaveBusinessProfile()}
                        disabled={!businessProfileDirty || businessProfileSaving}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Save className="h-4 w-4" /> {businessProfileSaving ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </section>

                  )}

                  {profileSection === "design" && (
                  <section id="profile-panel-design" role="tabpanel" aria-label="Design" className="space-y-5">
                    {/* BRAND & DESIGN */}
                    <div className="border-b border-border pb-3">
                      <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
                        Design
                      </span>
                      <h2 className="text-base font-semibold text-foreground mt-0.5">Brand</h2>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="brandArchetype" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" /> Brand archetype
                      </label>
                      <select
                        id="brandArchetype"
                        value={brandArchetype}
                        onChange={(e) => {
                          setBrandArchetype(e.target.value);
                          setDesignDirty(true);
                        }}
                        className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                      >
                        {[
                          "The Everyman",
                          "The Caregiver",
                          "The Ruler",
                          "The Creator",
                          "The Innocent",
                          "The Sage",
                          "The Explorer",
                          "The Hero",
                          "The Outlaw",
                          "The Magician",
                          "The Lover",
                          "The Jester",
                        ].map((archetype) => (
                          <option key={archetype} value={archetype}>
                            {archetype}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* DESIGN SYSTEM, PALETTE, AESTHETIC, TONE */}
                    <div className="space-y-5 border-t border-border pt-5">
                      <div>
                        <h2 className="text-base font-semibold text-foreground">Design</h2>
                      </div>

                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground block uppercase font-mono">Colors</span>
                        <p className="text-sm text-muted-foreground">Click a swatch to pick a colour.</p>
                        <div className="flex flex-wrap items-stretch gap-2 pt-1">
                          {palette.map((hex, i) => (
                            <div key={i} className="group relative flex-1 min-w-[64px]">
                              <label
                                className="relative flex h-16 items-center justify-center rounded-lg border border-border text-xs font-mono font-bold cursor-pointer"
                                style={{ backgroundColor: hex, color: getContrastTextColor(hex) }}
                              >
                                {hex.toUpperCase()}
                                <input
                                  type="color"
                                  value={hex}
                                  onChange={(e) => updatePaletteColor(i, e.target.value)}
                                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                  aria-label={`Palette colour ${i + 1}`}
                                />
                              </label>
                              {palette.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePaletteColor(i)}
                                  aria-label="Remove colour"
                                  className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 place-items-center rounded-full bg-foreground text-sm leading-none text-background group-hover:grid"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addPaletteColor}
                            aria-label="Add colour"
                            className="grid h-16 w-10 shrink-0 place-items-center rounded-lg border border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-foreground"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <label htmlFor="fontPairing" className="text-sm text-muted-foreground block uppercase font-mono">
                          Typography
                        </label>
                        <select
                          id="fontPairing"
                          value={fontPairing}
                          onChange={(e) => {
                            setFontPairing(e.target.value);
                            setDesignDirty(true);
                          }}
                          className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm font-semibold text-foreground outline-none transition"
                        >
                          {fontOptions.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1.5">
                          <p
                            className="text-2xl font-bold leading-tight text-foreground"
                            style={{ fontFamily: (FONT_STACKS[fontPairing] ?? FONT_STACKS[fontOptions[0]]).heading }}
                          >
                            {workspace.fontPreview.heading}
                          </p>
                          <p
                            className="text-sm text-muted-foreground leading-relaxed"
                            style={{ fontFamily: (FONT_STACKS[fontPairing] ?? FONT_STACKS[fontOptions[0]]).body }}
                          >
                            {workspace.fontPreview.body}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-border">
                        <label htmlFor="aestheticSelect" className="text-sm font-medium text-foreground flex items-center gap-1.5 pt-3">
                          <Palette className="w-3.5 h-3.5 text-primary" /> Aesthetic direction
                        </label>
                        <select
                          id="aestheticSelect"
                          value={aesthetic}
                          onChange={(e) => {
                            setAesthetic(e.target.value);
                            setDesignDirty(true);
                          }}
                          className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                        >
                          <option value="brand">Brand-led & adaptive</option>
                          <option value="culture">Bold cultural energy</option>
                          <option value="trust">Trusted corporate clarity</option>
                          <option value="product">Product and demonstration-led</option>
                          <option value="editorial">Editorial storytelling</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="toneSlider" className="text-sm font-medium text-foreground flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Feather className="w-3.5 h-3.5 text-primary" /> Tone dial
                          </span>
                          <span className="text-sm text-primary">{toneLabel}</span>
                        </label>
                        <input
                          type="range"
                          id="toneSlider"
                          min="1"
                          max="4"
                          value={toneVal}
                          onChange={(e) => updateTone(parseInt(e.target.value, 10))}
                          className="w-full accent-primary bg-muted h-1.5 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between gap-1 font-mono text-[10px] text-muted-foreground sm:text-sm">
                          <span>Direct</span>
                          <span>Conversational</span>
                          <span>Expressive</span>
                          <span>Premium</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end border-t border-border pt-4">
                        <button
                          type="button"
                          onClick={handleSaveBrandDna}
                          disabled={!designDirty}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <Save className="h-4 w-4" /> Save
                        </button>
                      </div>
                    </div>
                  </section>
                  )}
                  </div>
                </div>
            </ClientWorkspaceContent>
          )}

          {activeMainTab === "moodboard" && (
            <ClientWorkspaceContent>
                <ClientWorkspaceHeading
                  title="Media"
                  actions={
                    <ClientMediaAddAction
                      jobId={primaryJob?.slug ?? null}
                      clientName={clientName}
                      mediaItems={mediaItems}
                      onSaved={setMediaItems}
                    />
                  }
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {mediaItems.map((image, mediaIndex) => (
                    <DashboardCard
                      key={`${image.src}-${mediaIndex}`}
                      className="h-full"
                      actions={
                        <ClientMediaDeleteAction
                          jobId={primaryJob?.slug ?? null}
                          clientName={clientName}
                          mediaItems={mediaItems}
                          mediaIndex={mediaIndex}
                          onSaved={setMediaItems}
                          onError={showToast}
                        />
                      }
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedMediaIndex(mediaIndex)}
                        className="aspect-square w-full overflow-hidden bg-muted text-left"
                        aria-label={`Open ${image.alt}`}
                      >
                        <ImageWithFallback src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                      </button>
                    </DashboardCard>
                  ))}
                </div>
                {selectedMediaIndex !== null && mediaItems[selectedMediaIndex] ? (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
                    role="dialog"
                    aria-modal="true"
                    aria-label={mediaItems[selectedMediaIndex].alt}
                    onClick={() => setSelectedMediaIndex(null)}
                  >
                    <button
                      type="button"
                      aria-label="Back to media"
                      onClick={() => setSelectedMediaIndex(null)}
                      className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6 sm:top-6"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Close image"
                      onClick={() => setSelectedMediaIndex(null)}
                      className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6 sm:top-6"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedMediaIndex((current) => current === null ? null : current === 0 ? mediaItems.length - 1 : current - 1);
                      }}
                      className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedMediaIndex((current) => current === null ? null : current === mediaItems.length - 1 ? 0 : current + 1);
                      }}
                      className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <div className="max-h-full max-w-full" onClick={(event) => event.stopPropagation()}>
                      <ImageWithFallback
                        src={mediaItems[selectedMediaIndex].src}
                        alt={mediaItems[selectedMediaIndex].alt}
                        className="max-h-[calc(100vh-6rem)] max-w-[calc(100vw-6rem)] rounded-xl object-contain"
                      />
                    </div>
                  </div>
                ) : null}
            </ClientWorkspaceContent>
          )}

          {activeMainTab === "creators" && (
            <ClientWorkspaceContent>
                <ClientWorkspaceHeading
                  title="Team"
                  actions={
                    <>
                      <ClientCreatorAddAction
                        clientSlug={slug}
                        clientName={clientName}
                        creators={availableUsers}
                        selectedSlugs={selectedCreatorSlugs}
                        onSaved={setSelectedCreatorSlugs}
                      />
                    </>
                  }
                />
                <FilterBar
                  panelId="client-creator-filter-panel"
                  search={creatorSearch}
                  onSearchChange={setCreatorSearch}
                  searchPlaceholder="Search team"
                  filters={[
                    {
                      label: "Category",
                      value: creatorCategory,
                      onChange: setCreatorCategory,
                      options: creatorCategoryOptions,
                    },
                  ]}
                  sortOptions={CLIENT_CREATOR_SORTS}
                  activeSort={creatorSort}
                  onSortChange={setCreatorSort}
                  resultCount={plural(visibleCreators.length, "team member")}
                  view={creatorListView}
                  onViewChange={setCreatorListView}
                  className="my-0"
                />
                {selectedCreators.length ? (
                  <section id="client-creator-filter-panel" aria-label={`${clientName} team`} className="pt-2">
                    {visibleCreators.length > 0 ? (
                      creatorListView === "cards" ? (
                        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
                          {visibleCreators.map((creator) => (
                            <li key={creator.slug}>
                              <DashboardCard
                                className="h-full"
                                actions={<UserActions user={creator} variant="creator" listHref={`/admin/clients/${slug}/creators`} compactMenu categoryOptions={knownCreatorCategories(availableUsers)} />}
                              >
                                <Link
                                  href={`/dashboard/discover/${creator.slug}`}
                                  className="group flex h-full flex-col text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                >
                                  <div className="h-28 shrink-0 overflow-hidden bg-muted">
                                    <ImageWithFallback
                                      src={creator.profileImage ?? creator.featuredImage ?? "/images/projects/project-placeholder.svg"}
                                      alt={`${creator.name} profile`}
                                      className="h-full w-full object-cover"
                                      fallbackSeed={creator.name}
                                    />
                                  </div>
                                  <div className="flex min-h-[170px] flex-col gap-3 p-4">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{creator.category}</span>
                                    <h3 className="m-0 line-clamp-2 text-[16px] font-semibold leading-tight group-hover:text-primary">{creator.name}</h3>
                                    <div className="mt-auto flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
                                      <DashboardBadge tone={creator.availability === "open" ? "active" : "neutral"}>{creator.availability}</DashboardBadge>
                                      <span>{!creator.hideRate && creator.rateMin !== null ? creator.dayRate : creator.location}</span>
                                    </div>
                                  </div>
                                </Link>
                              </DashboardCard>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table className="w-full border-collapse">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Creator</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Availability</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Rate</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {visibleCreators.map((creator) => (
                                <ClickableTableRow key={creator.slug} href={`/dashboard/discover/${creator.slug}`} label={`Open creator ${creator.name}`}>
                                  <TableCell className="px-4 py-3.5 font-semibold">
                                    <Link href={`/dashboard/discover/${creator.slug}`} className="inline-flex items-center gap-3 text-foreground no-underline hover:text-primary focus-visible:text-primary">
                                      <ImageWithFallback
                                        src={creator.profileImage ?? creator.featuredImage}
                                        alt=""
                                        className="h-8 w-8 rounded-full bg-muted object-cover"
                                        fallbackClassName="h-8 w-8 rounded-full"
                                        fallbackSeed={creator.name}
                                      />
                                      {creator.name}
                                    </Link>
                                  </TableCell>
                                  <TableCell className="px-4 py-3.5 text-muted-foreground">{creator.category}</TableCell>
                                  <TableCell className="px-4 py-3.5"><DashboardBadge tone={creator.availability === "open" ? "active" : "neutral"}>{creator.availability}</DashboardBadge></TableCell>
                                  <TableCell className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{creator.location || "—"}</TableCell>
                                  <TableCell className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{!creator.hideRate && creator.rateMin !== null ? creator.dayRate : "—"}</TableCell>
                                </ClickableTableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )
                    ) : (
                      <p className="m-0 py-8 text-center text-sm text-muted-foreground">
                        No team members match this search or filter.
                      </p>
                    )}
                  </section>
                ) : (
                  <p className="text-sm text-muted-foreground">No team assigned to this client yet.</p>
                )}
            </ClientWorkspaceContent>
          )}

        </main>
      </div>
    </div>
  );
}
