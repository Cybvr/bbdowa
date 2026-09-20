// Client workspace content shown on /dashboard/clients/[slug]
// (overview, campaigns, strategy, creatives, brand DNA).
//
// The workspace fields live directly on the project (they are spread onto it in
// lib/campaigns.ts, and persisted through Firestore). This module holds the
// workspace field SHAPE and a blank template (makeEmptyWorkspace) used for
// projects that have no curated content yet, so nothing from another client
// ever leaks in.

import type { CampaignMediaPlan, PhaseKey, PhaseContent, PresetData } from "./client-data";

export type CreativePreview = { src: string; alt: string };

export type CreativeChannel = "social" | "film" | "audio" | "ooh" | "print";

export type ValueProposition = {
  coreHeadline: string;
  accountDefinition: string;
  consumerBenefit: string;
  institutionalAngle: string;
  progressModel: { stage: string; label: string; desc: string }[];
};

export type ClientWorkspace = {
  preset: PresetData;
  strategyMarkdown: string;
  phaseContent: Record<PhaseKey, PhaseContent>;
  valueProposition: ValueProposition;
  palette: string[];
  primaryColor: string;
  brandArchetype: string;
  moodboardImages: CreativePreview[];
  campaignMediaPlans: Record<string, CampaignMediaPlan>;
  creativePreviews: Record<CreativeChannel, CreativePreview>;
  fontPreview: { heading: string; body: string };
  // Optional campaign film shown on the client Overview; omitted when there is none.
  overviewVideo?: string;
  // true = curated content for this client; false = blank fallback template.
  hasContent: boolean;
};

const PLACEHOLDER_IMAGE = "/images/projects/project-placeholder.svg";
const NEUTRAL_PALETTE = ["#111827", "#374151", "#9CA3AF", "#F3F4F6"];

const emptyPhase: PhaseContent = {
  socialTitle: "",
  socialBody: "",
  socialCta: "",
  contentPillar: "",
  contentTitle: "",
  contentBody: "",
  bannerCta: "",
  filmTitle: "",
  filmDesc: "",
  filmCta: "",
  audioTitle: "",
  audioDesc: "",
  audioCta: "",
  oohTitle: "",
  oohDesc: "",
  oohCta: "",
  printTitle: "",
  printDesc: "",
  printCta: "",
  activationTitle: "",
  activationBody: "",
  experienceTitle: "",
  experienceBody: "",
  prPitchAngle: "",
};

function emptyPhaseContent(): Record<PhaseKey, PhaseContent> {
  return {
    tease: { ...emptyPhase },
    launch: { ...emptyPhase },
    experience: { ...emptyPhase },
    sustain: { ...emptyPhase },
  };
}

/** A blank workspace for a client/project that has no curated content yet. */
export function makeEmptyWorkspace({
  clientName,
  category = "",
  website = "",
}: {
  clientName: string;
  category?: string;
  website?: string;
}): ClientWorkspace {
  const url = website.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const preset: PresetData = {
    client: clientName,
    category,
    name: "Campaign to be defined",
    url,
    scope: "integrated",
    footprint: "",
    footprintShort: "Audience to be defined",
    aesthetic: "brand",
    toneVal: 2,
    toneText: "Conversational & Familiar",
    headline: "",
    subtext: "",
    palette: NEUTRAL_PALETTE,
    socialAccount: clientName,
    socialTitle: "",
    socialBody: "",
    socialCta: "",
    contentPillar: "",
    contentTitle: "",
    contentBody: "",
    bannerCta: "",
    oohPlacement: "",
    oohFormat: "",
    oohSubcopy: "",
    printLead: "",
    printBody: "",
    activationTitle: "",
    activationBody: "",
    experienceTitle: "",
    experienceBody: "",
    prPitchAngle: "",
  };

  return {
    preset,
    strategyMarkdown: `# ${clientName}\n\nStrategy for this client has not been added yet.`,
    phaseContent: emptyPhaseContent(),
    valueProposition: {
      coreHeadline: "",
      accountDefinition: "",
      consumerBenefit: "",
      institutionalAngle: "",
      progressModel: [],
    },
    palette: NEUTRAL_PALETTE,
    primaryColor: NEUTRAL_PALETTE[0],
    brandArchetype: "The Everyman",
    moodboardImages: [],
    campaignMediaPlans: {},
    creativePreviews: {
      social: { src: PLACEHOLDER_IMAGE, alt: "" },
      film: { src: PLACEHOLDER_IMAGE, alt: "" },
      audio: { src: PLACEHOLDER_IMAGE, alt: "" },
      ooh: { src: PLACEHOLDER_IMAGE, alt: "" },
      print: { src: PLACEHOLDER_IMAGE, alt: "" },
    },
    fontPreview: {
      heading: clientName,
      body: "The quick brown fox jumps over the lazy dog. 1234567890",
    },
    hasContent: false,
  };
}
