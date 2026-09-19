import type { ClientWorkspace } from "@/lib/client-workspaces";
import { oneUtilityWorkspace } from "@/lib/client-workspaces";

export type CampaignStatus = "live" | "pitch" | "completed";

export type CampaignMedia = {
  kind: "image" | "video";
  src: string;
  alt: string;
  poster?: string;
};

export type CampaignLiveDate = {
  date: string;
};

export type CampaignExternalLink = {
  label: string;
  href: string;
};

export type Campaign = {
  slug: string;
  name: string;
  campaign?: string;
  clientId: string;
  clientName: string;
  category: string;
  year: number | null;
  liveAt?: CampaignLiveDate;
  status: CampaignStatus;
  leadUserId: string | null;
  publishedBy?: string | null;
  fee: string;
  target: string;
  result: string;
  image: string;
  imageAlt: string;
  media: CampaignMedia[];
  externalLinks?: CampaignExternalLink[];
  summary: string;
  challenge: string;
  insight: string;
  strategy: string;
  platform: string[];
  execution: string;
  outcome: string;
  placeholder: boolean;
} & Partial<ClientWorkspace>;

export const CAMPAIGNS: Campaign[] = [
  {
    slug: "thats-naija-thats-jack",
    name: "Jack Daniel’s",
    campaign: "That’s Naija, That’s Jack",
    clientId: "brown-forman",
    clientName: "Brown-Forman",
    category: "Food & beverages",
    year: 2026,
    liveAt: { date: "2026-08-01" },
    status: "live",
    leadUserId: "samiat-basorun",
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/jack-daniels/independence-day.jpg",
    imageAlt: "Jack Daniel's Nigeria Independence Day campaign artwork",
    media: [],
    summary:
      "A two-phase rollout for ‘That’s Naija. That’s Jack.’, moving from an August 2026 launch into retail, rooftop, festival and year-end cultural experiences.",
    challenge:
      "Launch ‘That’s Naija. That’s Jack.’ at scale, build immediate awareness in Lagos and Abuja, and sustain Jack Daniel’s cultural relevance beyond the launch through the end-of-year season.",
    insight:
      "The Nigerians moving music, fashion, business and art forward are often the ones who refuse outdated scripts and trust their own way. That conviction is distinctly Naija and true to Jack Daniel’s long-standing celebration of individuality.",
    strategy:
      "Build one campaign world around self-belief and refusal of the ordinary, then roll it out in two connected phases: a loud, integrated launch across paid and earned channels, followed by retail and cultural experiences that meet people where culture happens.",
    platform: [
      "Social media",
      "Out-of-home",
      "Radio",
      "Influencer partnerships",
      "Retail activations",
      "Experiential",
      "Cultural sponsorships",
    ],
    execution:
      "The rollout opens with always-on lifestyle content, followed by product-led outdoor in Lagos and Abuja, three radio scripts and a coordinated influencer reveal. Phase two expands into five weekly retail pop-ups, The Rooftop Reserve and partnerships across Creative Bloc, Felabration, Lagos Cocktail Weekend and Art X Lagos, closing with the Off The Record rave in December.",
    outcome: "Performance results have not been supplied.",
    placeholder: false,
  },
  {
    slug: "make-we-bet",
    name: "Betano",
    campaign: "Make We Bet",
    clientId: "keizen-games",
    clientName: "Keizen Games",
    category: "Entertainment",
    year: 2026,
    liveAt: { date: "2026-01-15" },
    status: "live",
    leadUserId: "samiat-basorun",
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/betano/make-we-bet-betano.png",
    imageAlt: "Two people linking pinky fingers during a sports conversation",
    media: [],
    summary:
      "Created by DDB Lagos, Make We Bet launched for Betano across Nigeria and Ghana in January 2026.",
    challenge:
      "Bring Betano’s wagering proposition into the language and rituals of everyday West African sports debates.",
    insight:
      "Friendly arguments often end with ‘make we bet’—a familiar challenge to prove certainty by putting something on the line.",
    strategy:
      "Use a familiar local phrase and the pinky-lock challenge to connect wagering with recognisable West African banter.",
    platform: ["Channels to be confirmed"],
    execution:
      "The campaign captures local sports debates, friendly arguments and the classic pinky-lock challenge, launching across Nigeria and Ghana in January 2026.",
    outcome:
      "The campaign launched in Nigeria and Ghana in January 2026. Performance results have not been supplied.",
    placeholder: false,
  },
  {
    slug: "proforce-nigeria",
    name: "Proforce Nigeria",
    clientId: "proforce-nigeria",
    clientName: "Proforce Nigeria",
    category: "Defence & manufacturing",
    year: 2026,
    liveAt: { date: "2026-03-15" },
    status: "pitch",
    leadUserId: "samiat-basorun",
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/proforce-nigeria/pf-viper.jpg",
    imageAlt: "Proforce PF Viper armoured vehicle",
    media: [],
    externalLinks: [
      { label: "Website", href: "https://proforcedefence.com/" },
      { label: "LinkedIn", href: "https://www.linkedin.com/company/proforce-limited/" },
      { label: "Instagram", href: "https://www.instagram.com/proforcedefence/" },
      { label: "Facebook", href: "https://www.facebook.com/proforceofficial" },
      { label: "X", href: "https://x.com/Proforcedefence" },
      { label: "YouTube", href: "https://www.youtube.com/c/PROFORCEofficial" },
    ],
    summary: "Campaign details will be added when the case-study content is supplied.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
  {
    slug: "leap-of-faith",
    name: "1 Utility Bank",
    campaign: "Leap of Faith",
    clientId: "1utility",
    clientName: "1 Utility Bank",
    category: "Finance",
    year: 2026,
    liveAt: { date: "2026-08-19" },
    status: "pitch",
    leadUserId: "samiat-basorun",
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/images/one-utility-bank-campaign-preview.png",
    imageAlt: "1Utility Bank Leap of Faith campaign artwork",
    media: [],
    externalLinks: [
      { label: "Website", href: "https://oneutilitymfb.com/" },
      { label: "LinkedIn", href: "https://www.linkedin.com/company/1ubank/" },
      { label: "Instagram", href: "https://www.instagram.com/1ubanksupport/" },
      { label: "Facebook", href: "https://www.facebook.com/1UBank" },
    ],
    summary:
      "One Bill. No Leap of Faith. positions 1Utility as the bank that turns one essential payment into a trusted, fuller banking relationship.",
    challenge:
      "1Utility needs to avoid being understood as just another fast payment tool and earn trust as a reliable primary banking relationship, beginning with everyday utility payments.",
    insight:
      "People do not need another place to pay a bill. They need one place that helps them see what is due, what is paid, what went through and what needs attention next.",
    strategy:
      "Win one useful moment first. Use a successful utility payment as proof that 1Utility delivers control and peace of mind, then build from trial to repeat use and a wider financial relationship.",
    platform: [
      "TV",
      "Radio",
      "Out-of-home",
      "Social media",
      "Creator partnerships",
      "Product demos",
      "Landing pages",
      "Paid search",
      "CRM",
      "In-person activations",
    ],
    execution:
      "The First Bill follows real people through one payment that matters, while What Peace Can Mean turns red DUE cards into blue DONE cards. Creator tests, product demonstrations and 1U Works Here sign-up moments make the proof visible at every step.",
    outcome:
      "Success is measured by the first successful utility payment, then by trust, second payment within 30 days, repeat frequency, reminder engagement and referrals.",
    placeholder: false,
    ...oneUtilityWorkspace,
  },
  {
    slug: "cbn",
    name: "CBN",
    clientId: "central-bank-of-nigeria",
    clientName: "Central Bank of Nigeria",
    category: "Finance",
    year: 2026,
    liveAt: { date: "2026-08-15" },
    status: "pitch",
    leadUserId: "enyi-odigbo",
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/cbn/headquarters.jpg",
    imageAlt: "Central Bank of Nigeria headquarters in Abuja",
    media: [],
    summary: "Pitch submitted. Awaiting a response from the client.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
  {
    slug: "benin-tourism",
    name: "Benin Tourism",
    clientId: "benin-tourism",
    clientName: "Benin Tourism",
    category: "Travel & tourism",
    year: 2026,
    liveAt: { date: "2026-05-15" },
    status: "pitch",
    leadUserId: "jide-pinheiro",
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/benin-tourism/tourism.jpg",
    imageAlt: "Traditional masks at Benin's Festival des Masques",
    media: [],
    summary: "Pitch submitted. Awaiting a response from the client.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
  {
    slug: "interswitch-verve",
    name: "Verve",
    clientId: "interswitch",
    clientName: "Interswitch",
    category: "Finance",
    year: 2021,
    liveAt: { date: "2021-04-15" },
    status: "completed",
    leadUserId: null,
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/interswitch-verve/verve-card.png",
    imageAlt: "Colourful Verve card campaign artwork",
    media: [],
    externalLinks: [
      { label: "Website", href: "https://www.myverveworld.com/" },
      { label: "LinkedIn", href: "https://www.linkedin.com/company/verve-international-ltd/" },
      { label: "Instagram", href: "https://www.instagram.com/vervecard/" },
      { label: "X", href: "https://x.com/vervecard" },
    ],
    summary: "Campaign details will be added when the case-study content is supplied.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
  {
    slug: "made-of-black",
    name: "Guinness",
    campaign: "Made of Black",
    clientId: "diageo",
    clientName: "Diageo",
    category: "Food & beverages",
    year: 2021,
    liveAt: { date: "2021-07-15" },
    status: "completed",
    leadUserId: null,
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/guinness/beerable-guinness.jpg",
    imageAlt: "Guinness responsible-drinking campaign artwork",
    media: [
      {
        kind: "image",
        src: "/media/projects/guinness/beerable-guinness.jpg",
        alt: "Guinness responsible-drinking campaign artwork with bottle caps",
      },
      {
        kind: "image",
        src: "/media/projects/guinness/beerable-guinness-2.jpg",
        alt: "Guinness responsible-drinking campaign artwork",
      },
      {
        kind: "image",
        src: "/media/projects/guinness/lagos-at-50-guinness.jpg",
        alt: "Lagos at 50 Guinness campaign artwork",
      },
      {
        kind: "video",
        src: "/upload-latertofirebase/media/projects/guinness/made-of-black-guinness.mp4",
        poster: "/media/projects/guinness/made-of-black-guinness-poster.jpg",
        alt: "Made of Black Guinness campaign film",
      },
    ],
    summary:
      "BBDO West Africa supports Guinness, owned by Diageo, with creative and strategic campaigns shaped for audiences across the region.",
    challenge:
      "Translate wider Guinness brand direction into locally relevant West African communications while reinforcing responsible drinking.",
    insight:
      "Regional campaigns become more meaningful when pan-African brand thinking is grounded in local insight, language and audience context.",
    strategy:
      "Combine regional strategy with localized content creation and network collaboration to make Guinness campaigns relevant across West African markets.",
    platform: ["Print", "Digital"],
    execution:
      "Work included the responsible-drinking print series ‘Don’t take on more than you can beer’, regional digital activations and supporting pan-African brand directions alongside network partners including AMV BBDO.",
    outcome:
      "The work extended Guinness communications across local and pan-African campaigns. Performance results have not been supplied.",
    placeholder: false,
  },
  {
    slug: "not-a-tourist",
    name: "Visa",
    campaign: "Not a Tourist",
    clientId: "visa",
    clientName: "Visa",
    category: "Finance",
    year: 2016,
    liveAt: { date: "2016-08-05" },
    status: "completed",
    leadUserId: null,
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/visa/rio-2016-visa.jpg",
    imageAlt: "Rio 2016 Visa campaign artwork",
    media: [
      {
        kind: "image",
        src: "/media/projects/visa/rio-2016-visa.jpg",
        alt: "Rio 2016 Visa campaign artwork",
      },
      {
        kind: "image",
        src: "/media/projects/visa/not-a-tourist-visa.jpg",
        alt: "Not a Tourist Visa campaign artwork",
      },
      {
        kind: "image",
        src: "/media/projects/visa/not-a-tourist-visa-2.jpg",
        alt: "Not a Tourist Visa campaign artwork",
      },
    ],
    summary: "Source gallery work includes Rio 2016 and Not a Tourist campaign artwork for Visa.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
  {
    slug: "know-google",
    name: "Google",
    campaign: "Know Google",
    clientId: "google",
    clientName: "Google",
    category: "Technology",
    year: null,
    liveAt: { date: "2020-06-15" },
    status: "completed",
    leadUserId: null,
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/google/football-google-poster.jpg",
    imageAlt: "Football Google campaign film still",
    media: [
      {
        kind: "video",
        src: "/upload-latertofirebase/media/projects/google/football-google.mp4",
        poster: "/media/projects/google/football-google-poster.jpg",
        alt: "Football Google campaign film",
      },
      {
        kind: "video",
        src: "/media/hero.mp4",
        poster: "/media/projects/google/know-google-poster.jpg",
        alt: "Know Google campaign film",
      },
    ],
    summary: "Source gallery work includes Football Google and Know Google campaign films.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
  {
    slug: "live-original",
    name: "Orijin",
    campaign: "Live Original",
    clientId: "orijin",
    clientName: "Orijin",
    category: "Food & beverages",
    year: null,
    liveAt: { date: "2019-09-15" },
    status: "completed",
    leadUserId: null,
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/orijin/live-orijinal-independence-day.png",
    imageAlt: "Orijin Live Orijinal Independence Day campaign artwork",
    media: [
      {
        kind: "video",
        src: "/upload-latertofirebase/media/projects/orijin/live-orijinal-orijin.mp4",
        poster: "/media/projects/orijin/live-orijinal-independence-day.png",
        alt: "Orijin Live Orijinal campaign film",
      },
    ],
    summary: "Source gallery work includes the Live Orijinal Orijin campaign film.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
  {
    slug: "cool-days",
    name: "Pringles",
    campaign: "Cool Days",
    clientId: "pringles",
    clientName: "Pringles",
    category: "Food & beverages",
    year: null,
    liveAt: { date: "2018-07-15" },
    status: "completed",
    leadUserId: null,
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/pringles/cool-days-pringles.jpg",
    imageAlt: "Cool Days Pringles campaign artwork",
    media: [
      {
        kind: "image",
        src: "/media/projects/pringles/cool-days-pringles.jpg",
        alt: "Cool Days Pringles campaign artwork",
      },
    ],
    summary: "Source gallery work includes Cool Days campaign artwork for Pringles.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
  {
    slug: "easter-anti-violence",
    name: "Chicken Republic",
    campaign: "Easter / Anti-Violence",
    clientId: "chicken-republic",
    clientName: "Chicken Republic",
    category: "Food & beverages",
    year: null,
    liveAt: { date: "2020-04-15" },
    status: "completed",
    leadUserId: null,
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/chicken-republic/easter-chicken-republic.jpg",
    imageAlt: "Easter Chicken Republic campaign artwork",
    media: [
      {
        kind: "image",
        src: "/media/projects/chicken-republic/easter-chicken-republic.jpg",
        alt: "Easter Chicken Republic campaign artwork",
      },
      {
        kind: "image",
        src: "/media/projects/chicken-republic/anti-violence-chicken-republic.jpg",
        alt: "Anti-Violence Chicken Republic campaign artwork",
      },
    ],
    summary: "Source gallery work includes Easter and Anti-Violence campaign artwork for Chicken Republic.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
  {
    slug: "closer-is-better",
    name: "Unilever",
    campaign: "Closer Is Better",
    clientId: "unilever",
    clientName: "Unilever",
    category: "Consumer goods",
    year: 2026,
    liveAt: { date: "2026-02-15" },
    status: "completed",
    leadUserId: "samiat-basorun",
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/media/projects/unilever/closer-is-better.png",
    imageAlt: "Closeup Nigeria Closer Is Better campaign artwork",
    media: [],
    externalLinks: [
      { label: "Website", href: "https://www.unilevernigeria.com/" },
      { label: "Instagram", href: "https://www.instagram.com/unileverwestafrica/" },
      { label: "LinkedIn", href: "https://www.linkedin.com/company/unilever/" },
      { label: "Facebook", href: "https://www.facebook.com/unilever" },
      { label: "X", href: "https://x.com/Unilever" },
    ],
    summary: "Campaign details will be added when the case-study content is supplied.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
];

// Backwards-compatible name for existing campaign pages while the domain
// model is now represented as client-owned projects.
export function getCampaign(slug: string): Campaign | undefined {
  return CAMPAIGNS.find((campaign) => campaign.slug === slug);
}

export function campaignHref(slug: string): string {
  return `/dashboard/campaigns/${slug}`;
}

function liveSortValue(campaign: Campaign): number {
  return campaign.liveAt ? Date.parse(`${campaign.liveAt.date}T00:00:00Z`) : 0;
}

export function sortCampaignsByLatestLive(campaigns: Campaign[]): Campaign[] {
  return [...campaigns].sort((a, b) => {
    const liveStatus = Number(b.status === "live") - Number(a.status === "live");
    if (liveStatus !== 0) return liveStatus;
    return liveSortValue(b) - liveSortValue(a);
  });
}

export function campaignsLiveNow(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter((campaign) => campaign.status === "live");
}

export function campaignsDueFrom(campaigns: Campaign[], from: Date, limit = 3): Campaign[] {
  const fromTime = from.getTime();
  return campaigns
    .filter((campaign) => campaign.liveAt && liveSortValue(campaign) >= fromTime)
    .sort((a, b) => liveSortValue(a) - liveSortValue(b))
    .slice(0, limit);
}

export function campaignsWithTrackedTarget(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter((campaign) => campaign.target.toLowerCase() !== "to be confirmed");
}

export function campaignLiveDateLabel(campaign: Campaign): string {
  if (!campaign.liveAt) return "Date TBC";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${campaign.liveAt.date}T00:00:00Z`));
}
