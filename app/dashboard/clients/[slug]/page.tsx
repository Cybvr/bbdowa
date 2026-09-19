"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyThumbnail, ImageWithFallback } from "@/components/empty-thumbnail";
import { CAMPAIGNS } from "@/lib/campaigns";
import type { Campaign, CampaignStatus } from "@/lib/campaigns";
import { getClient, getClientWorkspace } from "@/lib/clients";
import { CREATORS, getUser } from "@/lib/users";
import { campaignWorkspaceStatuses } from "@/lib/client-data";
import { fontOptions, ctaOptions } from "@/lib/campaign-options";
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

function campaignImageFor(campaignId: string): string {
  return CAMPAIGNS.find((campaign) => campaign.slug === campaignId)?.image ?? "/images/projects/project-placeholder.svg";
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
  children,
}: {
  clientName: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative h-[220px] overflow-hidden rounded-2xl border border-border bg-muted sm:h-[350px]">
      {children ?? (
        <ImageWithFallback
          src="/images/bbdowa-red-pattern-placeholder.png"
          alt="BBDO West Africa placeholder pattern"
          className="h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/65 to-transparent px-5 py-5 text-white sm:px-6">
        <nav aria-label="Breadcrumb">
          <ol className="m-0 flex list-none flex-wrap items-center gap-x-1.5 gap-y-0.5 p-0 text-xs text-white/75">
            <li>
              <Link href="/dashboard/clients" className="transition hover:text-white">
                All
              </Link>
            </li>
            <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
            <li>{clientName}</li>
            <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        <h1 className="mb-0 mt-2 text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
      </div>
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
  Globe,
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
  CircleDollarSign,
  Save,
  X,
} from "lucide-react";

export default function ClientPage() {
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();
  const initialView: OneUtilityWorkspaceView = pathname.endsWith("/campaigns")
    ? "campaign"
    : pathname.endsWith("/brand-dna")
      ? "brand"
      : pathname.endsWith("/moodboard")
        ? "moodboard"
        : pathname.endsWith("/creators")
          ? "creators"
          : pathname.endsWith("/media")
            ? "media"
          : "overview";

  // key={slug} forces a remount when navigating between clients so all
  // slug-derived initial state (preset, palette, copy) re-initialises.
  return <OneUtilityClientWorkspace key={slug} slug={slug} initialView={initialView} />;
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

type OneUtilityWorkspaceView = "overview" | "campaign" | "brand" | "moodboard" | "creators" | "media";

function OneUtilityClientWorkspace({
  slug,
  initialView = "overview",
}: {
  slug: string;
  initialView?: OneUtilityWorkspaceView;
}) {
  const client = getClient(slug);
  const clientName = client?.name ?? "Client";
  const workspace = getClientWorkspace(slug, clientName);
  const preset = workspace.preset;
  const clientProfileImage = client?.profileImage ?? "/images/projects/project-placeholder.svg";
  const initialClientCampaigns = CAMPAIGNS.filter((campaign) => campaign.clientId === slug);
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
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>(() =>
    initialClientCampaigns.length > 0
      ? initialClientCampaigns.map((campaign) => ({
        id: campaign.slug,
        title: campaign.campaign ?? campaign.name,
        status: workspaceStatusFromCampaign(campaign.status),
      }))
      : [{ id: "client-campaign", title: "Campaign to be defined", status: "Draft" }]
  );
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
  const [marketAudience, setMarketAudience] = useState(preset.footprintShort);

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
    getUser(initialClientCampaigns[0]?.leadUserId ?? "")?.name ?? "",
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
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Brand DNA: editable core value proposition
  const [valueProp, setValueProp] = useState(workspace.valueProposition.coreHeadline);
  const [progressStages, setProgressStages] = useState(() =>
    workspace.valueProposition.progressModel.map((item) => ({
      ...item,
      stage: item.stage.replace(/^\d+\.\s*/, ""),
    }))
  );
  // Page accent follows the client's primary brand colour.
  const [primaryColor] = useState<string>(workspace.primaryColor);
  const collaborators = [
    { name: "Jide Pinheiro", initials: "JP", color: "#0B3B2E" },
    { name: "Amara Obi", initials: "AO", color: "#B45309" },
    { name: "Tunde Bello", initials: "TB", color: "#1D4ED8" },
  ];
  const selectedCreators = workspace.creatorSlugs
    .map((creatorSlug) => CREATORS.find((creator) => creator.slug === creatorSlug))
    .filter((creator): creator is (typeof CREATORS)[number] => Boolean(creator));

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
    showToast("Brand DNA saved.");
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
    setStatusNotification(null);
    setActiveMainTab("campaign");
    setCampaignView("editor");
    showToast("New campaign draft created.");
  };

  const handleSelectCampaign = (campaignId: string) => {
    const selectedCampaign = campaigns.find((campaign) => campaign.id === campaignId);
    if (!selectedCampaign) return;

    setActiveCampaignId(selectedCampaign.id);
    setProjectName(selectedCampaign.title);
    const realCampaign = CAMPAIGNS.find((campaign) => campaign.slug === selectedCampaign.id);
    setCampaignLead(getUser(realCampaign?.leadUserId ?? "")?.name ?? "");
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

  const handleSimulateScrape = () => {
    setStatusNotification(`Reviewing ${brandUrl} as a client reference...`);
    setTimeout(() => {
      setStatusNotification(
        `Reference queued from ${brandUrl}. Confirm approved assets before production.`
      );
    }, 900);
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
    href: string;
    onSelect?: () => void;
  }[] = [
    {
      view: "campaign",
      label: "Campaigns",
      href: `/dashboard/clients/${slug}/campaigns`,
      onSelect: () => {
        setActiveMainTab("campaign");
        setCampaignView("home");
      },
    },
    { view: "brand", label: "DNA", href: `/dashboard/clients/${slug}/brand-dna` },
    { view: "moodboard", label: "Moodboard", href: `/dashboard/clients/${slug}/moodboard` },
    { view: "creators", label: "Creators", href: `/dashboard/clients/${slug}/creators` },
    { view: "media", label: "Media", href: `/dashboard/clients/${slug}/media` },
  ];
  const mobileWorkspaceTabs = workspaceTabs.slice(0, 3);
  const mobileMoreTabs = workspaceTabs.slice(3);
  const isMobileMoreActive = mobileMoreTabs.some((tab) => tab.view === activeMainTab);

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

          {/* TOP-LEVEL VIEW TABS */}
          <div className="mx-2 flex items-center gap-1 rounded-xl bg-card p-2 sm:mx-5 sm:gap-x-3 sm:px-4">
            <Link
              href="/dashboard/clients"
              aria-label="Back to clients"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/clients/${slug}/overview`}
              onClick={() => setActiveMainTab("overview")}
              aria-label={`${clientName} overview`}
              className="flex h-10 w-10 shrink-0 items-center justify-center sm:h-12 sm:w-14"
            >
              <ImageWithFallback
                src={clientProfileImage}
                alt=""
                className="h-full w-full object-contain"
                fallbackClassName="h-full w-full rounded-md"
              />
            </Link>
            <nav
              aria-label="Client workspace"
              className="flex min-w-0 flex-1 items-center sm:hidden"
            >
              <div className="flex min-w-0 flex-1 items-center justify-end gap-0.5">
                {mobileWorkspaceTabs.map((tab) => {
                  const isActive = activeMainTab === tab.view;
                  return (
                    <Link
                      key={tab.view}
                      href={tab.href}
                      onClick={tab.onSelect}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative flex h-10 shrink-0 items-center whitespace-nowrap rounded-md px-1 text-xs font-semibold tracking-tight transition ${isActive
                        ? "text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="More client sections"
                      className={`relative flex h-10 shrink-0 items-center gap-0.5 rounded-md px-1 text-xs font-semibold tracking-tight transition ${isMobileMoreActive
                        ? "text-primary after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:bg-primary"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      More
                      <ChevronDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6} className="w-40">
                    {mobileMoreTabs.map((tab) => (
                      <DropdownMenuItem key={tab.view} asChild className="px-3 py-2.5">
                        <Link
                          href={tab.href}
                          onClick={tab.onSelect}
                          aria-current={activeMainTab === tab.view ? "page" : undefined}
                          className={activeMainTab === tab.view ? "font-semibold text-primary" : undefined}
                        >
                          {tab.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem onSelect={handleShareCampaign} className="px-3 py-2.5">
                      <Share2 className="h-4 w-4" aria-hidden="true" />
                      Share
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </nav>
            <nav aria-label="Client workspace" className="hidden min-w-0 flex-1 sm:block">
              <div className="flex items-center gap-1">
                {workspaceTabs.map((tab) => {
                  const isActive = activeMainTab === tab.view;
                  return (
                    <Link
                      key={tab.view}
                      href={tab.href}
                      onClick={tab.onSelect}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative flex shrink-0 items-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition ${isActive
                        ? "text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
            <div className="ml-auto hidden shrink-0 items-center gap-3 sm:flex">
              <div className="flex items-center -space-x-2 pr-1" aria-label="Collaborators on this campaign">
                {collaborators.map((c) => (
                  <span
                    key={c.name}
                    title={c.name}
                    className="grid h-7 w-7 place-items-center rounded-full border-2 border-card text-sm font-semibold text-white"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.initials}
                  </span>
                ))}
              </div>
              <button onClick={handleShareCampaign} aria-label="Share" className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 sm:h-9 sm:px-3.5">
                <Share2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* CAMPAIGN VIEW */}
          {activeMainTab === "campaign" && (
            campaignView === "home" ? (
              <div className="px-4 py-4 sm:px-6">
                <div className="w-full max-w-5xl mx-auto space-y-4 pb-8">
                  <ClientWorkspaceHero clientName={clientName} title="Campaigns" />
                  <div className="flex justify-end">
                    <button
                      onClick={handleNewCampaign}
                      className="px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-md transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New campaign
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((campaign) => (
                      <button
                        key={campaign.id}
                        onClick={() => handleOpenCampaign(campaign)}
                        className="overflow-hidden text-left flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-2xl"
                      >
                        <div className="relative w-full aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
                          <ImageWithFallback
                            src={campaignImageFor(campaign.id)}
                            alt={campaign.title}
                            className="w-full h-full object-cover"
                            iconClassName="w-10 h-10"
                          />
                          <span className="absolute top-3 left-3 rounded-md bg-background/90 backdrop-blur-sm px-2 py-0.5 text-xs font-mono uppercase tracking-wide text-primary font-semibold border border-border">
                            {campaign.status}
                          </span>
                        </div>
                        <div className="pt-3 flex flex-col flex-1 justify-between space-y-1">
                          <span className="block text-sm font-semibold text-foreground">{campaign.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* TAB CONTENT AREA */}
                <div className="px-4 py-4 sm:px-6">
                  <div className="mx-auto w-full max-w-5xl space-y-4">
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
                          {Object.values(workspace.creativePreviews).map((item) => (
                            <button
                              key={item.src}
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
                  </div>
                </div>
              </div>
            )
          )}

          {/* OVERVIEW VIEW */}
          {activeMainTab === "overview" && (
            <div className="px-4 py-4 sm:px-6">
              <div className="w-full max-w-5xl mx-auto space-y-4 pb-8">
                {/* CAMPAIGN FILM */}
                <ClientWorkspaceHero clientName={clientName} title="Overview">
                  {workspace.overviewVideo ? (
                    <video
                      className="h-full w-full object-cover"
                      muted
                      preload="metadata"
                      poster={campaignImageFor(activeCampaignId)}
                      aria-label={`${clientName} campaign film`}
                    >
                      <source src={workspace.overviewVideo} type="video/mp4" />
                      Your browser does not support this video.
                    </video>
                  ) : (
                    <EmptyThumbnail
                      className="h-full w-full"
                      iconClassName="w-12 h-12 text-muted-foreground/35"
                      label="No campaign video available"
                    />
                  )}
                </ClientWorkspaceHero>

                {/* OVERVIEW GRID */}
                <div className="overflow-hidden rounded-2xl border border-border">
                  <dl className="m-0 grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
                    <div className="bg-background p-4 space-y-1">
                      <dt className="text-muted-foreground font-mono text-xs uppercase">Client</dt>
                      <dd className="m-0 text-sm text-foreground font-medium">{clientName}</dd>
                    </div>
                    <div className="bg-background p-4 space-y-1">
                      <dt className="text-muted-foreground font-mono text-xs uppercase">Selected campaign</dt>
                      <dd className="m-0 text-sm text-foreground font-medium">{activeCampaign?.title ?? "No campaign selected"}</dd>
                    </div>
                    <div className="bg-background p-4 space-y-1">
                      <dt className="text-muted-foreground font-mono text-xs uppercase">Campaign lead</dt>
                      <dd className="m-0 text-sm text-foreground font-medium">{campaignLead || "To be confirmed"}</dd>
                    </div>
                    <div className="bg-background p-4 space-y-1">
                      <dt className="text-muted-foreground font-mono text-xs uppercase">Target Audience</dt>
                      <dd className="m-0 text-sm text-foreground font-medium">{marketAudience}</dd>
                    </div>
                    <div className="bg-background p-4 space-y-1">
                      <dt className="text-muted-foreground font-mono text-xs uppercase">Number of campaigns</dt>
                      <dd className="m-0 text-sm text-foreground font-medium">{campaigns.length}</dd>
                    </div>
                    <div className="bg-background p-4 space-y-1">
                      <dt className="text-muted-foreground font-mono text-xs uppercase">Date Created</dt>
                      <dd className="m-0 text-sm text-foreground font-medium">Sep 01, 2026</dd>
                    </div>
                    <div className="bg-background p-4 space-y-1">
                      <dt className="text-muted-foreground font-mono text-xs uppercase">Date Modified</dt>
                      <dd className="m-0 text-sm text-foreground font-medium">Sep 04, 2026</dd>
                    </div>
                    <div className="bg-background p-4 space-y-1">
                      <dt className="text-muted-foreground font-mono text-xs uppercase">Status</dt>
                      <dd className="m-0 flex items-center gap-1.5 text-sm text-foreground font-medium">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        {activeCampaign?.status ?? "Draft"}
                      </dd>
                    </div>
                    <div className="hidden bg-background sm:block" aria-hidden="true" />
                  </dl>
                </div>

              </div>
            </div>
          )}

          {/* BRAND DNA VIEW */}
          {activeMainTab === "brand" && (
            <div className="px-4 py-4 sm:px-6">
              <div className="w-full max-w-5xl mx-auto space-y-4 pb-8">
                <ClientWorkspaceHero clientName={clientName} title="Brand DNA" />

                {/* BUSINESS PROFILE & IDENTITY */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                  {/* BUSINESS PROFILE */}
                  <section className="space-y-5">
                    <div className="border-b border-border pb-3">
                      <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
                        Profile
                      </span>
                      <h2 className="text-base font-semibold text-foreground mt-0.5">Business Profile</h2>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-sm font-medium text-foreground block">Client profile image</span>
                      <div className="h-10 flex items-center">
                        <ImageWithFallback
                          src={clientProfileImage}
                          alt={`${preset.client} profile image`}
                          className="h-8 w-auto object-contain"
                          fallbackClassName="h-8 w-16 rounded border border-border"
                          iconClassName="w-4 h-4"
                        />
                      </div>
                    </div>

                    {statusNotification && (
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
                        {statusNotification}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label htmlFor="brandUrl" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-primary" /> Website
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
                          className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg pl-3 pr-20 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition"
                        />
                        <button
                          onClick={handleSimulateScrape}
                          className="absolute right-1 top-1 bottom-1 px-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm rounded border border-border transition flex items-center gap-1"
                        >
                          <ScanLine className="w-3 h-3" /> Read
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="footprintInput" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-primary" /> Target Audience
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

                    {/* 4-Stage Utility Progress Model */}
                    <div className="space-y-2 border-t border-border pt-4">
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <TrendingUp className="w-4 h-4 text-primary" /> The 4-Stage Progress Model
                      </span>
                      <p className="max-w-[72ch] text-sm leading-7 text-muted-foreground">
                        {progressStages.map((item, idx) => (
                          <span key={item.stage}>
                            <span className="font-medium text-foreground">{item.stage}: {item.label}.</span>{" "}
                            {item.desc}{idx < progressStages.length - 1 ? " " : ""}
                          </span>
                        ))}
                      </p>
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
              </div>
            </div>
          )}

          {activeMainTab === "moodboard" && (
            <div className="px-4 py-4 sm:px-6">
              <div className="mx-auto w-full max-w-5xl space-y-4 pb-8">
                <ClientWorkspaceHero clientName={clientName} title="Moodboard" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {workspace.moodboardImages.map((image) => (
                    <button
                      key={image.src}
                      type="button"
                      onClick={() => setSelectedCreative(image)}
                      className="aspect-[3/4] overflow-hidden rounded-md bg-muted text-left"
                      aria-label={`Open ${image.alt}`}
                    >
                      <ImageWithFallback src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeMainTab === "creators" && (
            <div className="px-4 py-6 sm:px-6">
              <div className="mx-auto w-full max-w-5xl">
                <ClientWorkspaceHero clientName={clientName} title="Creators" />
                <p className="mt-4 text-sm text-muted-foreground">Selected creators for {clientName}.</p>
                {selectedCreators.length ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {selectedCreators.map((creator) => (
                      <Link
                        key={creator.slug}
                        href={`/dashboard/creators/${creator.slug}`}
                        className="group overflow-hidden rounded-xl border border-border bg-background transition hover:border-primary"
                      >
                        <div className="aspect-[4/3] bg-muted">
                          <ImageWithFallback
                            src={creator.profileImage ?? creator.featuredImage ?? "/images/projects/project-placeholder.svg"}
                            alt={`${creator.name} profile`}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="space-y-1 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{creator.category}</Badge>
                            <Badge variant="outline">{creator.availability}</Badge>
                          </div>
                          <h2 className="text-base font-semibold text-foreground">{creator.name}</h2>
                          {!creator.hideRate && creator.rateMin !== null && (
                            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                              <CircleDollarSign className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                              {creator.dayRate}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-muted-foreground">No creators assigned to this client yet.</p>
                )}
              </div>
            </div>
          )}

          {activeMainTab === "media" && (
            <div className="px-4 py-4 sm:px-6">
              <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
                <ClientWorkspaceHero clientName={clientName} title="Media" />
                {campaigns.map((campaign) => {
                  const mediaPlan = workspace.campaignMediaPlans[campaign.id];
                  if (!mediaPlan) return null;

                  return (
                    <section key={campaign.id} className="space-y-5">
                      <h2 className="text-lg font-semibold text-foreground">{campaign.title}</h2>
                      <div className="space-y-3">
                        <h3 className="text-base font-semibold text-foreground">Media buying</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {mediaPlan.mediaBuying.map((card, index) => {
                            const Icon = [BarChart3, TrendingUp, ScanLine][index] ?? BarChart3;
                            return (
                              <div key={card.title} className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
                                <span className="flex items-center gap-1.5 font-mono text-xs text-primary">
                                  <Icon className="h-3.5 w-3.5" /> {card.title}
                                </span>
                                <ul className="space-y-1.5 text-sm">
                                  {card.rows.map((row) => (
                                    <li key={row.label} className="flex justify-between gap-2"><span className="text-muted-foreground">{row.label}</span><span className="font-medium text-foreground">{row.value}</span></li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-base font-semibold text-foreground">Influencer marketing</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {mediaPlan.influencerMarketing.map((card, index) => {
                            const Icon = [Users, Film, BarChart3][index] ?? Users;
                            return (
                              <div key={card.title} className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
                                <span className="flex items-center gap-1.5 font-mono text-xs text-primary">
                                  <Icon className="h-3.5 w-3.5" /> {card.title}
                                </span>
                                <ul className="space-y-1.5 text-sm">
                                  {card.rows.map((row) => (
                                    <li key={row.label} className="flex justify-between gap-2"><span className="text-muted-foreground">{row.label}</span><span className="font-medium text-foreground">{row.value}</span></li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
