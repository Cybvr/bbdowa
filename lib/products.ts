export type ProductStatus = "active" | "idea";

export type ProductOwner = {
  name: string;
  role: string;
  avatar: string;
};

export type Product = {
  slug: string;
  name: string;
  avatar: string;
  status: ProductStatus;
  owner: ProductOwner | null;
  users: string[];
  description: string;
  objective: string;
  goals: string[];
  kpis: string[];
  roadmap: string[];
  reviewCadence: string;
  created: string | null;
  targetDate?: string | null;
};

export const PRODUCTS: Product[] = [
  {
    slug: "industry-labs",
    name: "Industry Labs",
    avatar: "/images/products/industry-labs.png",
    status: "active",
    owner: {
      name: "Stephen Ifebajo",
      role: "Product Owner",
      avatar: "SI",
    },
    users: ["Everyone"],
    description:
      "Bi-weekly conversations into a long-term competitive edge. Every two weeks, a scheduled presenter explores an industry from the idea bank. Style is the presenter’s choice—deck, document, video or talk track—and every presentation becomes an agency asset.",
    objective:
      "Build a diverse, reusable bank of industry intelligence so future briefs never start from zero and strong insights can become proactive pitches, showcase projects or agency-owned IP.",
    goals: [
      "Build cumulative research across the 40-industry idea bank",
      "Archive every presentation against its industry for future briefs",
      "Turn strong insights into proactive pitches, showcase projects or internal IP",
      "Sharpen category thinking across the entire agency",
    ],
    kpis: [
      "Bi-weekly sessions delivered against the published rotation",
      "Presentations archived and tagged to the correct industry",
      "Coverage across the 40-industry idea bank",
      "Actionable opportunities advanced to pitch, showcase or IP development",
    ],
    roadmap: [
      "Publish the presenter rotation two weeks ahead",
      "Research Nigerian, regional and global category players",
      "Run the bi-weekly conversation and decide what is actionable in the room",
      "Archive every deck and rally the agency around the strongest opportunities",
    ],
    reviewCadence: "Bi-weekly",
    created: "2026-08-22",
  },
  {
    slug: "pitch-os",
    name: "PitchOS",
    avatar: "/images/products/pitch-os.png",
    status: "idea",
    owner: null,
    users: ["New Business", "Strategy", "Creative", "Client Service"],
    description:
      "A single home for pitch workflows, credentials, research, templates and reusable presentation material.",
    objective: "Help teams prepare stronger pitches with less duplicated effort.",
    goals: ["Shorten pitch setup time", "Improve consistency", "Reuse proven agency knowledge"],
    kpis: ["Pitch adoption", "Setup time saved", "Asset reuse", "Team usefulness rating"],
    roadmap: ["Define minimum content", "Connect the pitch workflow", "Add credentials and case studies"],
    reviewCadence: "Quarterly",
    created: null,
    targetDate: "2026-10-01",
  },
  {
    slug: "talent-cloud",
    name: "Talent Cloud",
    avatar: "/images/products/talent-cloud.png",
    status: "idea",
    owner: null,
    users: ["Creative", "Production", "HR & Admin"],
    description:
      "A searchable directory of employees, freelancers, creators, directors and specialist partners.",
    objective: "Make the right internal and external talent easier to find and engage.",
    goals: ["Reduce sourcing time", "Improve talent visibility", "Maintain a trusted specialist network"],
    kpis: ["Successful matches", "Time to shortlist", "Profile freshness", "Repeat engagements"],
    roadmap: ["Standardise profiles", "Import current shortlists", "Add availability and work samples"],
    reviewCadence: "Monthly",
    created: null,
    targetDate: "2026-11-19",
  },
  {
    slug: "production-network",
    name: "Production Network",
    avatar: "/images/products/production-network.png",
    status: "idea",
    owner: null,
    users: ["Production", "Creative", "Client Service", "Finance"],
    description:
      "A managed directory of production companies, vendors, capabilities, costs and performance history.",
    objective: "Improve production sourcing, comparison and decision-making.",
    goals: ["Speed up vendor selection", "Improve cost visibility", "Retain supplier learning"],
    kpis: ["Sourcing time", "Vendor coverage", "Rate-card freshness", "Supplier performance rating"],
    roadmap: ["Import the production shortlist", "Add rate cards", "Create post-project reviews"],
    reviewCadence: "Monthly",
    created: null,
    targetDate: "2027-01-07",
  },
  {
    slug: "brand-brain",
    name: "Brand Brain",
    avatar: "/images/products/brand-brain.png",
    status: "idea",
    owner: null,
    users: ["Everyone"],
    description:
      "The trusted source for BBDO templates, standards, case studies, showreels and approved assets.",
    objective: "Make approved brand knowledge and materials easy to find and reuse.",
    goals: ["Increase asset reuse", "Improve brand consistency", "Reduce time spent searching"],
    kpis: ["Active users", "Successful searches", "Asset reuse", "Outdated assets removed"],
    roadmap: ["Audit existing assets", "Create a simple taxonomy", "Assign content owners"],
    reviewCadence: "Quarterly",
    created: null,
    targetDate: "2027-02-25",
  },
  {
    slug: "client-pulse",
    name: "Client Pulse",
    avatar: "/images/products/client-pulse.png",
    status: "idea",
    owner: null,
    users: ["Leadership", "Client Service", "New Business"],
    description:
      "A current view of clients, pitches, opportunities, account health, risks and next actions.",
    objective: "Give agency leadership a shared picture of commercial relationships and opportunities.",
    goals: ["Surface risks earlier", "Clarify ownership", "Improve opportunity follow-through"],
    kpis: ["Account coverage", "Action completion", "Risk response time", "Opportunity progression"],
    roadmap: ["Define account-health signals", "Connect current client data", "Add review cadence"],
    reviewCadence: "Monthly",
    created: null,
    targetDate: "2027-04-15",
  },
  {
    slug: "campaign-library",
    name: "Campaign Library",
    avatar: "/images/products/campaign-library.png",
    status: "idea",
    owner: null,
    users: ["Creative", "Strategy", "Client Service", "New Business"],
    description:
      "A searchable archive of completed work, results, learnings and reusable campaign assets.",
    objective: "Turn completed work into reusable institutional knowledge.",
    goals: ["Preserve campaign learning", "Strengthen case studies", "Increase reuse of proven material"],
    kpis: ["Campaigns documented", "Result coverage", "Search success", "Reuse in new work"],
    roadmap: ["Define the campaign record", "Import priority work", "Add results and learning fields"],
    reviewCadence: "Quarterly",
    created: null,
    targetDate: "2027-06-03",
  },
  {
    slug: "culture-radar",
    name: "Culture Radar",
    avatar: "/images/products/culture-radar.png",
    status: "idea",
    owner: null,
    users: ["Strategy", "Creative", "Social"],
    description:
      "A living view of cultural movements, audience behaviours, platform shifts and emerging opportunities.",
    objective: "Help teams spot and apply relevant cultural signals earlier.",
    goals: ["Improve cultural relevance", "Support faster ideation", "Create a shared signal library"],
    kpis: ["Signals published", "Signals used in briefs", "Contributor participation", "Usefulness rating"],
    roadmap: ["Define signal format", "Recruit contributors", "Start a weekly publishing rhythm"],
    reviewCadence: "Monthly",
    created: null,
    targetDate: "2027-07-22",
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((product) => product.slug === slug);
}

export function productHref(slug: string): string {
  return `/dashboard/products/${slug}`;
}

export function productDate(product: Product): string | null {
  return product.created ?? product.targetDate ?? null;
}
