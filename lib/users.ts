// Every user is exactly one of these.
export type UserRole = "admin" | "manager" | "creator";

export type CreatorAvailability = "open" | "busy" | "unconfirmed";

export type CreatorClearance = "cleared" | "pending";

export type CreatorCategory = "Art" | "Writing" | "UX" | "Strategy" | "Film" | "Content";

export type CreatorWorkHistory = {
  role: string;
  company: string;
  period: string;
  location?: string;
};

// One flat user shape. Every user has the same fields, and `role` says who they
// are: admin, manager or creator. Fields that don't apply to a given person are
// just empty/null. Records below author only what they need; the rest is filled
// from USER_DEFAULTS.
export type User = {
  slug: string;
  name: string;
  /** admin | manager | creator. */
  role: UserRole;
  /** Job title (agency staff). */
  title: string;
  /** Department (agency staff). */
  department: string;
  category: CreatorCategory;
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
  availability: CreatorAvailability;
  /** Cleared = signed off by MD, finance and creative. */
  clearance: CreatorClearance;
  /** Vetted for inclusion in the creator shortlist. */
  vetted?: boolean;
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
  /** ISO timestamp for when this creator was added to the directory. */
  addedAt?: string | null;
  /** Public work/project image used for the directory feature tile. */
  featuredImage?: string | null;
  /** Public professional history researched from the supplied profile and linked sources. */
  workHistory?: CreatorWorkHistory[];
  linkedin?: string | null;
  instagram?: string | null;
  /** Contact guidance shown when a direct email is unavailable or incomplete. */
  contactNote?: string | null;
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

// Team members and creators are both just users.
export type TeamUser = User;
export type Creator = User;

/** Agency staff = admin or manager (i.e. not a creator). */
export function isTeamUser(user: User): boolean {
  return user.role !== "creator";
}

export function isCreatorUser(user: User): boolean {
  return user.role === "creator";
}

/** A user record as authored below: the essentials plus any subset of fields. */
type UserRecord = Partial<User> & { slug: string; name: string };

/** Fills in every field a record omits, so all users share one shape. */
const USER_DEFAULTS: Omit<User, "slug" | "name"> = {
  role: "creator",
  title: "",
  department: "",
  category: "Content",
  tags: [],
  location: "",
  entity: "Freelancer",
  dayRate: "",
  rateMin: null,
  rateCurrency: "NGN",
  hideRate: true,
  terms: "",
  availability: "unconfirmed",
  clearance: "pending",
  vetted: false,
  vouchedBy: "",
  workedOn: [],
  yearsActive: null,
  portfolio: null,
  behance: null,
  email: null,
  phone: null,
  profileImage: null,
  addedAt: null,
  featuredImage: null,
  workHistory: [],
  linkedin: null,
  instagram: null,
  contactNote: null,
  followerCount: null,
  followerPlatform: null,
  gender: null,
  age: null,
  niche: null,
  lastEngaged: null,
  craftNote: "",
};

const TEAM_RECORDS: UserRecord[] = [
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

export const TEAM: User[] = TEAM_RECORDS.map((member) => ({
  ...USER_DEFAULTS,
  role: "manager",
  ...member,
}));

const CREATOR_RECORDS: UserRecord[] = [
  {
    slug: "tomiwa-jonathan",
    name: "Tomiwa J. Medaiyese",
    gender: "Male",
    category: "Content",
    tags: ["Digital marketing", "Content creation", "Women's agent", "Comedy"],
    niche: "Digital marketing and content creation",
    location: "Lagos, Nigeria",
    entity: "Freelancer",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: null,
    email: "hellotomiwa@gmail.com",
    phone: null,
    featuredImage: "/images/talent/creators/tomiwa-jonathan.jpeg",
    profileImage: "/images/talent/creators/tomiwa-jd.jpg",
    addedAt: "2026-09-18T13:31:00+01:00",
    instagram: "https://instagram.com/tomiwa_jonathan",
    contactNote: "Instagram DM; Women’s Agent: @90smodelsgm…; Family: @altmusic hq",
    followerCount: "19.2K",
    followerPlatform: "Instagram",
    craftNote: "Responsible Baller, digital marketer and content creator building a personable creator presence.",
  },
  {
    slug: "heynikeh",
    name: "Nikeh",
    gender: "Male",
    category: "Content",
    tags: ["Travel", "Inspiration", "Lifestyle"],
    niche: "Travel content",
    location: "Lagos, Nigeria",
    entity: "Freelancer",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: "https://selar.com/m/Heynikehh",
    email: "heynikeh@gmail.com",
    phone: null,
    profileImage: "/images/talent/creators/heynikeh.jpeg",
    addedAt: "2026-09-18T13:33:00+01:00",
    instagram: "https://instagram.com/heynikeh",
    followerCount: "91.5K",
    followerPlatform: "Instagram",
    craftNote: "Travel and lifestyle creator inspiring people to explore God’s green earth.",
  },
  {
    slug: "eroniniofficial",
    name: "Eronini Osinachim",
    gender: "Male",
    category: "Content",
    tags: ["Acting", "Producing", "Influence", "Modelling"],
    niche: "Acting and film production",
    location: "Lagos, Nigeria",
    entity: "Freelancer",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: "https://www.youtube.com/@EroniniTv",
    email: null,
    phone: null,
    featuredImage: "/images/talent/creators/eroniniofficial.jpeg",
    profileImage: "/images/talent/creators/ero.jpg",
    addedAt: "2026-09-18T13:36:00+01:00",
    instagram: "https://instagram.com/eroniniofficial",
    contactNote: "Join Eronini’s online family via YouTube",
    followerCount: "280K",
    followerPlatform: "Instagram",
    craftNote: "Actor, producer, influencer and model with an active online family and film presence.",
  },
  {
    slug: "itstomiwa",
    name: "Tomiwa Talabi",
    gender: "Male",
    category: "Content",
    tags: ["Brand strategy", "Marketing", "Content creation", "Writing"],
    niche: "Brand strategy and marketing",
    location: "Lagos, Nigeria",
    entity: "Freelancer",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: null,
    email: "hellotomiwa@gmail.com",
    phone: null,
    featuredImage: "/images/talent/creators/itstomiwa.jpeg",
    profileImage: "/images/talent/creators/itstomiwa-jd.jpg",
    addedAt: "2026-09-18T13:36:00+01:00",
    instagram: "https://instagram.com/itstomiwa",
    contactNote: "Founder: @Lagoslife; building @Bevarus; writer: @thesocial…",
    followerCount: "29.8K",
    followerPlatform: "Instagram",
    craftNote: "Creator, brand strategist and marketing thinker building brands and writing about culture.",
  },
  {
    slug: "vine-of-lagos",
    name: "Vine Of Lagos",
    gender: "Male",
    category: "Content",
    tags: ["Brand and content lead", "Lifestyle", "Food", "Travel", "Artist"],
    niche: "Lifestyle, food and travel content",
    location: "Lagos, Nigeria",
    entity: "Freelancer",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: "https://cidar.lnk.to/vine.dream",
    email: null,
    phone: null,
    featuredImage: "/images/talent/creators/vine-of-lagos.jpeg",
    profileImage: "/images/talent/creators/vine-playful.jpg",
    addedAt: "2026-09-18T13:37:00+01:00",
    instagram: "https://instagram.com/vine.of.lagos",
    contactNote: "For PR and collaborations, DM",
    followerCount: "7,011",
    followerPlatform: "Instagram",
    craftNote: "Artist and brand/content lead sharing lifestyle, food and travel stories from Lagos.",
  },
  {
    slug: "blvcklanreo",
    name: "OLUYEMI OLANREWAJU",
    gender: "Male",
    category: "Content",
    tags: ["Food", "Lifestyle", "Travel", "Street food", "Multitalented creator"],
    niche: "Food and street flavour content",
    location: "Lagos, Nigeria",
    entity: "Freelancer",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: "https://www.youtube.com/@Blvcklanreo",
    email: null,
    phone: null,
    featuredImage: "/images/talent/creators/blvcklanreo.jpeg",
    profileImage: "/images/talent/creators/blacknero-lifestyle-fun.jpg",
    addedAt: "2026-09-18T13:38:00+01:00",
    instagram: "https://instagram.com/blvcklanreo",
    followerCount: "59.9K",
    followerPlatform: "Instagram",
    craftNote: "Food, lifestyle and travel creator known for street flavour tours and everyday Nigerian food stories.",
  },
  {
    slug: "the-amazingama",
    name: "Ama Udofa",
    gender: "Male",
    category: "Content",
    tags: ["Food", "Wine", "Fragrance", "Travel", "Adventure", "Fashion"],
    niche: "Food and lifestyle storytelling",
    location: "Lagos, Nigeria",
    entity: "Freelancer",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: "https://walkhearton.poweroil.com",
    email: null,
    phone: null,
    featuredImage: "/images/talent/creators/the-amazingama.jpeg",
    profileImage: "/images/talent/creators/amazinggama-food.jpg",
    addedAt: "2026-09-18T13:38:00+01:00",
    instagram: "https://instagram.com/the_amazingama",
    contactNote: "The Amazing Tribe; Ama Udofa on Facebook",
    followerCount: "166K",
    followerPlatform: "Instagram",
    craftNote: "Creator telling stories about food, wine, fragrances, travel, adventure and fashion.",
  },
  {
    slug: "isaac-afeyemi",
    name: "Isaac Fayemi",
    gender: "Male",
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
    gender: "Male",
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
    gender: "Male",
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
    profileImage: "/images/talent/david-ubakaibeya-profile.png",
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
    gender: "Male",
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
    gender: "Male",
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
    gender: "Female",
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
    gender: "Male",
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
    gender: "Male",
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
    gender: "Male",
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
    gender: "Female",
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
    gender: "Male",
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
    gender: "Male",
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
    gender: "Male",
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
    gender: "Male",
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
    gender: "Male",
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
    gender: "Female",
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
    vetted: true,
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
    gender: "Male",
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
    gender: "Male",
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
  {
    slug: "the-house-studios",
    name: "The House Studios",
    gender: "Male",
    category: "Film",
    tags: ["Studio rental", "Podcast production", "Content production", "Livestreaming", "Production support"],
    niche: "Creator-focused production studio",
    location: "Lagos, Nigeria",
    entity: "Studio",
    dayRate: "NGN 800,000-2,200,000 / month",
    rateMin: 800000,
    rateCurrency: "NGN",
    hideRate: false,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: ["Red Bull", "LG", "FBNQuest Trustees", "Sahara Group", "Soundcity"],
    yearsActive: null,
    portfolio: "https://www.thehousestudioshq.com/",
    profileImage: "/images/talent/vendors/the-house-studios.png",
    featuredImage: "/images/talent/vendors/the-house-studios.png",
    email: "thehousestudio@newlabelgroup.com",
    phone: "+234 808 867 7783",
    linkedin: null,
    craftNote:
      "Premium Lagos production space offering podcast, cyclorama, content, photo, livestreaming, and recording studios alongside end-to-end production support.",
  },
  {
    slug: "iszy-media",
    name: "ISZY Media",
    gender: "Male",
    category: "Film",
    tags: ["Video production", "Photography", "Audio production", "Commercials", "Documentaries"],
    niche: "Agency-ready creative production",
    location: "Lagos, Nigeria",
    entity: "Studio",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: ["Hollandia", "Sensodyne", "Knorr", "MTN Nigeria", "Toyota", "Budweiser NG"],
    yearsActive: null,
    portfolio: "https://iszymedia.com/",
    profileImage: "/images/talent/vendors/iszy-media.png",
    featuredImage: "/images/talent/vendors/iszy-media.png",
    email: "hello@iszymedia.com",
    phone: "+234 803 937 6954",
    linkedin: null,
    craftNote:
      "Lagos creative production company led by Israel Ajayi, providing film, photography, and audio production for agencies and brands.",
  },
  {
    slug: "adeola-fadola",
    name: "Adeola Fadola",
    gender: "Male",
    category: "Film",
    tags: ["Film direction", "Creative direction", "Fashion film", "Brand film", "Narrative storytelling"],
    niche: "Culture-led film direction",
    location: "Africa / Europe",
    entity: "Freelancer",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: ["Colgate", "Showmax", "YouTube x MTN", "Bamboo x Puma", "Johnnie Walker", "Ciroc"],
    yearsActive: null,
    portfolio: "https://adeolafadola.com/",
    profileImage: "/images/talent/vendors/adeola-fadola.png",
    featuredImage: "/images/talent/vendors/adeola-fadola.png",
    email: null,
    phone: null,
    linkedin: "https://www.linkedin.com/in/adeolafadola/",
    craftNote:
      "Award-winning experimental director working across fashion, film, media, and advertising with a culturally nuanced African and global lens.",
  },
  {
    slug: "loup-garou-films",
    name: "Loup Garou Films",
    gender: "Male",
    category: "Film",
    tags: ["Music videos", "Documentary", "Narrative film", "Production", "Culture"],
    niche: "Music and culture-led production",
    location: "Lagos, Nigeria / Global",
    entity: "Studio",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: ["Spotify", "YBNL", "Rema", "Ayra Starr", "Ladipoe", "Johnny Drille"],
    yearsActive: null,
    portfolio: "https://loupgaroufilms.com/",
    profileImage: "/images/talent/vendors/loup-garou-films.jpg",
    featuredImage: "/images/talent/vendors/loup-garou-films.jpg",
    email: null,
    phone: null,
    linkedin: null,
    craftNote:
      "Lagos media production house co-founded by Kewa Oni and Seun Opabisi, known for Afrobeats visuals, Spotify mini-documentaries, and narrative film.",
  },
  {
    slug: "tmofilms",
    name: "TMO Films",
    gender: "Male",
    category: "Film",
    tags: ["Commercials", "Corporate films", "Documentary", "Event coverage", "Drone production"],
    niche: "Brand-led video production",
    location: "Lagos, Nigeria",
    entity: "Studio",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: ["British American Tobacco", "CNN", "National Geographic Wild", "Huggies", "Plutofi"],
    yearsActive: 10,
    portfolio: null,
    profileImage: null,
    featuredImage: null,
    email: "tmofilmsng@gmail.com",
    phone: "+234 810 668 7917",
    linkedin: null,
    craftNote:
      "Lagos video production house delivering corporate films, commercials, documentaries, event coverage, photography, drone services, and livestreaming.",
  },
  {
    slug: "ibst-media",
    name: "IBST Media",
    gender: "Male",
    category: "Film",
    tags: ["Live events", "Sports broadcast", "Remote production", "Digital media", "AI media"],
    niche: "Broadcast-grade production",
    location: "Lagos, Nigeria / Pan-Africa",
    entity: "Studio",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: ["Mastercard Foundation", "Stanbic", "MTN", "LaLiga x EA Sports", "UFC Nigeria"],
    yearsActive: 20,
    portfolio: "https://ibstmedia.com/",
    profileImage: "/images/talent/vendors/ibst-media.jpg",
    featuredImage: "/images/talent/vendors/ibst-media.jpg",
    email: "info@ibstmedia.com",
    phone: "+234 803 438 7293",
    linkedin: null,
    craftNote:
      "Pan-African media production company providing live event production, sports broadcast, remote production, and digital media services.",
  },
  {
    slug: "film-factory",
    name: "Film Factory",
    gender: "Male",
    category: "Film",
    tags: ["TV commercials", "Documentary", "Media buying", "Digital marketing", "Photography"],
    niche: "Integrated production and media marketing",
    location: "Lagos, Nigeria / West Africa",
    entity: "Studio",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: ["Arik Air", "Martini"],
    yearsActive: 14,
    portfolio: "https://filmfactoryng.com/",
    profileImage: "/images/talent/vendors/film-factory.jpg",
    featuredImage: "/images/talent/vendors/film-factory.jpg",
    email: "info@filmfactoryng.com",
    phone: "+234 810 005 6669",
    linkedin: null,
    craftNote:
      "Lagos integrated content creation, media marketing, and communications firm producing commercials, documentaries, and digital campaigns across West Africa.",
  },
  {
    slug: "the-jovial-studios",
    name: "The Jovial Studios",
    gender: null,
    category: "Film",
    tags: ["Commercial production", "Lifestyle production", "Photography", "Content creation", "Campaign production"],
    niche: "Commercial and lifestyle production",
    location: "Lagos, Nigeria",
    entity: "Studio",
    dayRate: "To confirm",
    rateMin: null,
    rateCurrency: "NGN",
    hideRate: true,
    terms: "To confirm",
    availability: "unconfirmed",
    clearance: "pending",
    vouchedBy: "Not yet vouched",
    workedOn: [],
    yearsActive: null,
    portfolio: "https://www.instagram.com/thejovialstudios_/",
    profileImage: null,
    featuredImage: null,
    email: null,
    phone: null,
    linkedin: null,
    instagram: "https://www.instagram.com/thejovialstudios_/",
    addedAt: "2026-09-18T15:00:00+01:00",
    contactNote: "Instagram: @thejovialstudios_",
    followerCount: "202",
    followerPlatform: "Instagram",
    craftNote:
      "Commercial and lifestyle production house in Lagos creating premium visuals for brands across campaigns, content, and photography.",
  },
];

export const CREATORS: User[] = CREATOR_RECORDS.map((creator) => ({
  ...USER_DEFAULTS,
  role: "creator",
  ...creator,
}));

// The single users collection: agency staff and creators together.
export const USERS: User[] = [...TEAM, ...CREATORS];

export const CREATOR_CATEGORIES = [...new Set(CREATORS.map((creator) => creator.category))].sort();

/** Working rate for comparing dollar quotes against naira budgets. Update when the rate moves. */
export const NGN_PER_USD = 1500;

export function rateFloorNgn(creator: Creator): number {
  if (creator.rateMin === null) return Number.POSITIVE_INFINITY;
  return creator.rateCurrency === "USD" ? creator.rateMin * NGN_PER_USD : creator.rateMin;
}

export function baseCity(location: string): string {
  return location.split(" /")[0];
}

export const CREATOR_LOCATIONS = [...new Set(CREATORS.map((creator) => baseCity(creator.location)))].sort();

export const CREATOR_NEW_WINDOW_DAYS = 30;

export function creatorAddedTimestamp(creator: Creator): number {
  return creator.addedAt ? Date.parse(creator.addedAt) : 0;
}

export function isCreatorNew(creator: Creator, now = Date.now()): boolean {
  const added = creatorAddedTimestamp(creator);
  if (!added) return false;
  const age = now - added;
  return age >= 0 && age <= CREATOR_NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function getCreator(slug: string): Creator | undefined {
  return CREATORS.find((creator) => creator.slug === slug);
}

export function creatorHref(slug: string): string {
  return `/dashboard/creators/${slug}`;
}

export function getUser(slug: string): User | undefined {
  return USERS.find((user) => user.slug === slug);
}

export function getUserByName(name: string): User | undefined {
  return USERS.find((user) => user.name === name);
}

export function userHref(user: User): string {
  return user.role === "creator"
    ? `/dashboard/creators/${user.slug}`
    : `/dashboard/people/${user.slug}`;
}

export function userInitials(user: User): string {
  return user.name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
