// Per-client workspace content for /dashboard/clients/[slug].
//
// The client workspace (overview, campaigns, strategy, creatives, brand DNA) was
// originally built around 1Utility and imported that brand's data statically, so
// every client rendered 1Utility's strategy, palette, preview image and copy.
// This module keys that content per client. Clients without curated content get a
// blank template (see makeEmptyWorkspace) so nothing from another client leaks in.

import type { CampaignMediaPlan, PhaseKey, PhaseContent, PresetData } from "./client-data";
import {
  defaultPreset,
  strategyMarkdown,
  phaseContent,
  oneUtilityCampaignMediaPlans,
  valuePropositionData,
} from "./client-data";
import { CAMPAIGNS } from "./campaigns";

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
  clientId: string;
  preset: PresetData;
  strategyMarkdown: string;
  phaseContent: Record<PhaseKey, PhaseContent>;
  valueProposition: ValueProposition;
  palette: string[];
  primaryColor: string;
  brandArchetype: string;
  creatorSlugs: string[];
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

const oneUtilityWorkspace: ClientWorkspace = {
  clientId: "1utility",
  preset: defaultPreset,
  strategyMarkdown,
  phaseContent,
  valueProposition: valuePropositionData,
  palette: ["#1B3FC2", "#2237B4", "#72B7FF", "#F3F2F2"],
  primaryColor: "#1B3FC2",
  brandArchetype: "The Everyman",
  creatorSlugs: [
    "joseph-adeyemo",
    "king-elisha",
    "akinbinu-akintayo",
    "priscilla-ibiteye",
    "the-house-studios",
    "iszy-media",
    "adeola-fadola",
    "loup-garou-films",
    "tmofilms",
    "ibst-media",
    "film-factory",
  ],
  moodboardImages: [
    { src: "/sites/1ub/campaign/deck/uploads/overview-product-utility-v2.jpg", alt: "1Utility Bank utility product artwork" },
    { src: "/sites/1ub/campaign/deck/uploads/overview-challenge-community-v2.jpg", alt: "1Utility Bank community artwork" },
    { src: "/sites/1ub/campaign/deck/uploads/creative-moodboard.png", alt: "1Utility Bank creative moodboard" },
    { src: "/sites/1ub/campaign/deck/uploads/concept-everyday-oracle-v2.png", alt: "1Utility Bank Everyday Oracle concept artwork" },
    { src: "/images/one-utility-bank-campaign-preview.png", alt: "1Utility Bank Leap of Faith campaign artwork" },
    { src: "/sites/1ub/campaign/deck/uploads/1u-audience-lifestyle.jpg", alt: "1Utility Bank audience lifestyle photography" },
  ],
  campaignMediaPlans: oneUtilityCampaignMediaPlans,
  creativePreviews: {
    social: {
      src: "/media/clients/1utility/social.png",
      alt: "Nigerian woman using 1Utility Bank on a Lagos balcony",
    },
    film: {
      src: "/media/clients/1utility/film.png",
      alt: "Nigerian family at home after a utility payment",
    },
    audio: {
      src: "/media/clients/1utility/audio.png",
      alt: "Nigerian radio presenter in a blue broadcast studio",
    },
    ooh: {
      src: "/media/clients/1utility/ooh.png",
      alt: "1Utility Bank out-of-home billboard in Lagos",
    },
    print: {
      src: "/media/clients/1utility/print.png",
      alt: "Nigerian father and daughter at home after a utility payment",
    },
  },
  fontPreview: {
    heading: "One Bill. No Leap of Faith.",
    body: "OneUtility puts you in control of the essentials that keep life running, giving you peace of mind. 1234567890",
  },
  overviewVideo: "/upload-latertofirebase/sites/1ub/campaign/deck/uploads/hero-audience-v3-video.mp4",
  hasContent: true,
};

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

function makeEmptyWorkspace(clientId: string, clientName: string): ClientWorkspace {
  const campaign = CAMPAIGNS.find((item) => item.clientId === clientId);
  const category = campaign?.category ?? "";
  const website = campaign?.externalLinks?.find((link) => link.label === "Website")?.href ?? "";
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
    clientId,
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
    creatorSlugs: [],
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

const CLIENT_WORKSPACES: Record<string, ClientWorkspace> = {
  "1utility": oneUtilityWorkspace,
};

export function getClientWorkspace(clientId: string, clientName: string): ClientWorkspace {
  return CLIENT_WORKSPACES[clientId] ?? makeEmptyWorkspace(clientId, clientName);
}
