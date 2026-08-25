export type ProjectStatus = "live" | "pitch" | "completed";

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
    image: "/images/projects/project-placeholder.svg",
    imageAlt: "",
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
    slug: "unilever",
    name: "Unilever",
    client: "Unilever",
    category: "Consumer goods",
    year: 2026,
    status: "live",
    lead: "Samiat Basorun",
    image: "/images/projects/project-placeholder.svg",
    imageAlt: "",
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
