// Client-facing campaign content for the 1Utility workspace (/dashboard/clients/1utility).
// This is CLIENT data (the brand/campaign we are producing work for).
// It is intentionally separate from user/account data in `lib/users.ts` —
// do not mix the two.

export type ProjectStatus = "live" | "pitch" | "completed";

export type ProjectMedia = {
  kind: "image" | "video";
  src: string;
  alt: string;
  poster?: string;
};

export type ProjectLiveDate = {
  date: string;
};

export type ProjectExternalLink = {
  label: string;
  href: string;
};

export type Project = {
  slug: string;
  name: string;
  campaign?: string;
  client: string;
  category: string;
  year: number | null;
  liveAt?: ProjectLiveDate;
  status: ProjectStatus;
  lead: string;
  fee: string;
  target: string;
  result: string;
  image: string;
  imageAlt: string;
  media: ProjectMedia[];
  externalLinks?: ProjectExternalLink[];
  summary: string;
  challenge: string;
  insight: string;
  strategy: string;
  platform: string[];
  execution: string;
  outcome: string;
  placeholder: boolean;
};

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

export type CampaignListItem = {
  id: string;
  title: string;
  status: "Draft" | "In progress";
};

export type CompetitorItem = {
  brandType: string;
  primaryStrength: string;
  strategicLimitation: string;
};

export const competitiveLandscape: CompetitorItem[] = [
  {
    brandType: "Traditional banks",
    primaryStrength: "Trust, institutional credibility and broad multi-product services",
    strategicLimitation: "Rarely connect everyday bills to financial planning, access or personal progress",
  },
  {
    brandType: "OPay & PalmPay",
    primaryStrength: "Rapid payment scale, transaction speed and extensive agent networks",
    strategicLimitation: "Primarily transactional focus on immediate payments, cashback and airtime discounts",
  },
  {
    brandType: "Moniepoint",
    primaryStrength: "Dominant merchant POS network and SME operational tools",
    strategicLimitation: "Built around merchant settlement; utility management is not the core organising philosophy",
  },
  {
    brandType: "Kuda",
    primaryStrength: "Polished digital-first consumer app experience with no-fee transfers",
    strategicLimitation: "Utility payments remain an isolated utility tab rather than an integrated relationship engine",
  },
  {
    brandType: "Bill-payment aggregators",
    primaryStrength: "Multi-biller convenience and direct utility API integrations",
    strategicLimitation: "Purely transactional utilities without a holistic banking, savings or credit relationship",
  },
];

export const valuePropositionData = {
  coreHeadline: "From Utility Payments to Utility Progress.",
  accountDefinition:
    "A Utility Account is a phone-number-based account that lets customers manage essential payments and access broader banking services through 1U.",
  consumerBenefit:
    "1U gives people more control over what their money needs to handle by bringing basic banking and essential utility management into one connected experience.",
  institutionalAngle:
    "On the institutional side, 1U finances utility providers, infrastructure, renewable energy projects and clean utility assets across Nigeria and West Africa.",
  progressModel: [
    {
      stage: "1. Pay",
      label: "Immediate Essential Need",
      desc: "Instant settlement of everyday utilities (airtime, power, water, data) linked directly to phone number.",
    },
    {
      stage: "2. Plan",
      label: "Predictable Budgeting",
      desc: "Automated recurring schedules, bill protection buffers and smart utility expenditure allocation.",
    },
    {
      stage: "3. Access",
      label: "Attainable Solutions",
      desc: "Unlock clean energy alternatives, backup power finance, and essential service subscriptions.",
    },
    {
      stage: "4. Progress",
      label: "Long-term Stability & Growth",
      desc: "Convert reliable utility habits into creditworthiness, working capital loans, and wealth-building.",
    },
  ],
};



export const defaultPreset: PresetData = {
  client: "1Utilitybank",
  category: "Finance",
  name: "World built around you",
  url: "oneutilitymfb.com",
  scope: "integrated",
  footprint:
    "Nigerians aged 20–55 — students, salary earners, SMEs, traders, gig workers and families who value control over everyday utilities",
  footprintShort: "Nigeria · everyday utility payers, 20–55",
  aesthetic: "trust",
  toneVal: 1,
  toneText: "Clear & useful",
  headline: "ONE BILL. NO LEAP OF FAITH.",
  subtext:
    "OneUtility puts you in control of the essentials that keep life running, giving you peace of mind. Launch by winning one useful moment — a single utility payment — so a new bank earns trust one successful essential at a time.",
  palette: ["#0B3B2E", "#F4C542", "#F8FAFC", "#111827"],
  socialAccount: "1 Utility Bank",
  socialTitle: "One bank for the things that keep life moving.",
  socialBody:
    "Lead with a simple utility use case, then connect it to the wider banking proposition.",
  socialCta: "See what 1U can do",
  contentPillar: "Everyday usefulness",
  contentTitle: "Explain the category through real needs",
  contentBody:
    "Use clear scenarios across bills, saving, loans and business services to make Utility Banking easy to understand.",
  bannerCta: "Explore Utility Banking",
  oohPlacement: "Commuter and business districts",
  oohFormat: "OOH / transit / branch",
  oohSubcopy:
    "A direct proposition that makes the new banking category understandable at a glance.",
  printLead: "Start with the need. Show the useful next step.",
  printBody:
    "The modular system can feature one everyday utility problem per execution while keeping the wider bank promise consistent.",
  activationTitle: "Utility help desk",
  activationBody:
    "A guided sign-up and product-education format for branches, campuses, markets or business communities.",
  experienceTitle: "Make the proposition useful immediately",
  experienceBody:
    "Pair explanation with a verified first action so people understand Utility Banking by doing something valuable.",
  prPitchAngle:
    "How Utility Banking is organising essential payments and financial progress around everyday life.",
};



// The full launch strategy, written as a single markdown document. The Strategy
// tab renders this directly — no per-field inputs.
export const strategyMarkdown = `# One Bill. No Leap of Faith.

OneUtility puts you in control of the essentials that keep life running, giving you peace of mind. We launch by winning one useful moment — a single utility payment — so a new bank earns trust one successful essential at a time.

## Objectives

- Build awareness for OneUtility Bank.
- Drive adoption of Utility Accounts and bill payments via one bank transfer.
- Position 1U as the smarter way to manage everyday money.
- Convert first-time users into loyal customers.

Secondary: build brand affinity and grow share of voice in a saturated market.

## Market context

Nigeria's e-bills market — utility bills, subscriptions, levies and premiums — reached ₦2.8 trillion in 2022, up 22% from ₦2.3 trillion in 2021. Payments already move across bank apps, USSD, aggregators and fintech wallets. Speed and access are now expected, but the essentials stay scattered across single-purpose services.

## Audience

Nigerians aged 20–55 — students, salary earners, SMEs, traders, gig workers and families. From Emeka, a Lagos salary earner, to Funmi, an Ibadan household manager, Musa, a Katsina student and gig worker, and Madam Charity, an Onitsha business owner.

**The insight:** people don't need another place to pay a bill. They need one place that helps them stay on top of what is due, what's paid, what went through and what needs attention next. People want control over the essentials that control their lives.

## The business challenge

1U risks being understood as just another fast payment tool. The shift required is from a payment app to a primary banking relationship — a reliable, full-service digital bank that begins with essential utilities but does not end there.

## Market intelligence & moat

The competitive landscape, and where 1Utility creates an uncontested category.

**Traditional banks** — Strength: trust, institutional credibility and broad multi-product services. Gap: rarely connect everyday bills to financial planning, access or personal progress.

**OPay & PalmPay** — Strength: rapid payment scale, transaction speed and extensive agent networks. Gap: primarily transactional focus on immediate payments, cashback and airtime discounts.

**Moniepoint** — Strength: dominant merchant POS network and SME operational tools. Gap: built around merchant settlement; utility management is not the core organising philosophy.

**Kuda** — Strength: polished digital-first consumer app with no-fee transfers. Gap: utility payments remain an isolated tab rather than an integrated relationship engine.

**Bill-payment aggregators** — Strength: multi-biller convenience and direct utility API integrations. Gap: purely transactional utilities without a holistic banking, savings or credit relationship.

**1Utilitybank — the moat.** The category creator, holding uncontested space: it combines everyday utility payments with predictive financial planning, clean infrastructure financing and capital progression. Rather than treating bills as transactional chores or isolated tab features, 1Utility turns every bill payment into a step toward creditworthiness and tangible growth — a proprietary category engine.

## The opportunity

Become the bank that understands and simplifies people's utility needs. Don't ask people to move their whole financial life on day one — win one useful moment first. One bill is the entry point, control is the benefit, and trust is what we earn.

## Proposition

OneUtility puts you in control of the essentials that keep life running, giving you peace of mind. The emotional benefit is relief — knowing what needed to be handled has been handled. It starts with utility payments and builds toward a fuller financial experience around the individual, their household and their business.

## Brand platform

**One You-niverse** — a financial world built around the individual. Light bill, data, business, savings, family and plans all live in the same world: yours.

- Launch platform: **One Bill. No Leap of Faith.**
- Sustenance platform: **From Due to Done.**

Personality: calm, in control, capable, understood and relieved. Even when life feels financially urgent, 1U feels organised, composed and dependable.

## The trust-to-trial journey

Scepticism → Proof → Trial → Confirmation → Repeat → Relationship. Each stage answers the customer's real question, from "Why should I consider 1U?" to "Can I trust 1U with more?", moving them from watching to a full banking relationship.

## Campaign ideas

- **The First Bill** — follow real people paying one bill to test 1U end to end.
- **Don't Trust Us, Just Try One Transaction** — teasers that acknowledge scepticism.
- **From Due to Done** — a recurring-essentials campaign where red DUE cards flip to blue DONE.
- **Creators as testers** — The First Bill, Try to Break It, Ask the Uncomfortable Questions, Real People Real Proof.

## Execution

Make the movement from uncertainty to control visible. Show proof at every step — exact amount and fee before payment, live status during, instant receipt and reference after, and a clear resolution path when something goes wrong. The launch film "The First Bill" (45s) meets three people at the moment one payment matters; the TVC "What Peace Can Mean" turns red DUE cards into blue DONE cards.

## Channels

- **Reach** — TV, radio, OOH and social introduce the trust problem and the low-risk trial.
- **Proof** — creator tests, product demos, expert explainers and FAQ.
- **Trial** — app store, landing pages, QR, paid social and search drive one utility payment.
- **Confirmation** — receipt, status, push, SMS and support.
- **Sustenance** — reminders, Done Day and CRM.
- **Advocacy** — verified receipts, user stories and referrals.

## Activations

- **1U Works Here** — trained merchants with a visible trust mark, a trackable QR and a branded POS kit.
- **Done Day** — a monthly moment (the 28th, before month-end bills) where 1U picks up one utility bill for users who pay through the app that day.
- **First Bill cohort** — a documented founding group that publishes real trial and support metrics.

## Measurement

The primary KPI is the first successful utility payment, not downloads alone.

- Awareness — aided and unaided, qualified reach, brand search.
- Trust — perceived reliability and safety, clarity of fees and status.
- Trial — downloads, KYC, first-payment success rate, cost per first payment.
- Sustenance — second payment within 30 days, repeat frequency, reminder engagement, referrals.

## The direction

One bill is the entry point. Control is the benefit. Trust is what we earn. We don't pretend 1U has already earned trust — the work shows how it earns it, one successful essential at a time.

**One Bill. No Leap of Faith. From Due to Done. One You-niverse.**
`;

export const campaignPreviewBackground = {
  backgroundImage: "url('/images/one-utility-bank-campaign-preview.png')",
};

export const initialCampaigns: CampaignListItem[] = [
  { id: "utility-bank", title: defaultPreset.name, status: "In progress" },
];

export const phaseContent: Record<PhaseKey, PhaseContent> = {
  tease: {
    socialTitle: "Something useful is coming to your money.",
    socialBody:
      "A new kind of account, built around the bills, plans and payments you already make.",
    socialCta: "Get early access",
    contentPillar: "Everyday usefulness",
    contentTitle: "The bank that starts with your bills",
    contentBody:
      "Three everyday money moments, and how Utility Banking will make each one simpler.",
    bannerCta: "Join the waitlist",
    filmTitle: "Teaser film: the everyday problem",
    filmDesc:
      "A 15-second cut naming one bill-day frustration, ending on a coming-soon card.",
    filmCta: "Get early access",
    audioTitle: "Radio teaser",
    audioDesc:
      "A 20-second spot that poses the everyday money question and promises an answer soon.",
    audioCta: "Get early access",
    oohTitle: "Something useful is coming.",
    oohDesc:
      "Utility Banking arrives soon. Same everyday needs, a clearer way to handle them.",
    oohCta: "Join the waitlist",
    printTitle: "Your bills already run your month.",
    printDesc:
      "A teaser press strip that names one everyday money problem and promises a useful answer at launch.",
    printCta: "Join the waitlist",
    activationTitle: "Waitlist sign-up desk",
    activationBody:
      "A quick branch and campus sign-up that captures interest and previews one useful feature.",
    experienceTitle: "Seed the story before the reveal",
    experienceBody:
      "A small creator group shares one honest everyday money frustration, with no product pitch yet.",
    prPitchAngle:
      "Why a Nigerian bank is rebuilding the account around everyday utility, not products.",
  },
  launch: {
    socialTitle: "One bank for the things that keep life moving.",
    socialBody:
      "Pay bills, save toward plans and access credit in one account built for everyday use.",
    socialCta: "Open a Utility Account",
    contentPillar: "Everyday usefulness",
    contentTitle: "What a Utility Account actually does",
    contentBody:
      "Bills, saving, loans and business tools explained in one clear scroll.",
    bannerCta: "Open your account",
    filmTitle: "Launch film: from payments to progress",
    filmDesc:
      "A 30-second hero film following one utility payment into a wider banking moment.",
    filmCta: "Open a Utility Account",
    audioTitle: "Launch radio spot",
    audioDesc:
      "A 30-second spot explaining the Utility Account through one everyday use case.",
    audioCta: "Open a Utility Account",
    oohTitle: "From utility payments to utility progress.",
    oohDesc: "The account built around everyday life is here.",
    oohCta: "Open your account",
    printTitle: "Start with the need. Take the useful next step.",
    printDesc:
      "The launch spread leads with the headline promise, then shows one everyday utility use case end to end.",
    printCta: "Open your account",
    activationTitle: "Utility help desk",
    activationBody:
      "A guided branch and market sign-up that opens a verified account and shows one payment done live.",
    experienceTitle: "Make the proposition useful on day one",
    experienceBody:
      "Pair the launch message with a first bill paid in-app, so people understand it by doing it.",
    prPitchAngle:
      "How Utility Banking organises essential payments and financial progress around everyday life.",
  },
  experience: {
    socialTitle: "See what people are paying with 1U.",
    socialBody:
      "Real everyday wins, from a lighter bill month to a first savings plan started.",
    socialCta: "Try it yourself",
    contentPillar: "Proof in everyday use",
    contentTitle: "Small money wins, shared",
    contentBody:
      "Short user stories showing one useful action each, from bills to business float.",
    bannerCta: "See it in action",
    filmTitle: "Proof film: everyday wins",
    filmDesc:
      "Short real-customer cuts, each showing one useful action done in the app.",
    filmCta: "Try it yourself",
    audioTitle: "Testimonial radio",
    audioDesc:
      "A 20-second spot built from one real customer's everyday money win.",
    audioCta: "Try it yourself",
    oohTitle: "Everyday money, the useful way.",
    oohDesc: "Thousands are already handling everyday money the useful way.",
    oohCta: "See it in action",
    printTitle: "The proof is in the everyday.",
    printDesc:
      "Feature one real customer moment per execution, with the useful action front and centre.",
    printCta: "See it in action",
    activationTitle: "Utility experience booth",
    activationBody:
      "A hands-on station where visitors complete one real task and leave with the app set up.",
    experienceTitle: "Turn users into the campaign",
    experienceBody:
      "Early customers demo one useful action to friends at markets, campuses and branches.",
    prPitchAngle:
      "Early adoption data on how everyday Nigerians are using Utility Banking in month one.",
  },
  sustain: {
    socialTitle: "Your money, still doing more.",
    socialBody:
      "New plans, business tools and savings goals to keep everyday progress going.",
    socialCta: "Explore what's next",
    contentPillar: "Ongoing progress",
    contentTitle: "Grow from useful to essential",
    contentBody:
      "Deeper features for savers, families and small businesses, one guide at a time.",
    bannerCta: "Do more with 1U",
    filmTitle: "Sustain film: keep going",
    filmDesc:
      "A feature-led film introducing one advanced tool for savers and small businesses.",
    filmCta: "Do more with 1U",
    audioTitle: "Sustain radio",
    audioDesc:
      "A 20-second spot spotlighting one next-step feature for existing customers.",
    audioCta: "Do more with 1U",
    oohTitle: "From everyday payments to lasting progress.",
    oohDesc: "Keep going with 1U.",
    oohCta: "Do more with 1U",
    printTitle: "Useful today. Essential from here.",
    printDesc:
      "Sustain executions introduce one advanced feature at a time to existing customers.",
    printCta: "Do more with 1U",
    activationTitle: "Utility loyalty desk",
    activationBody:
      "A retention touchpoint that reviews a customer's usage and sets up one next useful feature.",
    experienceTitle: "Reward everyday progress",
    experienceBody:
      "Recognise consistent users and invite them to the next campaign moment and referral.",
    prPitchAngle:
      "How Utility Banking is moving from launch to lasting everyday financial habit in Nigeria.",
  },
};
