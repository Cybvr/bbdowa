"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { CAMPAIGNS } from "@/lib/campaigns";
import type { CampaignStatus } from "@/lib/campaigns";
import { CLIENTS } from "@/lib/users";
import { getClientWorkspace } from "@/lib/client-workspaces";
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
  Save,
} from "lucide-react";

function TabPageHeader({ title }: { title: string }) {
  return (
    <h1 className="text-sm font-semibold tracking-tight text-foreground">
      {title}
    </h1>
  );
}

export default function ClientPage() {
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();
  const initialView: OneUtilityWorkspaceView = pathname.endsWith("/campaigns")
    ? "campaign"
    : pathname.endsWith("/brand-dna")
      ? "brand"
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
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
            open ? "rotate-180" : ""
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
    <div className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 -mx-4 sm:-mx-6 bg-muted px-4 sm:px-6 py-6">
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

type OneUtilityWorkspaceView = "overview" | "campaign" | "brand";

function OneUtilityClientWorkspace({
  slug,
  initialView = "overview",
}: {
  slug: string;
  initialView?: OneUtilityWorkspaceView;
}) {
  const client = CLIENTS.find((user) => user.slug === slug);
  const clientName = client?.name ?? "Client";
  const workspace = getClientWorkspace(slug, clientName);
  const preset = workspace.preset;
  const clientProfileImage = client?.profileImage ?? "/images/projects/project-placeholder.svg";
  const initialClientCampaigns = CAMPAIGNS.filter((campaign) => campaign.clientId === slug);
  const [projectName, setProjectName] = useState(preset.name);
  const [activeMainTab, setActiveMainTab] = useState<
    "overview" | "campaign" | "brand"
  >(initialView);
  const [campaignView, setCampaignView] = useState<"home" | "editor">("home");
  const [campaignSubTab, setCampaignSubTab] = useState<"overview" | "strategy" | "creative" | "marketing">("overview");
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
  const [campaignLead, setCampaignLead] = useState(initialClientCampaigns[0]?.lead ?? "");
  const [campaignStart, setCampaignStart] = useState("2026-08-01");
  const [campaignEnd, setCampaignEnd] = useState("2026-10-31");
  const [campaignDeadline, setCampaignDeadline] = useState("2026-07-25");

  // Settings state
  const [brandUrl, setBrandUrl] = useState(preset.url);
  const [scope, setScope] = useState(preset.scope);
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
  const [primaryColor, setPrimaryColor] = useState<string>(workspace.primaryColor);
  const handleAccentChange = (color: string) => {
    setPrimaryColor(color);
    setPalette((prev) => [color, ...prev.slice(1)]);
    setDesignDirty(true);
  };
  const collaborators = [
    { name: "Jide Pinheiro", initials: "JP", color: "#0B3B2E" },
    { name: "Amara Obi", initials: "AO", color: "#B45309" },
    { name: "Tunde Bello", initials: "TB", color: "#1D4ED8" },
  ];

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

  const updateProgressStage = (
    index: number,
    field: "stage" | "label" | "desc",
    value: string
  ) => {
    setProgressStages((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
    setBusinessProfileDirty(true);
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
    setActiveSection("social");
    setMarketAudience(preset.footprintShort);
    setBrandUrl(preset.url);
    setScope(preset.scope);
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
    setCampaignLead(realCampaign?.lead ?? "");
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

  return (
    <div
      className="utility-workspace min-h-screen lg:h-screen flex flex-col gap-2 overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-card p-2 text-foreground antialiased font-sans [&_h1]:[font-family:var(--workspace-font-heading)] [&_h2]:[font-family:var(--workspace-font-heading)] [&_h3]:[font-family:var(--workspace-font-heading)] [&_h4]:[font-family:var(--workspace-font-heading)] [&_h5]:[font-family:var(--workspace-font-heading)] [&_h6]:[font-family:var(--workspace-font-heading)]"
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
        <div className="fixed bottom-6 right-6 bg-card border border-border text-card-foreground px-5 py-4 rounded-xl shadow-2xl z-50 text-sm font-sans max-w-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="whitespace-pre-line leading-relaxed">{toastMessage}</div>
        </div>
      )}

      <div className="flex flex-col lg:flex-1 lg:min-h-0 gap-2 lg:overflow-hidden">
      {/* MAIN CANVAS: TABS + CONTENT */}
      <main className="order-1 lg:flex-1 lg:min-h-0 rounded-xl bg-background flex flex-col lg:overflow-hidden">

        {/* CLIENT HEADER: LOGO + BREADCRUMB + NAME + ACTIONS */}
        <div className="flex flex-nowrap items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3 shrink-0 z-30">
          <div className="flex min-w-0 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={clientProfileImage}
              alt=""
              className="h-11 w-11 shrink-0 rounded-xl border border-border bg-muted object-contain p-1.5"
            />
            <div className="min-w-0">
              <nav aria-label="Breadcrumb">
                <ol className="m-0 flex min-w-0 list-none items-center gap-1.5 p-0 text-xs text-muted-foreground">
                  <li>
                    <Link href="/dashboard/clients" className="whitespace-nowrap hover:text-foreground">
                      All
                    </Link>
                  </li>
                  <li aria-hidden="true"><ChevronRight className="h-3 w-3 shrink-0" /></li>
                  <li aria-current="page" className="truncate text-foreground">{clientName}</li>
                </ol>
              </nav>
              <h1 className="m-0 truncate text-xl sm:text-2xl font-bold tracking-tight text-foreground">{clientName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Collaborators */}
            <div className="hidden sm:flex items-center -space-x-2 pr-1" aria-label="Collaborators on this campaign">
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

            {/* Accent color */}
            <label
              title="Change accent color"
              aria-label="Change accent color"
              className="relative flex items-center gap-1 px-2 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/90 transition cursor-pointer text-secondary-foreground"
            >
              <Palette className="w-4 h-4" style={{ color: primaryColor }} />
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => handleAccentChange(e.target.value)}
                aria-label="Change accent color"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>

            <button onClick={handleShareCampaign} aria-label="Share" className="px-2.5 sm:px-3.5 py-1.5 text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-md transition flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* TOP-LEVEL VIEW TABS: OVERVIEW | CAMPAIGNS | BRAND DNA */}
        <div className="min-h-11 border-b border-border px-2 sm:px-5 flex items-center justify-start gap-0.5 sm:gap-1 shrink-0">
          <Link
            href={`/dashboard/clients/${slug}/overview`}
            className={`px-2 sm:px-3 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap ${
              activeMainTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Box className="w-3.5 h-3.5" /> Overview
          </Link>
          <Link
            href={`/dashboard/clients/${slug}/campaigns`}
            onClick={() => {
              setActiveMainTab("campaign");
              setCampaignView("home");
            }}
            className={`px-2 sm:px-3 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap ${
              activeMainTab === "campaign"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Campaigns
          </Link>
          <Link
            href={`/dashboard/clients/${slug}/brand-dna`}
            className={`px-2 sm:px-3 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap ${
              activeMainTab === "brand"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Palette className="w-3.5 h-3.5" /> Brand DNA
          </Link>
        </div>

        {/* CAMPAIGN VIEW */}
        {activeMainTab === "campaign" && (
          campaignView === "home" ? (
            <div className="lg:flex-1 lg:overflow-y-auto px-4 py-4 sm:px-6">
              <div className="w-full max-w-5xl mx-auto space-y-4 pb-8">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
                  <TabPageHeader title="Campaigns" />
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={workspace.campaignPreviewImage}
                          alt={campaign.title}
                          className="w-full h-full object-cover"
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
          <div className="flex flex-col lg:flex-1 lg:overflow-hidden">
            {/* TAB CONTENT AREA */}
            <div className="lg:flex-1 lg:overflow-hidden px-4 py-4 sm:px-6 flex flex-col" id="canvasScrollArea">
              <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-1 lg:min-h-0 gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-border pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => setCampaignView("home")}
                      aria-label="Back to campaigns"
                      className="grid h-8 w-8 flex-none place-items-center rounded-md border border-border text-foreground hover:text-primary hover:bg-muted transition"
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

                  {/* CAMPAIGN SUB-TABS: OVERVIEW > STRATEGY > CREATIVES */}
                  <div className="flex items-center gap-1 text-sm shrink-0">
                    <button
                      onClick={() => setCampaignSubTab("overview")}
                      className={`px-2.5 py-1.5 rounded-md font-medium transition ${
                        campaignSubTab === "overview"
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Overview
                    </button>
                    <span className="text-muted-foreground/50">›</span>
                    <button
                      onClick={() => setCampaignSubTab("strategy")}
                      className={`px-2.5 py-1.5 rounded-md font-medium transition ${
                        campaignSubTab === "strategy"
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Strategy
                    </button>
                    <span className="text-muted-foreground/50">›</span>
                    <button
                      onClick={() => setCampaignSubTab("creative")}
                      className={`px-2.5 py-1.5 rounded-md font-medium transition ${
                        campaignSubTab === "creative"
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Creatives
                    </button>
                    <span className="text-muted-foreground/50">›</span>
                    <button
                      onClick={() => setCampaignSubTab("marketing")}
                      className={`px-2.5 py-1.5 rounded-md font-medium transition ${
                        campaignSubTab === "marketing"
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Marketing
                    </button>
                  </div>
                </div>

                {/* CAMPAIGN SUB-TAB: OVERVIEW */}
                {campaignSubTab === "overview" && (
                  <div className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 pr-1 py-4">
                    <div className="space-y-4 max-w-2xl">
                      <CopyField
                        label="Campaign name"
                        value={projectName}
                        onChange={handleProjectNameChange}
                      />

                      <div className="space-y-1.5">
                        <label htmlFor="campaignScopeOverview" className="text-xs font-mono text-primary uppercase tracking-widest font-semibold flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" /> Scope
                        </label>
                        <select
                          id="campaignScopeOverview"
                          value={scope}
                          onChange={(e) => setScope(e.target.value)}
                          className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                        >
                          <option value="integrated">Integrated launch (film, social, OOH, radio, activation)</option>
                          <option value="social">Social, creators & performance</option>
                          <option value="ooh">Out of home & transit focus</option>
                          <option value="activation">Retail, pop-up & field toolkit</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="campaignStatusOverview" className="text-xs font-mono text-primary uppercase tracking-widest font-semibold flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" /> Status
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

                {/* CAMPAIGN SUB-TAB: STRATEGY */}
                {campaignSubTab === "strategy" && (
                  <StrategyEditor markdown={workspace.strategyMarkdown} />
                )}

                {/* CAMPAIGN SUB-TAB: CREATIVES */}
                {campaignSubTab === "creative" && (
                <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 lg:gap-8 lg:flex-1 lg:min-h-0">
                  {/* LEFT: EDITABLE COPY */}
                  <div className="border-t border-border lg:overflow-y-auto lg:min-h-0 lg:pr-1">

                    <CopyGroup icon={<Smartphone className="w-3.5 h-3.5" />} title="Social & digital" open={activeSection === "social"} onToggle={() => toggleSection("social")}>
                      <CopyField label="Title" value={phase.socialTitle} onChange={(v) => updateCopy("socialTitle", v)} />
                      <CopyField label="Caption" value={phase.socialBody} onChange={(v) => updateCopy("socialBody", v)} textarea />
                      <CopySelect label="CTA" value={phase.socialCta} onChange={(v) => updateCopy("socialCta", v)} options={ctaOptions} />
                    </CopyGroup>

                    <CopyGroup icon={<Film className="w-3.5 h-3.5" />} title="Film" open={activeSection === "film"} onToggle={() => toggleSection("film")}>
                      <CopyField label="Title" value={phase.filmTitle} onChange={(v) => updateCopy("filmTitle", v)} />
                      <CopyField label="Description" value={phase.filmDesc} onChange={(v) => updateCopy("filmDesc", v)} textarea />
                      <CopySelect label="CTA" value={phase.filmCta} onChange={(v) => updateCopy("filmCta", v)} options={ctaOptions} />
                    </CopyGroup>

                    <CopyGroup icon={<Mic className="w-3.5 h-3.5" />} title="Audio" open={activeSection === "audio"} onToggle={() => toggleSection("audio")}>
                      <CopyField label="Title" value={phase.audioTitle} onChange={(v) => updateCopy("audioTitle", v)} />
                      <CopyField label="Description" value={phase.audioDesc} onChange={(v) => updateCopy("audioDesc", v)} textarea />
                      <CopySelect label="CTA" value={phase.audioCta} onChange={(v) => updateCopy("audioCta", v)} options={ctaOptions} />
                    </CopyGroup>

                    <CopyGroup icon={<Megaphone className="w-3.5 h-3.5" />} title="OOH" open={activeSection === "ooh"} onToggle={() => toggleSection("ooh")}>
                      <CopyField label="Title" value={phase.oohTitle} onChange={(v) => updateCopy("oohTitle", v)} />
                      <CopyField label="Description" value={phase.oohDesc} onChange={(v) => updateCopy("oohDesc", v)} textarea />
                      <CopySelect label="CTA" value={phase.oohCta} onChange={(v) => updateCopy("oohCta", v)} options={ctaOptions} />
                    </CopyGroup>

                    <CopyGroup icon={<Newspaper className="w-3.5 h-3.5" />} title="Print" open={activeSection === "print"} onToggle={() => toggleSection("print")}>
                      <CopyField label="Title" value={phase.printTitle} onChange={(v) => updateCopy("printTitle", v)} />
                      <CopyField label="Description" value={phase.printDesc} onChange={(v) => updateCopy("printDesc", v)} textarea />
                      <CopySelect label="CTA" value={phase.printCta} onChange={(v) => updateCopy("printCta", v)} options={ctaOptions} />
                    </CopyGroup>

                  </div>

                  {/* RIGHT: LIVE PREVIEW WINDOW */}
                  <div className="lg:min-h-0 lg:overflow-y-auto rounded-2xl border border-border bg-muted/30 p-4 sm:p-6 flex items-center justify-center">
                    {creativePreview ? (
                      <article className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                        {/* Every channel uses a produced campaign image; editable copy stays as delivery metadata. */}
                        <div className={`relative overflow-hidden ${creativePreview.aspect}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={creativePreview.src}
                            alt={creativePreview.alt}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={clientProfileImage}
                              alt={clientName}
                              className="h-6 w-auto brightness-0 invert"
                            />
                            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-mono font-semibold tracking-wider text-[#1B3FC2]">
                              {creativePreview.format}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3 p-5">
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono font-semibold tracking-[0.16em] text-[#1B3FC2]">
                              {creativePreview.format}
                            </p>
                            <h3 className="text-xl font-bold leading-tight text-foreground">{creativePreview.title}</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">{creativePreview.description}</p>
                          </div>
                          <span className="inline-flex rounded-lg bg-[#1B3FC2] px-3 py-2 text-sm font-semibold text-white">
                            {creativePreview.cta}
                          </span>
                        </div>
                      </article>
                    ) : (
                      <p className="text-sm text-muted-foreground">Choose a creative channel to preview its campaign image.</p>
                    )}
                  </div>
                </div>
                )}

                {/* CAMPAIGN SUB-TAB: MARKETING */}
                {campaignSubTab === "marketing" && (
                  <div className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 pr-1 py-4 space-y-6">
                    {/* MEDIA BUYING */}
                    <section className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                          <Megaphone className="w-3.5 h-3.5" />
                        </span>
                        <h3 className="text-base font-semibold text-foreground">Media buying</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="rounded-2xl p-5 bg-card border border-border shadow-sm space-y-3">
                          <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5" /> Channel mix
                          </span>
                          <ul className="text-sm space-y-1.5">
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Paid social</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Search</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Display / video</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">OOH / radio</span><span className="text-foreground font-medium">—</span></li>
                          </ul>
                        </div>

                        <div className="rounded-2xl p-5 bg-card border border-border shadow-sm space-y-3">
                          <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" /> Budget & flight
                          </span>
                          <ul className="text-sm space-y-1.5">
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Total budget</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Flight dates</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Daily pacing</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Buy type</span><span className="text-foreground font-medium">—</span></li>
                          </ul>
                        </div>

                        <div className="rounded-2xl p-5 bg-card border border-border shadow-sm space-y-3">
                          <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                            <ScanLine className="w-3.5 h-3.5" /> Targeting & KPIs
                          </span>
                          <ul className="text-sm space-y-1.5">
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Audience</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Geo</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Primary KPI</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Target CPA</span><span className="text-foreground font-medium">—</span></li>
                          </ul>
                        </div>
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
                        <div className="rounded-2xl p-5 bg-card border border-border shadow-sm space-y-3">
                          <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" /> Creator tiers
                          </span>
                          <ul className="text-sm space-y-1.5">
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Macro</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Micro</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Nano / UGC</span><span className="text-foreground font-medium">—</span></li>
                          </ul>
                        </div>

                        <div className="rounded-2xl p-5 bg-card border border-border shadow-sm space-y-3">
                          <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                            <Film className="w-3.5 h-3.5" /> Deliverables
                          </span>
                          <ul className="text-sm space-y-1.5">
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Content format</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Posts per creator</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Usage rights</span><span className="text-foreground font-medium">—</span></li>
                          </ul>
                        </div>

                        <div className="rounded-2xl p-5 bg-card border border-border shadow-sm space-y-3">
                          <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5" /> Tracking
                          </span>
                          <ul className="text-sm space-y-1.5">
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Attribution</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Promo / QR code</span><span className="text-foreground font-medium">—</span></li>
                            <li className="flex justify-between gap-2"><span className="text-muted-foreground">Primary KPI</span><span className="text-foreground font-medium">—</span></li>
                          </ul>
                        </div>
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
          <div className="lg:flex-1 lg:overflow-y-auto px-4 py-4 sm:px-6">
            <div className="w-full max-w-5xl mx-auto space-y-4 pb-8">
              {/* CAMPAIGN FILM */}
              {workspace.overviewVideo && (
                <video
                  className="w-full h-[350px] rounded-2xl border border-border bg-muted object-cover"
                  controls
                  preload="metadata"
                  poster={workspace.campaignPreviewImage}
                  aria-label={`${clientName} campaign film`}
                >
                  <source src={workspace.overviewVideo} type="video/mp4" />
                  Your browser does not support this video.
                </video>
              )}

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
          <div className="lg:flex-1 lg:overflow-y-auto px-4 py-4 sm:px-6">
            <div className="w-full max-w-5xl mx-auto space-y-4 pb-8">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
                <TabPageHeader title="Brand DNA" />
              </div>

              {/* BUSINESS PROFILE & IDENTITY */}
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                {/* BUSINESS PROFILE */}
                <section className="space-y-5 bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="border-b border-border pb-3">
                    <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
                      Client Profile
                    </span>
                    <h2 className="text-base font-semibold text-foreground mt-0.5">Business Profile</h2>
                  </div>

                  <div className="p-4 rounded-xl bg-muted border border-border space-y-2">
                    <span className="text-sm text-muted-foreground block font-mono">Client profile image</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={clientProfileImage}
                      alt={`${preset.client} profile image`}
                      className="h-8 w-auto"
                    />
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
                  <div className="pt-4 border-t border-border space-y-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> The 4-Stage Progress Model
                    </span>
                    <ol className="space-y-3">
                      {progressStages.map((item, idx) => (
                        <li key={idx} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary font-mono text-xs font-bold">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1 space-y-2.5">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="space-y-1">
                                <label htmlFor={`progressStage-${idx}`} className="text-xs font-medium text-muted-foreground">
                                  Stage
                                </label>
                                <input
                                  id={`progressStage-${idx}`}
                                  type="text"
                                  value={item.stage}
                                  onChange={(e) => updateProgressStage(idx, "stage", e.target.value)}
                                  className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40"
                                />
                              </div>
                              <div className="space-y-1">
                                <label htmlFor={`progressLabel-${idx}`} className="text-xs font-medium text-muted-foreground">
                                  Outcome
                                </label>
                                <input
                                  id={`progressLabel-${idx}`}
                                  type="text"
                                  value={item.label}
                                  onChange={(e) => updateProgressStage(idx, "label", e.target.value)}
                                  className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label htmlFor={`progressDescription-${idx}`} className="text-xs font-medium text-muted-foreground">
                                Description
                              </label>
                              <textarea
                                id={`progressDescription-${idx}`}
                                rows={2}
                                value={item.desc}
                                onChange={(e) => updateProgressStage(idx, "desc", e.target.value)}
                                className="w-full resize-y rounded-lg border border-input bg-background px-2.5 py-2 text-sm leading-relaxed text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40"
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex items-center justify-end border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={handleSaveBusinessProfile}
                      disabled={!businessProfileDirty}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Save className="h-4 w-4" /> Save business profile
                    </button>
                  </div>
                </section>

                <section className="space-y-5 bg-card border border-border rounded-2xl p-6 shadow-sm">
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
                    <div className="flex justify-between text-sm text-muted-foreground font-mono">
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
                      <Save className="h-4 w-4" /> Save brand DNA
                    </button>
                  </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
