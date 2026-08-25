export type ProjectStatus = "live" | "pitch" | "completed";

export type ProjectMedia = {
  kind: "image" | "video";
  src: string;
  alt: string;
  poster?: string;
};

export type Project = {
  slug: string;
  name: string;
  client: string;
  category: string;
  year: number | null;
  status: ProjectStatus;
  lead: string;
  image: string;
  imageAlt: string;
  media: ProjectMedia[];
  summary: string;
  challenge: string;
  insight: string;
  strategy: string;
  platform: string[];
  execution: string;
  outcome: string;
  placeholder: boolean;
};

export const PROJECTS: Project[] = [
  {
    slug: "jack-daniels",
    name: "Jack Daniel’s",
    client: "Brown-Forman",
    category: "Food & beverages",
    year: 2024,
    status: "live",
    lead: "Samiat Basorun",
    image: "/images/projects/project-placeholder.svg",
    imageAlt: "",
    media: [],
    summary: "Project details will be added when the case-study content is supplied.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
  {
    slug: "betano",
    name: "Betano",
    client: "Keizen Games",
    category: "Entertainment",
    year: 2026,
    status: "live",
    lead: "Samiat Basorun",
    image: "/images/projects/project-placeholder.svg",
    imageAlt: "",
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
    client: "Proforce Nigeria",
    category: "Defence & manufacturing",
    year: 2026,
    status: "pitch",
    lead: "Samiat Basorun",
    image: "/images/projects/project-placeholder.svg",
    imageAlt: "",
    media: [],
    summary: "Project details will be added when the case-study content is supplied.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
  {
    slug: "1-utility-bank",
    name: "1 Utility Bank",
    client: "1 Utility Bank",
    category: "Finance",
    year: 2026,
    status: "pitch",
    lead: "Samiat Basorun",
    image: "/images/projects/project-placeholder.svg",
    imageAlt: "",
    media: [],
    summary: "Project details will be added when the case-study content is supplied.",
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
    client: "Interswitch",
    category: "Finance",
    year: 2021,
    status: "completed",
    lead: "",
    image: "/images/projects/project-placeholder.svg",
    imageAlt: "",
    media: [],
    summary: "Project details will be added when the case-study content is supplied.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
  {
    slug: "diageo-guinness",
    name: "Guinness",
    client: "Diageo",
    category: "Food & beverages",
    year: 2021,
    status: "completed",
    lead: "",
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
    slug: "visa-work",
    name: "Visa",
    client: "Visa",
    category: "Finance",
    year: 2016,
    status: "completed",
    lead: "",
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
    slug: "google-work",
    name: "Google",
    client: "Google",
    category: "Technology",
    year: null,
    status: "completed",
    lead: "",
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
        src: "/media/projects/google/know-google.mp4",
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
    slug: "orijin",
    name: "Orijin",
    client: "Orijin",
    category: "Food & beverages",
    year: null,
    status: "completed",
    lead: "",
    image: "/media/projects/orijin/live-orijinal-orijin-poster.jpg",
    imageAlt: "Live Orijinal Orijin campaign film still",
    media: [
      {
        kind: "video",
        src: "/upload-latertofirebase/media/projects/orijin/live-orijinal-orijin.mp4",
        poster: "/media/projects/orijin/live-orijinal-orijin-poster.jpg",
        alt: "Live Orijinal Orijin campaign film",
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
    slug: "pringles",
    name: "Pringles",
    client: "Pringles",
    category: "Food & beverages",
    year: null,
    status: "completed",
    lead: "",
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
    slug: "chicken-republic",
    name: "Chicken Republic",
    client: "Chicken Republic",
    category: "Food & beverages",
    year: null,
    status: "completed",
    lead: "",
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
    slug: "unilever",
    name: "Unilever",
    client: "Unilever",
    category: "Consumer goods",
    year: 2026,
    status: "live",
    lead: "Samiat Basorun",
    image: "/images/projects/project-placeholder.svg",
    imageAlt: "",
    media: [],
    summary: "Project details will be added when the case-study content is supplied.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

export function projectHref(slug: string): string {
  return `/projects/${slug}`;
}
