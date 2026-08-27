export type TalentAvailability = "open" | "busy" | "unconfirmed";

export type TalentClearance = "cleared" | "pending";

export type TalentCategory = "Art" | "Copy" | "UX" | "Strategy";

export type TalentWorkHistory = {
  role: string;
  company: string;
  period: string;
  location?: string;
};

export type Talent = {
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
  lastEngaged?: string | null;
  /** Creative officer's note on the craft. */
  craftNote: string;
};

export const TALENT: Talent[] = [
  {
    slug: "isaac-afeyemi",
    name: "Isaac Afeyemi",
    category: "Art",
    tags: ["Brand direction", "Visual systems", "Digital experiences"],
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
      "https://res.cloudinary.com/dmwfd0zhh/image/upload/v1656082679/Group%20256/Info%20Page%20Files/Info_Page_Avatar_ojcvuj.jpg",
    featuredImage:
      "https://res.cloudinary.com/dmwfd0zhh/image/upload/v1656079559/Group%20256/Jelly/Jelly_2_sh7bjf.jpg",
    email: null,
    phone: null,
    linkedin: null,
    workHistory: [],
    craftNote:
      "Design director at How To Null, with a public practice spanning brand direction and digital visual experimentation.",
  },
  {
    slug: "bori-odekunle",
    name: "Bori Odekunle",
    category: "UX",
    tags: ["Product design", "Marketing design", "Design systems", "Framer"],
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
      "https://cdn.dribbble.com/users/11558370/avatars/normal/69d94c498dc437a890f329af57dcb93b.jpg?1702737779",
    featuredImage:
      "https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/508ecb245377627.Y3JvcCwzNjU2LDI4NjAsNzk2LDA.png",
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
    name: "Yagazie",
    category: "UX",
    tags: ["Brand design", "Product design", "Web3", "Visual systems"],
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
    portfolio: "https://yagazie.vercel.app",
    featuredImage: "https://yagazie.vercel.app/images/stackko-1080x1080.png",
    email: null,
    phone: null,
    linkedin: null,
    workHistory: [{ role: "Co-founder", company: "Zypp Protocol", period: "Current" }],
    craftNote:
      "Seasoned brand and product designer who describes the practice simply: design and ships. Also listed publicly as co-founder of Zypp Protocol.",
  },
  {
    slug: "obasola-akintola",
    name: "Obasola Akintola",
    category: "Art",
    tags: ["Brand identity", "Art direction", "Design production", "Community building"],
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
      "https://pps.services.adobe.com/api/profile/E10934F25C96204C0A495FE9@AdobeID/image/04c707be-c941-4252-9f44-ed89ce94ef24/276",
    featuredImage:
      "https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/d669be212224419.Y3JvcCwzMjQwLDI1MzQsMCwxNTI.jpg",
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
    profileImage: "https://media.contra.com/image/upload/h_120,w_120/icybdh6oqog0lpdwpogd.avif",
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
      "https://pps.services.adobe.com/api/profile/CAEDF908590913A80A495D55@AdobeID/image/43b51cc0-25b4-47e9-a572-77d8c8608b1e/230",
    featuredImage:
      "https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/8ffba9166803139.Y3JvcCwxMDA3LDc4OCwzODksMA.jpg",
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
      "https://pps.services.adobe.com/api/profile/B1FA1E4A5C3269E60A495CB3@AdobeID/image/8d0cac34-f448-493a-bb77-b9415f04d1cc/276",
    featuredImage:
      "https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/446432253131701.Y3JvcCwyNDAwLDE4NzcsMCw1NTg.png",
    email: null,
    phone: null,
    linkedin: "https://ng.linkedin.com/in/anjolaoluwa-aduroja-352959208",
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
      "https://pps.services.adobe.com/api/profile/7F7142AD5DB84FB90A495F84@AdobeID/image/bacce8c5-ea7d-4397-8e2d-0a09a8f09b04/230",
    featuredImage:
      "https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/9165a3227209695.683c309c2753e.jpg",
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
      "https://pps.services.adobe.com/api/profile/64F22A395BF987D60A495C7C@AdobeID/image/715d69dd-6f61-4a58-934f-5521f853c374/276",
    featuredImage:
      "https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/913e8a227981935.Y3JvcCwyMDcxLDE2MjAsNDA1LDA.png",
    email: null,
    phone: null,
    linkedin: null,
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
    profileImage:
      "https://pps.services.adobe.com/api/profile/CFE42A62643257490A495F9D@AdobeID/image/649dec9a-bc87-4df7-9322-bdf860495af9/276",
    featuredImage:
      "https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/30ca96245571391.Y3JvcCw5NzcsNzY0LDAsMA.png",
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
    category: "Copy",
    tags: ["Product marketing", "Content strategy", "GTM messaging", "Sales enablement"],
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
    profileImage: "https://static.wixstatic.com/media/256bbf_c6f17e12f6634350aa78e6ec6e158691~mv2.jpg",
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
      "https://pps.services.adobe.com/api/profile/4EFD10BC5D8253DE0A495E39@AdobeID/image/42b6d74f-6d10-4df3-917f-ce14f7eb1c31/276",
    featuredImage:
      "https://mir-s3-cdn-cf.behance.net/projects/max_808/aba92a183149991.Y3JvcCw4MDgsNjMyLDAsMA.png",
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
      "https://framerusercontent.com/images/NsQSsAEKrV8Wgn8FTxhxansFTw.png?width=2448&height=1980",
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
];

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
