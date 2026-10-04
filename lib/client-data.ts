// Shape of the client workspace's editable job content
// (/dashboard/clients/[slug]). The actual content lives in Firestore; this
// file only holds the types and small fixed enums the workspace UI needs.

export type PhaseKey = "tease" | "launch" | "experience" | "sustain";

export interface PresetData {
  client: string;
  category: string;
  name: string;
  url: string;
  scope: string;
  footprint: string;
  footprintShort: string;
  aesthetic: string;
  toneVal: number;
  toneText: string;
  headline: string;
  subtext: string;
  palette: string[];
  socialAccount: string;
  socialTitle: string;
  socialBody: string;
  socialCta: string;
  contentPillar: string;
  contentTitle: string;
  contentBody: string;
  bannerCta: string;
  oohPlacement: string;
  oohFormat: string;
  oohSubcopy: string;
  printLead: string;
  printBody: string;
  activationTitle: string;
  activationBody: string;
  experienceTitle: string;
  experienceBody: string;
  prPitchAngle: string;
}

export interface PhaseContent {
  socialTitle: string;
  socialBody: string;
  socialCta: string;
  contentPillar: string;
  contentTitle: string;
  contentBody: string;
  bannerCta: string;
  filmTitle: string;
  filmDesc: string;
  filmCta: string;
  audioTitle: string;
  audioDesc: string;
  audioCta: string;
  oohTitle: string;
  oohDesc: string;
  oohCta: string;
  printTitle: string;
  printDesc: string;
  printCta: string;
  activationTitle: string;
  activationBody: string;
  experienceTitle: string;
  experienceBody: string;
  prPitchAngle: string;
}

export type JobWorkspaceStatus = "Draft" | "Pitch" | "In progress" | "Live" | "Completed";

export const jobWorkspaceStatuses: JobWorkspaceStatus[] = [
  "Draft",
  "Pitch",
  "In progress",
  "Live",
  "Completed",
];

export type MarketingCard = {
  title: string;
  rows: { label: string; value: string }[];
};

export type JobMediaPlan = {
  mediaBuying: MarketingCard[];
  influencerMarketing: MarketingCard[];
};

export type JobListItem = {
  id: string;
  title: string;
  status: JobWorkspaceStatus;
};
