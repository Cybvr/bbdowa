export type UserType = "team" | "talent";

export type TeamUser = {
  type: "team";
  slug: string;
  name: string;
  title: string;
  department: string;
  /** Public headshot; null/absent falls back to the placeholder avatar. */
  profileImage?: string | null;
};

export type TalentAvailability = "open" | "busy" | "unconfirmed";

export type TalentClearance = "cleared" | "pending";

export type TalentCategory = "Art" | "Writing" | "UX" | "Strategy" | "Film";

export type TalentWorkHistory = {
  role: string;
  company: string;
  period: string;
  location?: string;
};

export type Talent = {
  type: "talent";
  slug: string;
  name: string;
  category: TalentCategory;
  tags: string[];
  location: string;
  entity: "Freelancer" | "Studio";
  /** Working day-rate band used for this directory prototype; confirm before engagement. */
  dayRate: string;
  /** Bottom of the day-rate band, in rateCurrency units. */
  rateMin: number | null;
  rateCurrency: "NGN" | "USD";
  /** Frontend display flag; omitted records default to hiding the rate. */
  hideRate?: boolean;
  /** Payment terms agreed with finance. */
  terms: string;
  availability: TalentAvailability;
  /** Cleared = signed off by MD, finance and creative. */
  clearance: TalentClearance;
  /** Who inside the agency brought them in and vouches for them. */
  vouchedBy: string;
  /** Agency work they have delivered on. Empty = not yet used. */
  workedOn: string[];
  yearsActive: number | null;
  portfolio: string | null;
  behance?: string | null;
  email: string | null;
  phone: string | null;
  /** Public profile image URL sourced from a researched online profile. */
  profileImage?: string | null;
  /** Public work/project image used for the directory feature tile. */
  featuredImage?: string | null;
  /** Public professional history researched from the supplied profile and linked sources. */
  workHistory?: TalentWorkHistory[];
  linkedin?: string | null;
  /** Optional public audience metadata; do not infer age or gender. */
  followerCount?: string | null;
  followerPlatform?: string | null;
  gender?: string | null;
  age?: number | null;
  niche?: string | null;
  lastEngaged?: string | null;
  /** Creative officer's note on the craft. */
  craftNote: string;
};

export type User = TeamUser | Talent;

const TEAM_RECORDS: Omit<TeamUser, "type">[] = [
  {
    slug: "enyi-odigbo",
    name: "Enyi Odigbo",
    title: "Casers Group Chairman",
    department: "Leadership",
    profileImage: "/images/team/enyi-odigbo.png",
  },
  {
    slug: "colin-framer",
    name: "Colin Framer",
    title: "Managing Director",
    department: "Leadership",
  },
  {
    slug: "briand-ngondi",
    name: "Briand Ngondi",
    title: "Interim Group Executive Lead — Nigeria",
    department: "Leadership",
  },
  {
    slug: "samiat-basorun",
    name: "Samiat Basorun",
    title: "Account Manager",
    department: "Client service",
  },
  {
    slug: "jaiprakash-tekwani",
    name: "Jaiprakash Tekwani",
    title: "Strategy, Research & Measurement",
    department: "Strategy & intelligence",
    profileImage: "/images/talent/jai-tekwani-profile.jpeg",
  },
  {
    slug: "jide-pinheiro",
    name: "Jide Pinheiro",
    title: "Chief Creative Officer",
    department: "Creative & culture",
  },
  {
    slug: "stephen-ifebajo",
    name: "Stephen Ifebajo",
    title: "Art Director",
    department: "Creative & culture",
  },
  {
    slug: "lionel-agbakoba",
    name: "Lionel Agbakoba",
    title: "Art Director",
    department: "Creative & culture",
  },
  {
    slug: "esther-felix",
    name: "Esther Felix",
    title: "Copywriter",
    department: "Creative & culture",
  },
  {
    slug: "linda-lysias-pepple",
    name: "Linda Lysias-Pepple",
    title: "Finance Manager",
    department: "Agency operations",
  },
  {
    slug: "tolu-badamassi",
    name: "Tolu Badamassi",
    title: "HR & Admin",
    department: "Agency operations",
  },
];

export const TEAM: TeamUser[] = TEAM_RECORDS.map((member) => ({
  type: "team" as const,
  ...member,
}));

const TALENT_RECORDS: Omit<Talent, "type">[] = [
  {
    slug: "isaac-afeyemi",
    name: "Isaac Fayemi",
    category: "Art",
    tags: ["Brand direction", "Visual systems", "Digital experiences"],
    niche: "Brand direction",
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦18k–₦20k",
    rateMin: 18_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: "https://madebynull.com",
    profileImage:
      "/images/talent/isaac-afeyemi-profile.jpg",
    featuredImage:
      "/images/talent/isaac-afeyemi-featured.jpg",
    email: null,
    phone: null,
    linkedin: "https://www.linkedin.com/in/isaacfayemi/",
    workHistory: [],
    craftNote:
      "Design director at How To Null, with a public practice spanning brand direction and digital visual experimentation.",
  },
  {
    slug: "bori-odekunle",
    name: "Bori Odekunle",
    category: "UX",
    tags: ["Product design", "Marketing design", "Design systems", "Framer"],
    niche: "Product design",
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦12k–₦16k",
    rateMin: 12_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: 3,
    portfolio: "https://boridesigns.me",
    behance: "https://www.behance.net/Bhorie",
    profileImage:
      "/images/talent/bori-odekunle-profile.jpg",
    featuredImage:
      "/images/talent/bori-odekunle-featured.png",
    email: null,
    phone: null,
    linkedin: "https://www.linkedin.com/in/bhorie",
    workHistory: [
      { role: "Founding Product & Marketing Designer", company: "LightWorkAI", period: "Nov 2024–Present" },
      { role: "Lead Designer", company: "Orivfy", period: "Sep 2025" },
      { role: "Product Designer", company: "360 Rides", period: "Jun 2025" },
      { role: "Product Designer", company: "Primedsoft", period: "Aug 2024–Jan 2025" },
      { role: "Product Designer", company: "International Stablecoins", period: "Dec 2023–Mar 2024" },
      { role: "Product Designer", company: "DexP2PXpress", period: "Sep–Oct 2023" },
    ],
    craftNote:
      "Product and marketing designer working across product, marketing, and web, with a focus on simplifying complex systems into clear experiences.",
  },
  {
    slug: "yagazie",
    name: "David Ubakaibeya",
    category: "UX",
    tags: ["Brand design", "Product design", "Web3", "Visual systems"],
    niche: "Brand design",
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦10k–₦14k",
    rateMin: 10_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: "https://yagazie.vercel.app/",
    featuredImage: "/images/talent/david-ubakaibeya-featured.png",
    email: null,
    phone: null,
    linkedin: "https://www.linkedin.com/in/david-ubakaibeya-22229a282/",
    workHistory: [{ role: "Co-founder", company: "Zypp Protocol", period: "Current" }],
    craftNote:
      "Seasoned brand and product designer who describes the practice simply: design and ships. Also listed publicly as co-founder of Zypp Protocol.",
  },
  {
    slug: "obasola-akintola",
    name: "Obasola Akintola",
    category: "Art",
    tags: ["Brand identity", "Art direction", "Design production", "Community building"],
    niche: "Brand identity",
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦16k–₦20k",
    rateMin: 16_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: 6,
    portfolio: null,
    behance: "https://www.behance.net/obasolaboluwaji",
    profileImage:
      "/images/talent/obasola-akintola-profile.jpg",
    featuredImage:
      "/images/talent/obasola-akintola-featured.png",
    email: null,
    phone: null,
    linkedin: "https://ng.linkedin.com/in/obasola-akintola-1370771b4",
    workHistory: [
      { role: "Senior Brand Designer", company: "Chowdeck", period: "Current" },
      { role: "Brand Designer", company: "Cowrywise", period: "2024–2025" },
    ],
    craftNote:
      "Brand designer at Chowdeck with a practice rooted in identity systems, production, and building a stronger design community in Lagos.",
  },
  {
    slug: "peter-olowo",
    name: "Peter Olowo",
    category: "Art",
    tags: ["Brand identity", "Campaign design", "Illustration", "Visual systems"],
    niche: "Brand identity",
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦8k–₦12k",
    rateMin: 8_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: 2,
    portfolio: null,
    profileImage: "/images/talent/peterolowo.png",
    email: null,
    phone: null,
    linkedin: "https://www.linkedin.com/in/peterolowo03",
    workHistory: [
      { role: "Senior Brand Designer", company: "Chowdeck", period: "Jan 2026–Present" },
      { role: "Senior Brand Designer", company: "Cowrywise", period: "Jul–Dec 2025" },
      { role: "Brand Designer", company: "Cowrywise", period: "Nov 2024–Jun 2025" },
      { role: "Brand Designer", company: "Cowrywise", period: "Jan–Oct 2024", location: "Contract" },
    ],
    craftNote:
      "Brand designer working across campaign systems and illustration; public work includes Cowrywise ambassador campaigns and campus-focused visual assets.",
  },
  {
    slug: "linda-ojo-taiwo",
    name: "Linda Ojo Taiwo",
    category: "UX",
    tags: ["Design engineering", "Product design", "Iconography", "Frontend development"],
    niche: "Design engineering",
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦14k–₦18k",
    rateMin: 14_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: 5,
    portfolio: null,
    profileImage: "/images/talent/linda-ojo-taiwo-profile.avif",
    email: null,
    phone: null,
    linkedin: "https://ng.linkedin.com/in/lindaojo",
    workHistory: [
      { role: "Design Engineer", company: "Paystack", period: "Nov 2025–Present" },
      { role: "Senior Product Designer", company: "Exaum", period: "May 2024–Present", location: "Nigeria · Hybrid" },
    ],
    craftNote:
      "Designer, software engineer, and iconographer who works at the intersection of polished interfaces and working frontend systems.",
  },
  {
    slug: "luke-bamtefa",
    name: "Luke Bamtefa",
    category: "Art",
    tags: ["Brand design", "Illustration", "Campaign systems", "Visual storytelling"],
    niche: "Brand design",
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦11k–₦15k",
    rateMin: 11_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: 4,
    portfolio: null,
    behance: "https://www.behance.net/lukebamtefa",
    profileImage:
      "/images/talent/luke-bamtefa-profile.jpg",
    featuredImage:
      "/images/talent/luke-bamtefa-featured.jpg",
    email: null,
    phone: null,
    linkedin: "https://ng.linkedin.com/in/lukebamtefa",
    workHistory: [
      { role: "Brand Designer", company: "Cowrywise", period: "Jan 2026–Present", location: "Hybrid" },
      { role: "Brand Designer", company: "tix.africa", period: "Jun 2025–Jan 2026", location: "Remote" },
      { role: "Visual Designer", company: "The Archers Entertainment", period: "Dec 2023–Jan 2025", location: "Remote" },
    ],
    craftNote:
      "Visual and product designer with a Computer Science background, known for brand systems, illustration, and fast-moving campaign work.",
  },
  {
    slug: "anjolaoluwa-aduroja",
    name: "AnjolaOluwa Aduroja",
    category: "Art",
    tags: ["Brand identity", "Art direction", "3D art", "Visual storytelling"],
    niche: "Brand identity",
    location: "Ibadan",
    entity: "Studio",
    dayRate: "₦15k–₦19k",
    rateMin: 15_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: 7,
    portfolio: "https://www.behance.net/anjoladave",
    profileImage:
      "/images/talent/anjolaoluwa-aduroja-profile.jpg",
    featuredImage:
      "/images/talent/anjolaoluwa-aduroja-featured.png",
    email: null,
    phone: null,
    linkedin: "https://www.linkedin.com/in/anjoladave/",
    workHistory: [
      { role: "Art Director & Brand Designer", company: "Crowther", period: "Jul 2026–Present", location: "Remote" },
      { role: "Director / Lead Graphic Designer", company: "Conceptuniverse Studios", period: "Feb 2019–Present" },
      { role: "Lead Visual Designer", company: "Elle & Elle Fitness", period: "Current", location: "Ibadan" },
    ],
    craftNote:
      "Nigerian 3D artist and designer blending visual art, identity design, and emotional storytelling through colorful, abstract compositions.",
  },
  {
    slug: "damilare-folabi",
    name: "Dámilárẹ Folábí",
    category: "Art",
    tags: ["Brand art direction", "Luxury brand creative", "Textile design", "Visual storytelling"],
    niche: "Brand art direction",
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦13k–₦17k",
    rateMin: 13_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: 9,
    portfolio: null,
    behance: "https://www.behance.net/_damilareee",
    profileImage:
      "/images/talent/damilare-folabi-profile.jpg",
    featuredImage:
      "/images/talent/damilare-folabi-featured.jpg",
    email: null,
    phone: null,
    linkedin: "https://ng.linkedin.com/in/d%C3%A1mil%C3%A1re-fol%C3%A1b%C3%AD-614016207",
    workHistory: [
      { role: "Senior Brand Designer", company: "Salamanca Tequila", period: "Nov 2025–Present", location: "Remote" },
      { role: "Textile Designer", company: "Orange Culture Nigeria", period: "Oct 2022–Dec 2025", location: "Remote" },
      { role: "Design Production Specialist", company: "Orange Culture Nigeria", period: "Earlier role" },
    ],
    craftNote:
      "Brand art director and visual storyteller building premium brands through art, strategy, design, and textile-led expression.",
  },
  {
    slug: "rukhyat-orekoya",
    name: "Rukhyat Orekoya",
    category: "Art",
    tags: ["Illustration", "Brand design", "Character development", "Social campaigns"],
    niche: "Illustration",
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦9k–₦13k",
    rateMin: 9_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: 3,
    portfolio: null,
    behance: "https://www.behance.net/rukhayatorekoya",
    profileImage:
      "/images/talent/rukhayat-orekoya-profile.jpg",
    featuredImage:
      "/images/talent/rukhayat-orekoya-featured.png",
    email: null,
    phone: null,
    linkedin: "https://www.linkedin.com/in/rukhayat-orekoya/",
    workHistory: [
      { role: "Lead Illustrator / Brand Designer", company: "Chowdeck", period: "Aug 2025–Present", location: "Hybrid" },
      { role: "Brand Designer / Illustrator", company: "Partna (YC W22)", period: "Apr 2023–Feb 2025", location: "Remote" },
    ],
    craftNote:
      "Illustrator and brand designer whose work brings personality into social campaigns, identity systems, and launch moments.",
  },
  {
    slug: "joseph-adeyemo",
    name: "Joseph Adeyemo",
    category: "Art",
    tags: ["Logo design", "Visual identity", "Social media design", "Illustration"],
    niche: "Logo design",
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦8k–₦10k",
    rateMin: 8_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "open",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: null,
    behance: "https://www.behance.net/Joeadeyemo",
    profileImage: "/images/talent/joseph-adeyemo-profile.jpg",
    featuredImage:
      "/images/talent/joseph-adeyemo-featured.png",
    email: null,
    phone: null,
    linkedin: null,
    workHistory: [{ role: "Design Ambassador", company: "Cowrywise", period: "2026" }],
    craftNote:
      "Brand designer focused on identities that drive recognition and response, with social design and illustration in the mix.",
  },
  {
    slug: "jeremiah-ajayi",
    name: "Jeremiah Ajayi",
    category: "Writing",
    tags: ["Product marketing", "Content strategy", "GTM messaging", "Sales enablement"],
    niche: "Product marketing",
    location: "Nigeria",
    entity: "Freelancer",
    dayRate: "₦17k–₦20k",
    rateMin: 17_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: 8,
    portfolio: "https://www.thejeremiahajayi.com",
    profileImage: "/images/talent/jeremiah-ajayi-profile.jpg",
    email: null,
    phone: null,
    linkedin: "https://www.linkedin.com/in/jeremiah-ajayi/",
    workHistory: [
      { role: "Co-founder", company: "EmpowerQ", period: "2025–Present" },
      { role: "Content Marketing Manager", company: "RemotePass", period: "c. 2023–2025" },
      { role: "Senior Content Marketer", company: "Stears", period: "c. 2022–2023" },
      { role: "Writer", company: "PiggyVest", period: "Earlier role" },
    ],
    craftNote:
      "B2B product-marketing and content partner helping startups turn launches, repositioning, and expansion into buyer-ready messaging.",
  },
  {
    slug: "king-elisha",
    name: "King Elisha",
    category: "Strategy",
    tags: ["Brand strategy", "Brand design", "Typography", "Visual identity"],
    niche: "Brand strategy",
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦12k–₦15k",
    rateMin: 12_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "open",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: null,
    email: null,
    phone: null,
    linkedin: null,
    workHistory: [{ role: "Brand Designer & Strategist", company: "Cadmon Studio", period: "Current" }],
    craftNote:
      "Brand designer and strategist available for freelance work, with an emphasis on clear typography, strong identity systems, and memorable visual direction.",
  },
  {
    slug: "akinbinu-akintayo",
    name: "Akinbinu Akintayo",
    category: "Art",
    tags: ["Brand design", "Web design", "Visual identity", "Framer"],
    niche: "Brand design",
    location: "Nigeria",
    entity: "Freelancer",
    dayRate: "₦18k–₦20k",
    rateMin: 18_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "open",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: 10,
    portfolio: "https://becoming.supply/",
    behance: "https://www.behance.net/creative47",
    profileImage:
      "/images/talent/akinbinu-akintayo-profile.jpg",
    featuredImage:
      "/images/talent/akinbinu-akintayo-featured.png",
    email: null,
    phone: null,
    linkedin: "https://www.linkedin.com/in/akinbinuakintayo/",
    workHistory: [
      { role: "Web Designer & Framer Developer", company: "Freelance", period: "Aug 2025–Present" },
      { role: "Logo & Brand Identity Designer", company: "Freelance", period: "Feb 2020–Present" },
      { role: "Graphic Designer", company: "Freelance", period: "Oct 2016–Oct 2019" },
    ],
    craftNote:
      "Creative brand and web designer who helps businesses stand out with work that balances efficiency, aesthetics, and functionality.",
  },
  {
    slug: "ella-james",
    name: "Ella James",
    category: "UX",
    tags: ["Brand design", "Product design", "Interaction design", "Website design", "UX mapping"],
    niche: "Brand design",
    location: "Nigeria",
    entity: "Freelancer",
    dayRate: "₦16k–₦20k",
    rateMin: 16_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: "https://ellajames.framer.website/",
    featuredImage:
      "/images/talent/ella-james-featured.png",
    email: "jamesogechi35@gmail.com",
    phone: null,
    linkedin: null,
    workHistory: [
      { role: "Product & Brand Designer", company: "Blocverse", period: "Oct 2023–Present" },
      { role: "Product & Brand Designer", company: "Codetivite", period: "Oct 2023–Present" },
      { role: "Brand Designer", company: "Stramm Design Agency", period: "Sep 2024–May 2025" },
    ],
    craftNote:
      "Brand and product designer working across identity, digital products, interaction design, and clear visual systems.",
  },
  {
    slug: "priscilla-ibiteye",
    name: "Priscilla Ibiteye",
    category: "Writing",
    tags: ["Copywriting", "Content strategy", "Content creation", "Video editing", "Storytelling", "Community management"],
    niche: "Copywriting",
    location: "Lagos, Nigeria",
    entity: "Freelancer",
    dayRate: "₦12k–₦16k",
    rateMin: 12_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "open",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: 2,
    portfolio: null,
    profileImage: "/images/talent/priscilla-ibiteye-profile.jpg",
    featuredImage: null,
    email: null,
    phone: "+234 704 525 6892",
    linkedin: "https://www.linkedin.com/in/yomiko1/",
    workHistory: [
      { role: "Copywriter and Strategist", company: "Disrupt DNA (DDNA)", period: "Mar 2025–Jan 2026" },
      { role: "Writer & Communications Lead", company: "TRON: The Resurgence of Nigerian Art Education", period: "Apr 2026–Present", location: "Ilorin" },
      { role: "Lead Writer & Editor-in-Chief", company: "Lust for Life Magazine", period: "Feb 2025–Present" },
      { role: "Copywriting Consultant", company: "Land Culture, Kwara", period: "Jun 2026–Present", location: "Contract" },
      { role: "Content Writer & Video Editor", company: "Buxies Incorporated, Lagos", period: "Sep 2024–Mar 2025" },
    ],
    craftNote:
      "Copywriter, strategist, and content creator focused on impactful brand messaging, audience growth, storytelling, and community-led communication.",
  },
  {
    slug: "jai-tekwani",
    name: "Jai Tekwani",
    category: "Strategy",
    tags: ["Brand strategy", "Consumer research", "Marketing strategy", "Positioning", "Campaign development"],
    niche: "Brand strategy",
    location: "Remote",
    entity: "Freelancer",
    dayRate: "₦18k–₦20k",
    rateMin: 18_000,
    rateCurrency: "NGN",
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: 14,
    portfolio: "https://www.jaitekwani.com/",
    featuredImage:
      "/images/talent/jai-tekwani-featured.jpg",
    profileImage:
      "/images/talent/jai-tekwani-profile.jpeg",
    email: "jaiprakashtekwani@gmail.com",
    phone: null,
    linkedin: "https://www.linkedin.com/in/jai-tekwani/",
    workHistory: [
      { role: "Global Brand Strategist", company: "DDB Worldwide", period: "Dec 2021–Present" },
      { role: "Brand Strategist", company: "DDB Mudra Group, India", period: "Nov 2020–Nov 2021" },
      { role: "Brand Strategist", company: "DDB Mudra Group, India", period: "Jun 2016–Nov 2020" },
      { role: "Brand Strategist", company: "TBWA\\India", period: "Nov 2014–Jun 2016" },
      { role: "Media Strategist", company: "PHD India", period: "Feb 2014–Nov 2014" },
      { role: "Brand Strategist", company: "JWT India", period: "Apr 2013–Feb 2014" },
      { role: "Copywriter", company: "JWT India", period: "Apr 2012–Apr 2013" },
    ],
    craftNote:
      "Brand strategist translating research, culture, and data into sharper positioning, campaign ideas, and scalable strategic systems.",
  },
  {
    slug: "niyi-fagbemi",
    name: "Niyi Fagbemi",
    category: "Film",
    tags: ["Documentary film", "Travel film", "Cinematography", "Drone cinematography", "Photography", "Visual storytelling"],
    niche: "Documentary film",
    location: "Lagos, Nigeria",
    entity: "Freelancer",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "busy",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: "https://www.youtube.com/@Theniyifagbemi",
    profileImage: "/images/talent/niyi-fagbemi-profile.jpg",
    featuredImage: "/images/talent/niyi-fagbemi-featured.jpg",
    email: "Theniyifagbemi@gmail.com",
    phone: null,
    linkedin: null,
    workHistory: [{ role: "Travel & Documentary Filmmaker", company: "Independent", period: "2020–Present" }],
    craftNote:
      "Travel and documentary filmmaker, photographer, and drone pilot using cinematic visual storytelling to document Nigeria’s culture, landscapes, and people while challenging stereotypes.",
  },
];

export const TALENT: Talent[] = TALENT_RECORDS.map((talent) => ({
  type: "talent" as const,
  ...talent,
}));

export const USERS: User[] = [...TEAM, ...TALENT];

export const TALENT_CATEGORIES = [...new Set(TALENT.map((talent) => talent.category))].sort();

/** Working rate for comparing dollar quotes against naira budgets. Update when the rate moves. */
export const NGN_PER_USD = 1500;

export function rateFloorNgn(talent: Talent): number {
  if (talent.rateMin === null) return Number.POSITIVE_INFINITY;
  return talent.rateCurrency === "USD" ? talent.rateMin * NGN_PER_USD : talent.rateMin;
}

export function baseCity(location: string): string {
  return location.split(" /")[0];
}

export const TALENT_LOCATIONS = [...new Set(TALENT.map((talent) => baseCity(talent.location)))].sort();

export function getTalent(slug: string): Talent | undefined {
  return TALENT.find((talent) => talent.slug === slug);
}

export function talentHref(slug: string): string {
  return `/dashboard/talent/${slug}`;
}

export function getUser(slug: string): User | undefined {
  return USERS.find((user) => user.slug === slug);
}

export function getUserByName(name: string): User | undefined {
  return USERS.find((user) => user.name === name);
}

export function userHref(user: User): string {
  return user.type === "talent" ? talentHref(user.slug) : `/dashboard/people/${user.slug}`;
}

export function userInitials(user: User): string {
  return user.name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
