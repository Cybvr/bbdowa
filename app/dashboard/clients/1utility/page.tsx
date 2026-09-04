"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ProfileNav } from "@/components/profile-nav";
import { DashboardSidebarSheet } from "@/components/dashboard-sidebar";
import {
  defaultPreset,
  strategyMarkdown,
  phaseContent,
  campaignPreviewBackground,
  valuePropositionData,
} from "@/lib/client-data";
import {
  chatReplies,
  fontOptions,
  ctaOptions,
} from "@/lib/campaign-options";
import type {
  PresetData,
  PhaseContent,
  CampaignListItem,
} from "@/lib/client-data";
import {
  Sparkles,
  Send,
  LayoutDashboard,
  FileText,
  Palette,
  Smartphone,
  Store,
  Users,
  Info,
  Globe,
  Layers,
  Feather,
  ScanLine,
  Box,
  MessageSquareMore,
  Download,
  Link as LinkIcon,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Film,
  Mic,
  Megaphone,
  Newspaper,
  Plus,
  ChevronLeft,
  ArrowRight,
  TrendingUp,
  Menu,
} from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TabPageHeader({ title }: { title: string }) {
  return (
    <h1 className="text-sm font-semibold tracking-tight text-foreground">
      {title}
    </h1>
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

function VisualLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="text-xs font-mono text-primary flex items-center gap-1.5">
      {icon} {children}
    </span>
  );
}

function renderInline(text: string, keyPrefix: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    )
  );
}

function StrategyDoc({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={key} className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {renderInline(line.slice(2), `b${key}`)}
        </h1>
      );
      key++;
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h2
          key={key}
          className="text-xs font-mono uppercase tracking-widest text-primary font-semibold pt-5"
        >
          {renderInline(line.slice(3), `b${key}`)}
        </h2>
      );
      key++;
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <ul key={key} className="list-disc pl-5 space-y-1.5">
          {items.map((it, idx) => (
            <li key={idx} className="text-sm text-muted-foreground leading-relaxed">
              {renderInline(it, `b${key}-${idx}`)}
            </li>
          ))}
        </ul>
      );
      key++;
      continue;
    }
    blocks.push(
      <p key={key} className="text-sm text-muted-foreground leading-relaxed">
        {renderInline(line, `b${key}`)}
      </p>
    );
    key++;
    i++;
  }

  return <div className="max-w-3xl space-y-4">{blocks}</div>;
}

export default function OneUtilityClientPage() {
  const [preset] = useState<PresetData>(defaultPreset);
  const clientName = "1Utilitybank";
  const [projectName, setProjectName] = useState(defaultPreset.name);
  const [activeMainTab, setActiveMainTab] = useState<
    "overview" | "campaign" | "brand"
  >("campaign");
  const [campaignView, setCampaignView] = useState<"home" | "editor">("home");
  const [campaignSubTab, setCampaignSubTab] = useState<"overview" | "strategy" | "creative">("overview");
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([
    { id: "utility-bank", title: defaultPreset.name, status: "In progress" },
  ]);
  const [activeCampaignId, setActiveCampaignId] = useState("utility-bank");
  const [currentPhase, setCurrentPhase] = useState<
    "tease" | "launch" | "experience" | "sustain"
  >("launch");
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
  const [marketAudience, setMarketAudience] = useState(defaultPreset.footprintShort);

  // Brand DNA state
  const [palette, setPalette] = useState<string[]>(["#2563eb", "#1d4ed8", "#60a5fa", "#0f172a"]);
  const [fontPairing, setFontPairing] = useState(fontOptions[0]);
  const updatePaletteColor = (index: number, value: string) =>
    setPalette((prev) => prev.map((c, i) => (i === index ? value : c)));
  const addPaletteColor = () => setPalette((prev) => [...prev, "#888888"]);
  const removePaletteColor = (index: number) =>
    setPalette((prev) => prev.filter((_, i) => i !== index));

  // Campaign overview state
  const [campaignOwners, setCampaignOwners] = useState("Jide Pinheiro, Amara Obi");
  const [campaignStart, setCampaignStart] = useState("2026-08-01");
  const [campaignEnd, setCampaignEnd] = useState("2026-10-31");
  const [campaignDeadline, setCampaignDeadline] = useState("2026-07-25");

  // Settings state
  const [brandUrl, setBrandUrl] = useState(defaultPreset.url);
  const [scope, setScope] = useState(defaultPreset.scope);
  const [footprint, setFootprint] = useState(defaultPreset.footprint);
  const [aesthetic, setAesthetic] = useState(defaultPreset.aesthetic);
  const [toneVal, setToneVal] = useState(defaultPreset.toneVal);
  const [toneLabel, setToneLabel] = useState(defaultPreset.toneText);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Brand DNA: editable core value proposition
  const [valueProp, setValueProp] = useState(valuePropositionData.coreHeadline);
  const progressStages = valuePropositionData.progressModel;

  // Page accent (primary) override — default blue (#2563eb)
  const [primaryColor, setPrimaryColor] = useState<string>("#2563eb");
  const handleAccentChange = (color: string) => {
    setPrimaryColor(color);
    setPalette((prev) => [color, ...prev.slice(1)]);
  };
  const collaborators = [
    { name: "Jide Pinheiro", initials: "JP", color: "#0B3B2E" },
    { name: "Amara Obi", initials: "AO", color: "#B45309" },
    { name: "Tunde Bello", initials: "TB", color: "#1D4ED8" },
  ];

  // Chat state
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: number; role: "assistant" | "user"; text: string }>
  >([
    {
      id: 1,
      role: "assistant",
      text: "Hi — I can help shape this campaign. Ask me about direction, copy angles or channel ideas for the selected account.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const replyIndexRef = useRef(0);
  const nextCampaignNumberRef = useRef(2);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat collapse state
  const [chatOpen, setChatOpen] = useState(true);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), role: "user" as const, text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      const replyText = chatReplies[replyIndexRef.current % chatReplies.length];
      replyIndexRef.current += 1;
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant" as const, text: replyText },
      ]);
    }, 700);
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

  const handleExportCampaign = () => {
    window.print();
  };

  const handleNewCampaign = () => {
    const campaignNumber = nextCampaignNumberRef.current;
    const id = `campaign-${campaignNumber}`;
    const title = `Untitled campaign ${campaignNumber}`;
    nextCampaignNumberRef.current += 1;
    setCampaigns((prev) => [...prev, { id, title, status: "Draft" }]);
    setActiveCampaignId(id);
    setProjectName(title);
    setCurrentPhase("launch");
    setActiveSection("social");
    setMarketAudience(defaultPreset.footprintShort);
    setBrandUrl(defaultPreset.url);
    setScope(defaultPreset.scope);
    setFootprint(defaultPreset.footprint);
    setAesthetic(defaultPreset.aesthetic);
    setToneVal(defaultPreset.toneVal);
    setToneLabel(defaultPreset.toneText);
    setCampaignCopy(phaseContent);
    setStatusNotification(null);
    setActiveMainTab("campaign");
    setCampaignView("editor");
    showToast("New campaign draft created.");
  };

  const handleOpenCampaign = (campaign: CampaignListItem) => {
    setActiveCampaignId(campaign.id);
    setProjectName(campaign.title);
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
    const toneMap: Record<number, string> = {
      1: "Direct & Sharp",
      2: "Conversational & Familiar",
      3: "Expressive & Cultural",
      4: "Premium & Editorial",
    };
    setToneLabel(toneMap[val] || "Conversational");
  };

  const [campaignCopy, setCampaignCopy] = useState(phaseContent);
  const phase = campaignCopy[currentPhase];
  const updateCopy = (field: keyof PhaseContent, value: string) =>
    setCampaignCopy((prev) => ({
      ...prev,
      [currentPhase]: { ...prev[currentPhase], [field]: value },
    }));

  const getContrastTextColor = (hex: string) => {
    const value = hex.replace("#", "");
    const red = parseInt(value.substring(0, 2), 16);
    const green = parseInt(value.substring(2, 4), 16);
    const blue = parseInt(value.substring(4, 6), 16);
    return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? "#0f172a" : "#f8fafc";
  };

  return (
    <div
      className="min-h-screen lg:h-screen flex flex-col gap-2 overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-card p-2 text-foreground antialiased font-sans"
      style={
        primaryColor
          ? ({
              "--primary": primaryColor,
              "--ring": primaryColor,
              "--primary-foreground": getContrastTextColor(primaryColor),
            } as React.CSSProperties)
          : undefined
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-card border border-border text-card-foreground px-5 py-4 rounded-xl shadow-2xl z-50 text-sm font-sans max-w-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="whitespace-pre-line leading-relaxed">{toastMessage}</div>
        </div>
      )}

      {/* TOP HEADER: CLIENT IDENTIFIER */}
      <header className="min-h-16 rounded-xl bg-black text-white px-4 py-3 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <DashboardSidebarSheet trigger={
            <button
              type="button"
              aria-label="Open navigation menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent text-white hover:bg-white/10 focus-visible:outline-none transition cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          } />
          <Link
            href="/dashboard"
            aria-label="BBDO West Africa dashboard"
            className="hidden sm:flex shrink-0 items-center min-w-0 hover:opacity-85 transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bbdo-west-africa.png"
              alt="BBDO West Africa"
              className="block h-5 sm:h-6 w-auto max-w-full brightness-0 invert"
            />
          </Link>
          <span className="hidden sm:inline text-white/30 text-sm">/</span>
          <img
            src="/images/one-utility-logo.svg"
            alt={clientName}
            className="h-6 w-6 shrink-0 object-contain"
          />
          <span className="truncate text-sm font-semibold tracking-tight text-white">
            {clientName}
          </span>
          {activeMainTab === "campaign" && campaignView === "editor" && (
            <>
              <span className="text-white/30 text-xs font-mono">/</span>
              <span className="text-sm font-medium text-white/60 truncate">
                {projectName}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Collaborators */}
          <div className="hidden sm:flex items-center -space-x-2 pr-1" aria-label="Collaborators on this campaign">
            {collaborators.map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="grid h-7 w-7 place-items-center rounded-full border-2 border-black text-sm font-semibold text-white"
                style={{ backgroundColor: c.color }}
              >
                {c.initials}
              </span>
            ))}
          </div>

          {/* Accent color */}
          <label
            title="Change accent color"
            className="relative flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-secondary-foreground bg-secondary hover:bg-secondary/90 rounded-md border border-border transition cursor-pointer"
          >
            <span
              className="h-3.5 w-3.5 rounded-full border border-border"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="hidden sm:inline">Accent</span>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => handleAccentChange(e.target.value)}
              aria-label="Change accent color"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>

          <button onClick={handleShareCampaign} aria-label="Share" className="px-2.5 sm:px-3.5 py-1.5 text-sm font-medium text-secondary-foreground bg-secondary hover:bg-secondary/90 rounded-md border border-border transition flex items-center gap-2">
            <LinkIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Share</span>
          </button>
          <button onClick={handleExportCampaign} aria-label="Export" className="px-2.5 sm:px-3.5 py-1.5 text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-md transition flex items-center gap-2">
            <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Export</span>
          </button>
          <ProfileNav />
        </div>
      </header>

      <div className="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0 gap-2 lg:overflow-hidden">
      {/* RIGHT SIDEBAR: WORKSPACE ASSISTANT */}
      <aside
        className={`order-2 rounded-xl bg-background flex flex-col shrink-0 z-20 overflow-visible lg:overflow-hidden transition-all ${
          chatOpen ? "w-full lg:w-96" : "w-full lg:w-12"
        }`}
      >
        {/* Chat Header / Collapse Toggle */}
        <div className="flex items-center justify-between gap-2 p-3 border-b border-border shrink-0">
          {chatOpen && (
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Workspace assistant
            </span>
          )}
          <button
            onClick={() => setChatOpen((v) => !v)}
            aria-label={chatOpen ? "Collapse assistant" : "Expand assistant"}
            aria-expanded={chatOpen}
            className="grid h-8 w-8 flex-none place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition ml-auto"
          >
            {chatOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
        </div>

        {chatOpen && (
          <>
        {/* Chat Messages */}
        <div id="chatMessages" className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px] lg:min-h-0">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${
                msg.role === "user" ? "justify-end" : ""
              }`}
            >
              {msg.role === "assistant" && (
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "rounded-tr-sm bg-primary text-primary-foreground font-medium shadow"
                    : "rounded-tl-sm border border-border bg-muted/60 text-foreground"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatMessagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-border bg-card/60 shrink-0">
          <form onSubmit={handleSendChat} className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask the workspace assistant..."
              autoComplete="off"
              className="flex-1 min-w-0 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition"
            />
            <button
              type="submit"
              aria-label="Send"
              className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-primary hover:opacity-90 text-primary-foreground transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
          </>
        )}
      </aside>

      {/* MAIN CANVAS: TABS + CONTENT */}
      <main className="order-1 lg:flex-1 lg:min-h-0 rounded-xl bg-background flex flex-col lg:overflow-hidden">

        {/* TOP-LEVEL VIEW TABS: OVERVIEW | CAMPAIGNS | BRAND DNA */}
        <div className="min-h-12 border-b border-border px-1 sm:px-6 flex items-center justify-center gap-0.5 sm:gap-1 bg-card/60 shrink-0">
          <button
            onClick={() => setActiveMainTab("overview")}
            className={`flex-1 sm:flex-none justify-center px-2 sm:px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap ${
              activeMainTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Box className="w-3.5 h-3.5" /> Overview
          </button>
          <button
            onClick={() => {
              setActiveMainTab("campaign");
              setCampaignView("home");
            }}
            className={`flex-1 sm:flex-none justify-center px-2 sm:px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap ${
              activeMainTab === "campaign"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Campaigns
          </button>
          <button
            onClick={() => setActiveMainTab("brand")}
            className={`flex-1 sm:flex-none justify-center px-2 sm:px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap ${
              activeMainTab === "brand"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Palette className="w-3.5 h-3.5" /> Brand DNA
          </button>
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
                      className="group overflow-hidden text-left transition flex flex-col"
                    >
                      <div className="relative w-full aspect-square bg-muted overflow-hidden rounded-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/one-utility-bank-campaign-preview.png"
                          alt={campaign.title}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <span className="absolute top-3 left-3 rounded-md bg-background/90 backdrop-blur-sm px-2 py-0.5 text-xs font-mono uppercase tracking-wide text-primary font-semibold border border-border">
                          {campaign.status}
                        </span>
                      </div>
                      <div className="pt-3 flex flex-col flex-1 justify-between space-y-1">
                        <span className="block text-sm font-semibold text-foreground group-hover:text-primary transition">{campaign.title}</span>
                        <span className="block text-sm text-muted-foreground">Open campaign workspace</span>
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
                  </div>
                </div>

                {/* CAMPAIGN SUB-TAB: OVERVIEW */}
                {campaignSubTab === "overview" && (
                  <div className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 pr-1 py-4">
                    <div className="space-y-4 max-w-2xl">
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

                      <CopyField
                        label="Owners"
                        hint="People accountable"
                        value={campaignOwners}
                        onChange={setCampaignOwners}
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
                  <div className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 pr-1">
                    <StrategyDoc markdown={strategyMarkdown} />
                  </div>
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

                    <CopyGroup icon={<Store className="w-3.5 h-3.5" />} title="Retail & field" open={activeSection === "retail"} onToggle={() => toggleSection("retail")}>
                      <CopyField label="Activation title" value={phase.activationTitle} onChange={(v) => updateCopy("activationTitle", v)} />
                      <CopyField label="Activation body" value={phase.activationBody} onChange={(v) => updateCopy("activationBody", v)} textarea />
                    </CopyGroup>

                    <CopyGroup icon={<Users className="w-3.5 h-3.5" />} title="Experiential, creators & PR" open={activeSection === "experiential"} onToggle={() => toggleSection("experiential")}>
                      <CopyField label="Experience title" value={phase.experienceTitle} onChange={(v) => updateCopy("experienceTitle", v)} />
                      <CopyField label="Experience body" value={phase.experienceBody} onChange={(v) => updateCopy("experienceBody", v)} textarea />
                      <CopyField label="PR angle" value={phase.prPitchAngle} onChange={(v) => updateCopy("prPitchAngle", v)} textarea />
                    </CopyGroup>
                  </div>

                  {/* RIGHT: LIVE PREVIEW WINDOW */}
                  <div className="lg:min-h-0 lg:overflow-y-auto rounded-2xl border border-border bg-muted/30 p-4 sm:p-6 flex items-center justify-center">
                    <div className="w-full max-w-sm space-y-6">
                    {activeSection === "social" && (
                    <div className="space-y-6">
                      <VisualLabel icon={<Smartphone className="w-3.5 h-3.5" />}>Social</VisualLabel>
                    {/* Social post mockup */}
                    <div className="space-y-3">
                      <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                        <InstagramIcon className="w-3.5 h-3.5" /> Social post
                      </span>
                      <div
                        className="w-full aspect-square rounded-3xl border border-border bg-cover bg-center relative overflow-hidden shadow-2xl flex flex-col justify-between p-6 group"
                        style={campaignPreviewBackground}
                      >
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {preset.socialAccount}
                          </span>
                          <span className="text-sm bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            Sponsored
                          </span>
                        </div>

                        <div className="relative z-10 text-center space-y-3 my-auto">
                          <span className="text-sm tracking-widest text-primary uppercase font-mono block">
                            Phase: {currentPhase.toUpperCase()}
                          </span>
                          <h3 className="text-3xl text-foreground font-bold leading-snug">
                            {phase.socialTitle}
                          </h3>
                          <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
                            {phase.socialBody}
                          </p>
                        </div>

                        <div className="relative z-10 text-center">
                          <button className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl uppercase hover:opacity-90 transition">
                            {phase.socialCta}
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                    )}

                    {activeSection === "film" && (
                      <div className="space-y-3">
                        <VisualLabel icon={<Film className="w-3.5 h-3.5" />}>Film / TVC</VisualLabel>
                        <div
                          className="w-full aspect-video rounded-2xl border border-border bg-cover bg-center relative overflow-hidden shadow-2xl flex flex-col justify-between p-5"
                          style={campaignPreviewBackground}
                        >
                          <div className="relative z-10 flex justify-between items-center text-xs font-mono text-muted-foreground">
                            <span>0:00 / 0:30</span>
                            <span>TVC</span>
                          </div>
                          <span className="absolute inset-0 m-auto grid h-14 w-14 place-items-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
                            <Play className="w-6 h-6 ml-0.5" />
                          </span>
                          <div className="relative z-10 space-y-1">
                            <h4 className="text-base font-bold text-foreground leading-snug">{phase.filmTitle}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{phase.filmDesc}</p>
                            <span className="inline-block mt-2 px-3 py-1.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg">
                              {phase.filmCta}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSection === "audio" && (
                      <div className="space-y-3">
                        <VisualLabel icon={<Mic className="w-3.5 h-3.5" />}>Audio / radio</VisualLabel>
                        <div className="w-full rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                          <div className="flex justify-between items-center text-xs font-mono text-muted-foreground">
                            <span>RADIO SPOT</span>
                            <span>0:30</span>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-base font-bold text-foreground leading-snug">{phase.audioTitle}</h4>
                            <p className="text-sm text-muted-foreground">{phase.audioDesc}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary text-primary-foreground">
                              <Play className="w-4 h-4 ml-0.5" />
                            </span>
                            <div className="flex items-center gap-0.5 h-8 flex-1">
                              {[40, 70, 30, 90, 55, 75, 35, 60, 85, 45, 65, 25, 80, 50, 70, 40, 60, 30].map(
                                (h, i) => (
                                  <span
                                    key={i}
                                    className="flex-1 bg-primary/30 rounded-sm"
                                    style={{ height: `${h}%` }}
                                  />
                                )
                              )}
                            </div>
                          </div>
                          <span className="inline-block px-3 py-1.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg">
                            {phase.audioCta}
                          </span>
                        </div>
                      </div>
                    )}

                    {activeSection === "ooh" && (
                      <div className="space-y-3">
                        <VisualLabel icon={<Megaphone className="w-3.5 h-3.5" />}>Out of home</VisualLabel>
                        <div
                          className="w-full aspect-[16/7] rounded-2xl border border-border bg-cover bg-center p-8 sm:p-12 flex flex-col justify-between relative shadow-sm overflow-hidden"
                          style={campaignPreviewBackground}
                        >
                          <div className="flex justify-between items-start text-xs font-mono text-muted-foreground">
                            <span>48-SHEET / DIGITAL OOH · {preset.oohPlacement}</span>
                            <span className="text-primary">{preset.oohFormat}</span>
                          </div>
                          <div className="max-w-2xl space-y-2">
                            <span className="text-sm uppercase tracking-widest text-primary font-mono">
                              {preset.client}
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-none">
                              {phase.oohTitle}
                            </h2>
                            <p className="text-sm text-muted-foreground font-light">{phase.oohDesc}</p>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground font-mono">
                              {marketAudience.toUpperCase()}
                            </span>
                            <span className="inline-block px-3 py-1.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg">
                              {phase.oohCta}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSection === "print" && (
                      <div className="space-y-3">
                        <VisualLabel icon={<Newspaper className="w-3.5 h-3.5" />}>Press & print</VisualLabel>
                        <div
                          className="w-full aspect-[3/4] rounded-2xl border border-border bg-cover bg-center p-6 shadow-sm flex flex-col justify-between overflow-hidden"
                          style={campaignPreviewBackground}
                        >
                          <div className="space-y-2">
                            <span className="text-sm uppercase tracking-widest text-primary font-mono block">
                              {preset.client}
                            </span>
                            <h4 className="text-2xl font-extrabold text-foreground leading-tight">
                              {phase.printTitle}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {phase.printDesc}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 opacity-30">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <span key={i} className="h-1.5 rounded-sm bg-muted-foreground" />
                            ))}
                          </div>
                          <span className="inline-block px-3 py-1.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg self-start">
                            {phase.printCta}
                          </span>
                        </div>
                      </div>
                    )}
                    {activeSection === "retail" && (
                    <div className="space-y-6">
                      <VisualLabel icon={<Store className="w-3.5 h-3.5" />}>Retail & field</VisualLabel>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="rounded-2xl p-6 bg-card border border-border space-y-3 flex flex-col justify-between shadow-sm">
                      <div className="space-y-2">
                        <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5" /> Lead activation concept
                        </span>
                        <h4 className="text-xl font-bold text-foreground">{phase.activationTitle}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed font-light">
                          {phase.activationBody}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground font-mono pt-4 border-t border-border">
                        Production scope: layout, staffing, assets & measurement
                      </div>
                    </div>

                    <div className="rounded-2xl p-6 bg-card border border-border space-y-3 flex flex-col justify-between shadow-sm">
                      <div className="space-y-2">
                        <span className="text-xs font-mono text-primary flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5" /> Modular activation unit
                        </span>
                        <h4 className="text-xl font-bold text-foreground">Field & Partner Toolkit</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed font-light">
                          A scalable physical system for promoters, branches, product education or audience onboarding.
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground font-mono pt-4 border-t border-border">
                        Includes: key visual, scripts, setup guide & reporting
                      </div>
                    </div>

                    <div className="rounded-2xl p-6 bg-muted border border-border text-foreground space-y-3 flex flex-col justify-between shadow-sm">
                      <div className="space-y-2">
                        <span className="text-xs font-mono tracking-widest text-muted-foreground uppercase block">
                          POST-EXPERIENCE FOLLOW-UP
                        </span>
                        <h4 className="text-xl font-bold text-foreground">Keep the campaign moving.</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          A QR-enabled takeaway connecting the physical touchpoint to product information, sign-up or the next useful action.
                        </p>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground pt-3 border-t border-border flex justify-between">
                        <span>Digital fallback</span>
                        <span>Consent-aware capture</span>
                      </div>
                    </div>
                  </div>
                </div>
                    )}

                    {activeSection === "experiential" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <VisualLabel icon={<Users className="w-3.5 h-3.5" />}>Experiential, creators & PR</VisualLabel>
                        <span className="text-sm text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                          Earned / shared plan
                        </span>
                      </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="rounded-2xl p-6 bg-card border border-border space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-primary flex items-center gap-2">
                          <Users className="w-4 h-4" /> Live Culture Activation
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {marketAudience.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{phase.experienceTitle}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-light">
                        {phase.experienceBody}
                      </p>
                    </div>

                    <div className="rounded-2xl p-6 bg-card border border-border space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-primary flex items-center gap-2">
                          <MessageSquareMore className="w-4 h-4" /> Creator & press system
                        </span>
                        <span className="text-sm bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                          Audience-fit shortlist
                        </span>
                      </div>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="p-3 bg-muted rounded-lg border border-border space-y-1">
                          <span className="text-sm text-primary font-mono">CREATOR BRIEF</span>
                          <p className="font-semibold text-foreground">
                            One non-negotiable message, room for creator-native expression
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Define the audience, format, disclosure, brand-safety boundaries, deliverables and measurement before outreach.
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg border border-border space-y-1">
                          <span className="text-sm text-primary font-mono">PRESS RELEASE ANGLE</span>
                          <p className="text-sm text-foreground">“{phase.prPitchAngle}”</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                    )}
                  </div>
                  </div>
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
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
                <TabPageHeader title="Overview" />
              </div>

              {/* OVERVIEW LIST */}
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-muted-foreground w-40 font-mono text-xs uppercase">Client</span>
                  <span className="text-foreground font-medium">{clientName}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-foreground w-40 font-mono text-xs uppercase">Target Audience</span>
                  <span className="text-foreground font-medium">{marketAudience}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-foreground w-40 font-mono text-xs uppercase">Number of campaigns</span>
                  <span className="text-foreground font-medium">{campaigns.length}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-foreground w-40 font-mono text-xs uppercase">Date Created</span>
                  <span className="text-foreground font-medium">Sep 01, 2026</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-foreground w-40 font-mono text-xs uppercase">Date Modified</span>
                  <span className="text-foreground font-medium">Sep 04, 2026</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-foreground w-40 font-mono text-xs uppercase">Status</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-foreground font-medium">In progress</span>
                  </div>
                </li>
              </ul>

              <div className="bg-card rounded-xl p-5 border border-border space-y-3 shadow-sm">
                <span className="text-xs font-mono text-primary uppercase block">Production readiness checklist</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground font-mono border-t border-border pt-3">
                  <div><span className="text-muted-foreground block text-sm">MANDATORIES</span><span className="text-foreground">Legal, accessibility, localisation and approvals</span></div>
                </div>
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

              {/* BUSINESS OVERVIEW & DESIGN */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* BUSINESS OVERVIEW */}
                <section className="space-y-5 bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="border-b border-border pb-3">
                    <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
                      Client Profile
                    </span>
                    <h2 className="text-base font-semibold text-foreground mt-0.5">Business Overview</h2>
                  </div>

                  <div className="p-4 rounded-xl bg-muted border border-border space-y-2">
                    <span className="text-sm text-muted-foreground block uppercase font-mono">Client wordmark</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/one-utility-logo.svg"
                      alt={preset.client}
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
                        onChange={(e) => setBrandUrl(e.target.value)}
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
                      onChange={(e) => setFootprint(e.target.value)}
                      className="w-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition"
                    />
                  </div>



                  {/* 4-Stage Utility Progress Model */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> The 4-Stage Progress Model
                    </span>
                    <ol className="space-y-2.5">
                      {progressStages.map((item, idx) => (
                        <li key={item.stage} className="flex gap-3">
                          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary font-mono text-xs font-bold">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {item.stage} <span className="text-muted-foreground font-normal">— {item.label}</span>
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </section>

                {/* IDENTITY (DESIGN SYSTEM, PALETTE, AESTHETIC, TONE) */}
                <section className="space-y-5 bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="border-b border-border pb-3">
                    <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
                      Identity
                    </span>
                    <h2 className="text-base font-semibold text-foreground mt-0.5">Design & Palette</h2>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground block uppercase font-mono">Client palette</span>
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
                      Typography pairing
                    </label>
                    <select
                      id="fontPairing"
                      value={fontPairing}
                      onChange={(e) => setFontPairing(e.target.value)}
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
                        One Bill. No Leap of Faith.
                      </p>
                      <p
                        className="text-sm text-muted-foreground leading-relaxed"
                        style={{ fontFamily: (FONT_STACKS[fontPairing] ?? FONT_STACKS[fontOptions[0]]).body }}
                      >
                        OneUtility puts you in control of the essentials that keep life running, giving you peace of mind. 1234567890
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
                      onChange={(e) => setAesthetic(e.target.value)}
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
