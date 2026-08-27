export type PodAvailability = "open" | "on a job" | "unconfirmed";

export type PodClearance = "cleared" | "pending";

export type PodTalent = {
  slug: string;
  name: string;
  discipline: string;
  specialties: string[];
  location: string;
  entity: "Freelancer" | "Studio";
  /** Day-rate band, agreed or quoted. */
  dayRate: string;
  /** Payment terms agreed with finance. */
  terms: string;
  availability: PodAvailability;
  /** Cleared = signed off by MD, finance and creative. */
  clearance: PodClearance;
  /** Who inside the agency brought them in and vouches for them. */
  vouchedBy: string;
  /** Agency work they have delivered on. Empty = not yet used. */
  workedOn: string[];
  yearsActive: number;
  portfolio: string;
  email: string;
  phone: string;
  lastEngaged: string | null;
  /** Creative officer's note on the craft. */
  craftNote: string;
};

export const POD: PodTalent[] = [
  {
    slug: "tunde-akerele",
    name: "Tunde Akerele",
    discipline: "Direction",
    specialties: ["TVC", "Music video", "Performance direction"],
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦900k–₦1.4m",
    terms: "60% on award, balance on picture lock",
    availability: "on a job",
    clearance: "cleared",
    vouchedBy: "Jide Pinheiro",
    workedOn: ["Jack Daniel’s", "Betano"],
    yearsActive: 12,
    portfolio: "https://vimeo.com/tundeakerele",
    email: "tunde@akerele.film",
    phone: "+234 803 111 2201",
    lastEngaged: "2026-06-12",
    craftNote:
      "Strongest performance director on the bench. Gets truthful acting out of non-actors. Book early — his diary fills two months out.",
  },
  {
    slug: "amara-nwachukwu",
    name: "Amara Nwachukwu",
    discipline: "Motion",
    specialties: ["2D animation", "Kinetic type", "Social cutdowns"],
    location: "Enugu / remote",
    entity: "Freelancer",
    dayRate: "₦180k–₦250k",
    terms: "50% upfront, balance on delivery",
    availability: "open",
    clearance: "cleared",
    vouchedBy: "Stephen Ifebajo",
    workedOn: ["Betano", "1 Utility Bank"],
    yearsActive: 6,
    portfolio: "https://behance.net/amaranwa",
    email: "amara.nwa@gmail.com",
    phone: "+234 812 400 7734",
    lastEngaged: "2026-07-30",
    craftNote:
      "Fast and clean. Turned 14 Betano cutdowns in four days without a single revision round. First call for social motion.",
  },
  {
    slug: "kojo-asante",
    name: "Kojo Asante",
    discipline: "Photography",
    specialties: ["Portrait", "Food & product", "Campaign stills"],
    location: "Accra",
    entity: "Freelancer",
    dayRate: "$450–$700",
    terms: "Full payment on delivery, net 14",
    availability: "open",
    clearance: "cleared",
    vouchedBy: "Emeka Otoba",
    workedOn: ["Jack Daniel’s"],
    yearsActive: 9,
    portfolio: "https://kojoasante.com",
    email: "studio@kojoasante.com",
    phone: "+233 24 555 8190",
    lastEngaged: "2026-04-18",
    craftNote:
      "Shot the Jack Daniel’s hero stills. Beautiful, controlled light. Travels with own kit — no rental line needed.",
  },
  {
    slug: "yewande-balogun",
    name: "Yewande Balogun",
    discipline: "Copy",
    specialties: ["Long-form", "Brand voice", "Pidgin & Yoruba adaptation"],
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦120k–₦160k",
    terms: "Full payment on delivery, net 7",
    availability: "open",
    clearance: "cleared",
    vouchedBy: "Esther Felix",
    workedOn: ["1 Utility Bank"],
    yearsActive: 7,
    portfolio: "https://yewande.substack.com",
    email: "yewandewrites@gmail.com",
    phone: "+234 705 331 9042",
    lastEngaged: "2026-08-02",
    craftNote:
      "The best Pidgin adaptation writer we have found. Keeps the idea intact instead of translating word for word.",
  },
  {
    slug: "seyi-adeoti",
    name: "Seyi Adeoti",
    discipline: "Edit",
    specialties: ["Offline edit", "Trailer cuts", "Colour-managed delivery"],
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦220k–₦300k",
    terms: "50% upfront, balance on final export",
    availability: "unconfirmed",
    clearance: "cleared",
    vouchedBy: "Jide Pinheiro",
    workedOn: ["Betano", "Proforce"],
    yearsActive: 10,
    portfolio: "https://vimeo.com/seyiadeoti",
    email: "seyi@cutroom.ng",
    phone: "+234 809 224 6617",
    lastEngaged: "2026-05-25",
    craftNote:
      "Rhythm editor — finds the cut in the music. Slow to reply on WhatsApp; call him instead.",
  },
  {
    slug: "farida-mohammed",
    name: "Farida Mohammed",
    discipline: "Illustration",
    specialties: ["Editorial illustration", "Character design", "Mural scale-up"],
    location: "Abuja / remote",
    entity: "Freelancer",
    dayRate: "₦150k–₦200k",
    terms: "50% upfront, balance on delivery",
    availability: "open",
    clearance: "pending",
    vouchedBy: "Nonso Malogo",
    workedOn: [],
    yearsActive: 5,
    portfolio: "https://behance.net/faridadraws",
    email: "farida.draws@gmail.com",
    phone: "+234 813 902 5568",
    lastEngaged: null,
    craftNote:
      "Distinct hand — northern Nigerian visual language nobody else on the bench has. Not yet used; start her on something small.",
  },
  {
    slug: "obi-eze-sound",
    name: "Obi Eze",
    discipline: "Sound",
    specialties: ["Original score", "Sound design", "Final mix"],
    location: "Lagos",
    entity: "Studio",
    dayRate: "₦350k–₦500k",
    terms: "Studio invoice, net 30",
    availability: "on a job",
    clearance: "cleared",
    vouchedBy: "Emeka Otoba",
    workedOn: ["Jack Daniel’s", "Betano", "1 Utility Bank"],
    yearsActive: 14,
    portfolio: "https://ezesound.com",
    email: "bookings@ezesound.com",
    phone: "+234 802 776 3345",
    lastEngaged: "2026-08-14",
    craftNote:
      "Our most-used external partner. Owns a treated room in Ikoyi, mixes to broadcast spec. Rates are firm — do not negotiate.",
  },
  {
    slug: "nana-adjoa-quartey",
    name: "Nana Adjoa Quartey",
    discipline: "3D",
    specialties: ["Product renders", "CGI environments", "Packshots"],
    location: "Accra / remote",
    entity: "Freelancer",
    dayRate: "$400–$550",
    terms: "50% upfront, balance on delivery",
    availability: "open",
    clearance: "pending",
    vouchedBy: "Stephen Ifebajo",
    workedOn: [],
    yearsActive: 4,
    portfolio: "https://artstation.com/nanaadjoa",
    email: "nanaadjoa3d@gmail.com",
    phone: "+233 20 118 6720",
    lastEngaged: null,
    craftNote:
      "Photoreal bottle and can renders that would replace a product shoot day. Awaiting finance sign-off on the dollar rate.",
  },
  {
    slug: "chidi-okafor",
    name: "Chidi Okafor",
    discipline: "Design",
    specialties: ["Brand identity", "Key visual systems", "Print production art"],
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦160k–₦220k",
    terms: "Full payment on delivery, net 14",
    availability: "open",
    clearance: "cleared",
    vouchedBy: "Lionel Agbakoba",
    workedOn: ["Proforce"],
    yearsActive: 8,
    portfolio: "https://chidiokafor.design",
    email: "hello@chidiokafor.design",
    phone: "+234 810 445 2280",
    lastEngaged: "2026-03-09",
    craftNote:
      "Safe pair of hands for production art and adaptation. Give him a locked key visual, not a blank page.",
  },
  {
    slug: "temi-oyelaran",
    name: "Temi Oyelaran",
    discipline: "Motion",
    specialties: ["3D motion", "Title sequences", "Broadcast packaging"],
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦280k–₦380k",
    terms: "50% upfront, balance on delivery",
    availability: "unconfirmed",
    clearance: "cleared",
    vouchedBy: "Jide Pinheiro",
    workedOn: ["Betano"],
    yearsActive: 9,
    portfolio: "https://temioyelaran.tv",
    email: "temi@oyelaran.tv",
    phone: "+234 806 990 1123",
    lastEngaged: "2026-01-22",
    craftNote:
      "Premium 3D motion — the Betano launch idents were his. Expensive but the finish justifies it on hero work.",
  },
  {
    slug: "adaeze-umeh",
    name: "Adaeze Umeh",
    discipline: "Production",
    specialties: ["Line production", "Location & permits", "Budget management"],
    location: "Lagos",
    entity: "Freelancer",
    dayRate: "₦200k–₦260k",
    terms: "Weekly invoicing during production",
    availability: "open",
    clearance: "cleared",
    vouchedBy: "Samiat Basorun",
    workedOn: ["Jack Daniel’s", "Proforce"],
    yearsActive: 11,
    portfolio: "https://linkedin.com/in/adaezeumeh",
    email: "adaeze.produces@gmail.com",
    phone: "+234 803 667 4419",
    lastEngaged: "2026-06-12",
    craftNote:
      "Ran the Jack Daniel’s shoot under budget. Knows every location fixer in Lagos. Hire her before you hire the director.",
  },
  {
    slug: "kwame-boateng",
    name: "Kwame Boateng",
    discipline: "Copy",
    specialties: ["Scriptwriting", "Radio", "Twi & Ga adaptation"],
    location: "Accra / remote",
    entity: "Freelancer",
    dayRate: "$250–$350",
    terms: "Full payment on delivery, net 14",
    availability: "open",
    clearance: "pending",
    vouchedBy: "Esther Felix",
    workedOn: [],
    yearsActive: 6,
    portfolio: "https://kwamewrites.com",
    email: "kwame@kwamewrites.com",
    phone: "+233 24 890 3356",
    lastEngaged: null,
    craftNote:
      "Covers the Ghana-market language gap when Betano briefs land. Untested on our work — pair him with Esther first time out.",
  },
];

export const POD_DISCIPLINES = [...new Set(POD.map((talent) => talent.discipline))].sort();

export function getTalent(slug: string): PodTalent | undefined {
  return POD.find((talent) => talent.slug === slug);
}

export function podHref(slug: string): string {
  return `/dashboard/pod/${slug}`;
}
