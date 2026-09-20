"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { EmptyThumbnail, ImageWithFallback } from "@/components/empty-thumbnail";
import { Badge as DashboardBadge } from "@/components/dashboard/ui";
import type { Campaign, CampaignStatus } from "@/lib/campaigns";
import { getClient, getClientWorkspace, type Client } from "@/lib/clients";
import { creatorCategoryOptions as knownCreatorCategories, isCreatorUser, type User } from "@/lib/users";
import { readContentFromFirestore } from "@/lib/firebase/client-content";
import { ClientActions } from "@/components/client-actions";
import { ClientCreatorAddAction } from "@/components/client-creator-add-action";
import { ClientMediaAddAction, ClientMediaDeleteAction } from "@/components/client-media-add-action";
import { ClientWorkspaceContent, ClientWorkspaceHeading } from "@/components/client-workspace-heading";
import { DashboardCard, DashboardCardActions } from "@/components/dashboard-card";
import { FilterBar, type FilterTab, type SortOption, type ViewMode } from "@/components/dashboard/filter-bar";
import { useAuth } from "@/components/auth-provider";
import { UserActions } from "@/components/user-actions";
import { plural } from "@/lib/format";
import { campaignWorkspaceStatuses } from "@/lib/client-data";
import { fontOptions, ctaOptions } from "@/lib/campaign-options";
import { ClientWorkspaceSkeleton } from "@/components/dashboard/loading-skeleton";
import type {
  PhaseContent,
  CampaignListItem,
  CampaignWorkspaceStatus,
} from "@/lib/client-data";

// The public campaign data uses live/pitch/completed; the workspace exposes a
// slightly richer editable set. Map the real status onto that set so the card
// and overview reflect the actual campaign rather than a flat "Draft".
function workspaceStatusFromCampaign(status: CampaignStatus): CampaignWorkspaceStatus {
  if (status === "live") return "Live";
  if (status === "completed") return "Completed";
  return "Pitch";
}

function campaignImageFor(campaignId: string, campaigns: Campaign[]): string {
  return campaigns.find((campaign) => campaign.slug === campaignId)?.image ?? "/images/projects/project-placeholder.svg";
}

type CaseStudyDraft = Pick<Campaign, "challenge" | "insight" | "strategy" | "execution" | "outcome"> & {
  platform: string;
};

function caseStudyFromCampaign(campaign?: Campaign): CaseStudyDraft {
  return {
    challenge: campaign?.challenge ?? "",
    insight: campaign?.insight ?? "",
    strategy: campaign?.strategy ?? "",
    platform: campaign?.platform.join(", ") ?? "",
    execution: campaign?.execution ?? "",
    outcome: campaign?.outcome ?? "",
  };
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
              <Link href="/dashboard/clients" className="transition hover:text-foreground">
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
          alt={`${clientName} campaign`}
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
  const { loading: authLoading, user, isAdmin } = useAuth();
  const [content, setContent] = useState<Awaited<ReturnType<typeof readContentFromFirestore>> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !isAdmin) {
      setLoadError("An admin account is required to load this client workspace.");
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
  }, [authLoading, isAdmin, user]);

  const initialView: OneUtilityWorkspaceView = pathname.endsWith("/campaigns")
    ? "campaign"
    : pathname.endsWith("/brand-dna")
      ? "brand"
      : pathname.endsWith("/moodboard") || pathname.endsWith("/media")
        ? "moodboard"
        : pathname.endsWith("/creators")
          ? "creators"
          : "overview";

  if (loadError) {
    return (
      <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
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
      campaigns={content.campaigns}
      users={content.users}
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
      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
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

type OneUtilityWorkspaceView = "overview" | "campaign" | "brand" | "moodboard" | "creators";
type ClientCampaignFilter = "all" | CampaignWorkspaceStatus;
type ClientCampaignSort = "recent" | "name";
type ClientCreatorSort = "name" | "category" | "availability";

const CLIENT_CAMPAIGN_FILTERS: FilterTab<ClientCampaignFilter>[] = [
  { key: "all", label: "All" },
  ...campaignWorkspaceStatuses.map((status) => ({ key: status, label: status })),
];
const CLIENT_CAMPAIGN_SORTS: SortOption<ClientCampaignSort>[] = [
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
  initialView = "overview",
  clients,
  campaigns: availableCampaigns,
  users: availableUsers,
}: {
  slug: string;
  initialView?: OneUtilityWorkspaceView;
  clients: Client[];
  campaigns: Campaign[];
  users: User[];
}) {
  const client = getClient(slug, clients);
  const clientName = client?.name ?? "Client";
  const workspace = getClientWorkspace(slug, clientName, availableCampaigns);
  const preset = workspace.preset;
  const clientProfileImage = client?.profileImage ?? "/images/projects/project-placeholder.svg";
  const initialClientCampaigns = availableCampaigns.filter((campaign) => campaign.clientId === slug);
  const primaryCampaign = initialClientCampaigns[0];
  const [projectName, setProjectName] = useState(
    primaryCampaign?.campaign ?? primaryCampaign?.name ?? preset.name,
  );
  const [activeMainTab, setActiveMainTab] = useState<
    OneUtilityWorkspaceView
  >(initialView);
  const [campaignView, setCampaignView] = useState<"home" | "editor">("home");
  const [campaignSubTab, setCampaignSubTab] = useState<"overview" | "case-study" | "strategy" | "creative" | "marketing">("overview");
  const [selectedCreative, setSelectedCreative] = useState<{ src: string; alt: string } | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>(() =>
    initialClientCampaigns.length > 0
      ? initialClientCampaigns.map((campaign) => ({
        id: campaign.slug,
        title: campaign.campaign ?? campaign.name,
        status: workspaceStatusFromCampaign(campaign.status),
      }))
      : [{ id: "client-campaign", title: "Campaign to be defined", status: "Draft" }]
  );
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignFilter, setCampaignFilter] = useState<ClientCampaignFilter>("all");
  const [campaignSort, setCampaignSort] = useState<ClientCampaignSort>("recent");
  const [campaignListView, setCampaignListView] = useState<ViewMode>("cards");
  const [activeCampaignId, setActiveCampaignId] = useState(() => initialClientCampaigns[0]?.slug ?? "client-campaign");
  const [campaignDescriptions, setCampaignDescriptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialClientCampaigns.map((campaign) => [campaign.slug, campaign.summary])),
  );
  const [caseStudies, setCaseStudies] = useState<Record<string, CaseStudyDraft>>(() =>
    Object.fromEntries(initialClientCampaigns.map((campaign) => [campaign.slug, caseStudyFromCampaign(campaign)])),
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

  // Campaign overview state
  // Campaign lead mirrors the lead recorded on the campaign itself, so the
  // workspace and the public campaign page always name the same person.
  const [campaignLead, setCampaignLead] = useState(
    availableUsers.find((user) => user.slug === initialClientCampaigns[0]?.leadUserId)?.name ?? "",
  );
  const [campaignStart, setCampaignStart] = useState("2026-08-01");
  const [campaignEnd, setCampaignEnd] = useState("2026-10-31");
  const [campaignDeadline, setCampaignDeadline] = useState("2026-07-25");

  // Settings state
  const [brandUrl, setBrandUrl] = useState(preset.url);
  const [footprint, setFootprint] = useState(preset.footprint);
  const [aesthetic, setAesthetic] = useState(preset.aesthetic);
  const [brandArchetype, setBrandArchetype] = useState(workspace.brandArchetype);
  const [toneVal, setToneVal] = useState(preset.toneVal);
  const [toneLabel, setToneLabel] = useState(preset.toneText);

  // Brand DNA: editable core value proposition
  const [valueProp, setValueProp] = useState(workspace.valueProposition.coreHeadline);
  // Page accent follows the client's primary brand colour.
  const [primaryColor] = useState<string>(workspace.primaryColor);
  const [selectedCreatorSlugs, setSelectedCreatorSlugs] = useState(workspace.creatorSlugs);
  const [mediaItems, setMediaItems] = useState(workspace.moodboardImages);
  const [creatorSearch, setCreatorSearch] = useState("");
  const [creatorCategory, setCreatorCategory] = useState("all");
  const [creatorSort, setCreatorSort] = useState<ClientCreatorSort>("name");
  const [creatorListView, setCreatorListView] = useState<ViewMode>("cards");
  const selectedCreators = React.useMemo(
    () => availableUsers.filter(
      (user) => isCreatorUser(user) && selectedCreatorSlugs.includes(user.slug),
    ),
    [availableUsers, selectedCreatorSlugs],
  );
  const visibleCampaigns = React.useMemo(() => {
    const query = campaignSearch.trim().toLowerCase();
    const filtered = campaigns.filter((campaign) => {
      const matchesStatus = campaignFilter === "all" || campaign.status === campaignFilter;
      const matchesSearch = !query || [campaign.title, campaign.status].join(" ").toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (campaignSort === "name") return a.title.localeCompare(b.title);
      const aDate = availableCampaigns.find((campaign) => campaign.slug === a.id)?.liveAt?.date ?? "";
      const bDate = availableCampaigns.find((campaign) => campaign.slug === b.id)?.liveAt?.date ?? "";
      return bDate.localeCompare(aDate);
    });
  }, [availableCampaigns, campaignFilter, campaignSearch, campaignSort, campaigns]);
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
  const latestCampaigns = React.useMemo(
    () => [...campaigns]
      .sort((a, b) => {
        const aDate = availableCampaigns.find((campaign) => campaign.slug === a.id)?.liveAt?.date ?? "";
        const bDate = availableCampaigns.find((campaign) => campaign.slug === b.id)?.liveAt?.date ?? "";
        return bDate.localeCompare(aDate);
      })
      .slice(0, 3),
    [availableCampaigns, campaigns],
  );
  const latestCreators = selectedCreators.slice(0, 4);

  const nextCampaignNumberRef = useRef(2);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveBusinessProfile = () => {
    setBusinessProfileDirty(false);
    showToast("Business profile saved.");
  };

  const handleSaveBrandDna = () => {
    setDesignDirty(false);
    showToast("Profile saved.");
  };

  const handleShareCampaign = async () => {
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
      showToast(`Campaign link copied.\n\n${link}`);
      return;
    }

    showToast("Sharing is unavailable in this browser.");
  };

  const handleNewCampaign = () => {
    const campaignNumber = nextCampaignNumberRef.current;
    const id = `campaign-${campaignNumber}`;
    const title = `Untitled campaign ${campaignNumber}`;
    nextCampaignNumberRef.current += 1;
    setCampaigns((prev) => [...prev, { id, title, status: "Draft" }]);
    setActiveCampaignId(id);
    setProjectName(title);
    setCampaignDescriptions((previous) => ({ ...previous, [id]: "" }));
    setActiveSection("social");
    setMarketAudience(preset.footprintShort);
    setBrandUrl(preset.url);
    setFootprint(preset.footprint);
    setAesthetic(preset.aesthetic);
    setToneVal(preset.toneVal);
    setToneLabel(preset.toneText);
    setCampaignCopy(workspace.phaseContent.launch);
    setActiveMainTab("campaign");
    setCampaignView("editor");
    showToast("New campaign draft created.");
  };

  const handleSelectCampaign = (campaignId: string) => {
    const selectedCampaign = campaigns.find((campaign) => campaign.id === campaignId);
    if (!selectedCampaign) return;

    setActiveCampaignId(selectedCampaign.id);
    setProjectName(selectedCampaign.title);
    const realCampaign = availableCampaigns.find((campaign) => campaign.slug === selectedCampaign.id);
    setCampaignLead(availableUsers.find((user) => user.slug === realCampaign?.leadUserId)?.name ?? "");
  };

  const handleOpenCampaign = (campaign: CampaignListItem) => {
    handleSelectCampaign(campaign.id);
    setActiveMainTab("campaign");
    setCampaignView("editor");
  };

  const handleProjectNameChange = (title: string) => {
    setProjectName(title);
    setCampaigns((prev) =>
      prev.map((campaign) =>
        campaign.id === activeCampaignId ? { ...campaign, title } : campaign
      )
    );
  };

  const handleCampaignStatusChange = (status: CampaignWorkspaceStatus) => {
    setCampaigns((prev) =>
      prev.map((campaign) =>
        campaign.id === activeCampaignId ? { ...campaign, status } : campaign
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

  const [campaignCopy, setCampaignCopy] = useState<PhaseContent>(workspace.phaseContent.launch);
  const phase = campaignCopy;
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
  const activeCampaign =
    campaigns.find((campaign) => campaign.id === activeCampaignId) ?? campaigns[0];
  const campaignDescription = campaignDescriptions[activeCampaignId] ?? "";
  const activeCampaignRecord = availableCampaigns.find((campaign) => campaign.slug === activeCampaign?.id);
  const overviewDescription = client?.description?.trim() || campaignDescription.trim() || activeCampaignRecord?.summary || "No description available yet.";
  const updateCampaignDescription = (value: string) =>
    setCampaignDescriptions((previous) => ({ ...previous, [activeCampaignId]: value }));
  const activeCampaignMediaPlan = workspace.campaignMediaPlans[activeCampaignId];
  const activeCaseStudy = caseStudies[activeCampaignId] ?? caseStudyFromCampaign();
  const updateCaseStudy = (field: keyof CaseStudyDraft, value: string) =>
    setCaseStudies((previous) => ({
      ...previous,
      [activeCampaignId]: { ...activeCaseStudy, [field]: value },
    }));
  const updateCopy = (field: keyof PhaseContent, value: string) =>
    setCampaignCopy((prev) => ({ ...prev, [field]: value }));

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
      view: "overview",
      label: "Home",
      onSelect: () => setActiveMainTab("overview"),
    },
    {
      view: "campaign",
      label: "Campaigns",
      onSelect: () => {
        setActiveMainTab("campaign");
        setCampaignView("home");
      },
    },
    { view: "moodboard", label: "Media", onSelect: () => setActiveMainTab("moodboard") },
    { view: "creators", label: "Team", onSelect: () => setActiveMainTab("creators") },
    { view: "brand", label: "Profile", onSelect: () => setActiveMainTab("brand") },
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
    heroImage: campaignImageFor(activeCampaignId, availableCampaigns),
    clientProfileImage,
    onHome: () => setActiveMainTab("overview"),
    creators: selectedCreators,
    navigation: workspaceNavigation,
    shareAction: (
      <button
        type="button"
        onClick={handleShareCampaign}
        aria-label="Share"
        className="flex h-7 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        Share
      </button>
    ),
  };
  const contentEditAction = client ? <ClientActions client={client} /> : null;
  const activeWorkspaceTitle =
    activeMainTab === "overview"
      ? "Overview"
      : workspaceTabs.find((tab) => tab.view === activeMainTab)?.label ?? "Overview";

  const campaignSubTabs: { id: typeof campaignSubTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "case-study", label: "Case study" },
    { id: "strategy", label: "Strategy" },
    { id: "creative", label: "Creatives" },
    { id: "marketing", label: "Marketing" },
  ];

  const activeSubTabRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeSubTabRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [campaignSubTab]);

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

          {/* CAMPAIGN VIEW */}
          {activeMainTab === "campaign" && (
            campaignView === "home" ? (
              <ClientWorkspaceContent>
                  <ClientWorkspaceHeading
                    title="Campaigns"
                    actions={
                      <>
                        {contentEditAction}
                        <button
                          type="button"
                          onClick={handleNewCampaign}
                          className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          New
                        </button>
                      </>
                    }
                  />
                  <FilterBar
                    panelId="client-campaign-filter-panel"
                    tabs={CLIENT_CAMPAIGN_FILTERS}
                    activeTab={campaignFilter}
                    onTabChange={setCampaignFilter}
                    tabsLabel="Status"
                    search={campaignSearch}
                    onSearchChange={setCampaignSearch}
                    searchPlaceholder="Search campaigns"
                    sortOptions={CLIENT_CAMPAIGN_SORTS}
                    activeSort={campaignSort}
                    onSortChange={setCampaignSort}
                    resultCount={plural(visibleCampaigns.length, "campaign")}
                    view={campaignListView}
                    onViewChange={setCampaignListView}
                    className="my-0"
                  />
                  <section id="client-campaign-filter-panel" aria-label={`${clientName} campaigns`} className="pt-2">
                    {visibleCampaigns.length > 0 ? (
                      campaignListView === "cards" ? (
                        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
                          {visibleCampaigns.map((campaign) => {
                            const record = availableCampaigns.find((item) => item.slug === campaign.id);
                            return (
                              <li key={campaign.id}>
                                <DashboardCard
                                  className="h-full"
                                  actions={record ? <DashboardCardActions collection="campaigns" slug={record.slug} titleField="campaign" title={record.campaign ?? record.name} showCopy={false} /> : undefined}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCampaign(campaign)}
                                    className="group flex h-full w-full flex-col text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                  >
                                    <div className="h-28 shrink-0 overflow-hidden bg-muted">
                                      <ImageWithFallback
                                        src={campaignImageFor(campaign.id, availableCampaigns)}
                                        alt={record?.imageAlt ?? campaign.title}
                                        className="h-full w-full object-cover"
                                        iconClassName="h-10 w-10"
                                      />
                                    </div>
                                    <div className="flex min-h-[170px] flex-col gap-3 p-4">
                                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                                        {clientName}
                                      </span>
                                      <h3 className="m-0 line-clamp-2 text-[16px] font-semibold leading-tight group-hover:text-primary">
                                        {campaign.title}
                                      </h3>
                                      <div className="mt-auto flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
                                        <DashboardBadge tone={campaign.status === "Live" ? "active" : "neutral"}>
                                          {campaign.status}
                                        </DashboardBadge>
                                        <span>{record?.category ?? "Campaign"}</span>
                                      </div>
                                    </div>
                                  </button>
                                </DashboardCard>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-border">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Campaign</th>
                                <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                                <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Category</th>
                                <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Year</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visibleCampaigns.map((campaign) => {
                                const record = availableCampaigns.find((item) => item.slug === campaign.id);
                                return (
                                  <tr key={campaign.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                    <td className="px-4 py-3.5 text-[13px] font-semibold">
                                      <button type="button" onClick={() => handleOpenCampaign(campaign)} className="text-left text-foreground hover:text-primary focus-visible:text-primary">
                                        {campaign.title}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3.5 text-[13px]"><DashboardBadge tone={campaign.status === "Live" ? "active" : "neutral"}>{campaign.status}</DashboardBadge></td>
                                    <td className="px-4 py-3.5 text-[13px] text-muted-foreground">{record?.category ?? "—"}</td>
                                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-muted-foreground">{record?.year ?? "—"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      <p className="m-0 py-8 text-center text-sm text-muted-foreground">
                        No campaigns match this search or filter.
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
                          onClick={() => setCampaignView("home")}
                          aria-label="Back to campaigns"
                          className="grid h-10 w-10 flex-none place-items-center rounded-md border border-border text-foreground transition hover:bg-muted hover:text-primary sm:h-8 sm:w-8"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={projectName}
                          onChange={(e) => handleProjectNameChange(e.target.value)}
                          aria-label="Campaign title"
                          className="min-w-0 flex-1 bg-transparent border-b border-transparent hover:border-border focus:border-primary px-1 py-0.5 text-sm font-semibold tracking-tight text-foreground outline-none transition placeholder:text-muted-foreground"
                        />
                      </div>

                      {/* CAMPAIGN SUB-TABS */}
                      <div
                        role="tablist"
                        aria-label="Campaign sections"
                        className="no-scrollbar -mx-4 flex w-full items-center gap-1 overflow-x-auto px-4 text-sm sm:mx-0 sm:w-auto sm:px-0"
                      >
                        {campaignSubTabs.map((tab, index) => {
                          const isActive = campaignSubTab === tab.id;
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
                                onClick={() => setCampaignSubTab(tab.id)}
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

                    {/* CAMPAIGN SUB-TAB: OVERVIEW */}
                    {campaignSubTab === "overview" && (
                      <div className="py-4">
                        <div className="space-y-4 max-w-2xl">
                          <CopyField
                            label="Campaign name"
                            value={projectName}
                            onChange={handleProjectNameChange}
                          />

                          <CopyField
                            label="Campaign description"
                            value={campaignDescription}
                            onChange={updateCampaignDescription}
                            textarea
                            rows={4}
                          />

                          <div className="space-y-1.5">
                            <label htmlFor="campaignStatusOverview" className="text-sm font-medium text-foreground">
                              Status
                            </label>
                            <select
                              id="campaignStatusOverview"
                              value={activeCampaign?.status ?? "Draft"}
                              onChange={(e) => handleCampaignStatusChange(e.target.value as CampaignWorkspaceStatus)}
                              className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                            >
                              {campaignWorkspaceStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>

                          <CopyField
                            label="Campaign lead"
                            value={campaignLead}
                            onChange={setCampaignLead}
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label htmlFor="campaignStart" className="text-sm font-medium text-foreground">Campaign start</label>
                              <input
                                type="date"
                                id="campaignStart"
                                value={campaignStart}
                                onChange={(e) => setCampaignStart(e.target.value)}
                                className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor="campaignEnd" className="text-sm font-medium text-foreground">Campaign end</label>
                              <input
                                type="date"
                                id="campaignEnd"
                                value={campaignEnd}
                                onChange={(e) => setCampaignEnd(e.target.value)}
                                className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor="campaignDeadline" className="text-sm font-medium text-foreground">Deadline</label>
                              <input
                                type="date"
                                id="campaignDeadline"
                                value={campaignDeadline}
                                onChange={(e) => setCampaignDeadline(e.target.value)}
                                className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CAMPAIGN SUB-TAB: CASE STUDY */}
                    {campaignSubTab === "case-study" && (
                      <div className="py-4">
                        <div className="max-w-2xl space-y-5">
                          <div>
                            <h3 className="m-0 text-base font-semibold text-foreground">Campaign case study</h3>
                            <p className="mb-0 mt-1 text-sm leading-[1.45] text-muted-foreground">
                              Edit the strategic narrative that appears on the published campaign record.
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

                    {/* CAMPAIGN SUB-TAB: STRATEGY */}
                    {campaignSubTab === "strategy" && (
                      <StrategyEditor markdown={workspace.strategyMarkdown} />
                    )}

                    {/* CAMPAIGN SUB-TAB: CREATIVES GALLERY */}
                    {campaignSubTab === "creative" && (
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

                    {/* CAMPAIGN SUB-TAB: MARKETING */}
                    {campaignSubTab === "marketing" && (
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
                            {activeCampaignMediaPlan?.mediaBuying.map((card, index) => {
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
                            {activeCampaignMediaPlan?.influencerMarketing.map((card, index) => {
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
                            poster={campaignImageFor(activeCampaignId, availableCampaigns)}
                            aria-label={`${clientName} campaign film`}
                          >
                            <source src={workspace.overviewVideo} type="video/mp4" />
                            Your browser does not support this video.
                          </video>
                        ) : (
                          <EmptyThumbnail
                            className="h-full w-full"
                            iconClassName="h-12 w-12 text-muted-foreground/35"
                            label="No campaign video available"
                          />
                        )}
                      </div>
                      <div className="flex items-center">
                        <p className="m-0 text-sm leading-relaxed text-muted-foreground">{overviewDescription}</p>
                      </div>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2">
                  <section className="space-y-3" aria-labelledby="latest-campaigns-heading">
                    <div className="flex items-center justify-between gap-3">
                      <h3 id="latest-campaigns-heading" className="m-0 text-base font-semibold text-foreground">Latest campaigns</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMainTab("campaign");
                          setCampaignView("home");
                        }}
                        className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        View all
                      </button>
                    </div>
                    {latestCampaigns.length ? (
                      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        {latestCampaigns.map((campaign) => {
                          const record = availableCampaigns.find((item) => item.slug === campaign.id);
                          return (
                            <DashboardCard key={campaign.id}>
                              <button
                                type="button"
                                onClick={() => handleOpenCampaign(campaign)}
                                className="group flex w-full items-center gap-3 p-3 text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                              >
                                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                                  <ImageWithFallback
                                    src={campaignImageFor(campaign.id, availableCampaigns)}
                                    alt={record?.imageAlt ?? campaign.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <h4 className="m-0 truncate text-sm font-semibold group-hover:text-primary">{campaign.title}</h4>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <DashboardBadge tone={campaign.status === "Live" ? "active" : "neutral"}>{campaign.status}</DashboardBadge>
                                    <span className="truncate">{record?.category ?? "Campaign"}</span>
                                  </div>
                                </div>
                              </button>
                            </DashboardCard>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="m-0 text-sm text-muted-foreground">No campaigns yet.</p>
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
                              href={`/dashboard/creators/${creator.slug}`}
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
                        <dt className="text-[10px] uppercase text-muted-foreground">Campaign lead</dt>
                        <dd className="m-0 text-[13px] font-medium text-foreground">{campaignLead || "To be confirmed"}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-[10px] uppercase text-muted-foreground">Target audience</dt>
                        <dd className="m-0 break-words text-[13px] font-medium leading-relaxed text-foreground">{marketAudience}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-[10px] uppercase text-muted-foreground">Number of campaigns</dt>
                        <dd className="m-0 text-[13px] font-medium text-foreground">{campaigns.length}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-[10px] uppercase text-muted-foreground">Date created</dt>
                        <dd className="m-0 text-[13px] font-medium text-foreground">Sep 01, 2026</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-[10px] uppercase text-muted-foreground">Date modified</dt>
                        <dd className="m-0 text-[13px] font-medium text-foreground">Sep 04, 2026</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-[10px] uppercase text-muted-foreground">Status</dt>
                        <dd className="m-0 flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {activeCampaign?.status ?? "Draft"}
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
                <ClientWorkspaceHeading title="Profile" actions={contentEditAction} />
                <div className="grid w-full max-w-2xl grid-cols-1 items-start gap-6">
                  <section className="space-y-5">
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
                          className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition"
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
                        className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                      />
                    </div>

                    <div className="flex items-center justify-end border-t border-border pt-4">
                      <button
                        type="button"
                        onClick={handleSaveBusinessProfile}
                        disabled={!businessProfileDirty}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Save className="h-4 w-4" /> Save
                      </button>
                    </div>
                  </section>

                  <section className="space-y-5">
                    {/* BRAND & DESIGN */}
                    <div className="border-b border-border pb-3">
                      <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
                        Identity
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
                </div>
            </ClientWorkspaceContent>
          )}

          {activeMainTab === "moodboard" && (
            <ClientWorkspaceContent>
                <ClientWorkspaceHeading
                  title="Media"
                  actions={
                    <ClientMediaAddAction
                      campaignId={primaryCampaign?.slug ?? null}
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
                          campaignId={primaryCampaign?.slug ?? null}
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
                        campaignId={primaryCampaign?.slug ?? null}
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
                                actions={<UserActions user={creator} variant="creator" listHref={`/dashboard/clients/${slug}/creators`} compactMenu categoryOptions={knownCreatorCategories(availableUsers)} />}
                              >
                                <Link
                                  href={`/dashboard/creators/${creator.slug}`}
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
                        <div className="overflow-x-auto rounded-xl border border-border">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Creator</th>
                                <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Category</th>
                                <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Availability</th>
                                <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Location</th>
                                <th className="whitespace-nowrap border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Rate</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visibleCreators.map((creator) => (
                                <tr key={creator.slug} className="border-b border-border last:border-0 hover:bg-muted/50">
                                  <td className="px-4 py-3.5 text-[13px] font-semibold">
                                    <Link href={`/dashboard/creators/${creator.slug}`} className="inline-flex items-center gap-3 text-foreground no-underline hover:text-primary focus-visible:text-primary">
                                      <ImageWithFallback
                                        src={creator.profileImage ?? creator.featuredImage}
                                        alt=""
                                        className="h-8 w-8 rounded-full bg-muted object-cover"
                                        fallbackClassName="h-8 w-8 rounded-full"
                                        fallbackSeed={creator.name}
                                      />
                                      {creator.name}
                                    </Link>
                                  </td>
                                  <td className="px-4 py-3.5 text-[13px] text-muted-foreground">{creator.category}</td>
                                  <td className="px-4 py-3.5 text-[13px]"><DashboardBadge tone={creator.availability === "open" ? "active" : "neutral"}>{creator.availability}</DashboardBadge></td>
                                  <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-muted-foreground">{creator.location || "—"}</td>
                                  <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-muted-foreground">{!creator.hideRate && creator.rateMin !== null ? creator.dayRate : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
