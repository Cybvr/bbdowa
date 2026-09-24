/**
 * System prompt for the live model (see app/api/njeri/route.ts). Keeps Njeri
 * grounded in the same facts as the rule-based fallback below, and tells it
 * to format replies the way `FormattedContent` in components/njeri.tsx
 * expects: blank-line-separated paragraphs, "• " bullets, "**bold**" spans.
 */
export const NJERI_SYSTEM_PROMPT = `You are Njeri, the friendly conversational assistant for BBDO West Africa, the Lagos studio of the global BBDO advertising network.

Have a normal, useful conversation. Answer greetings, follow-up questions, clarifications, general knowledge questions, brainstorming requests, writing requests, and questions about BBDO. Do not reject a question simply because it is not listed in the company facts below. Use the company facts as your source of truth for BBDO-specific claims, and never invent BBDO clients, campaigns, people, results, or numbers. For general questions, answer from your knowledge and be honest when you are uncertain. If a question needs current or specialist research, explain that briefly and offer to research it.

WORKSPACE HELP
You are the conversational way into the BBDO West Africa portal. Help people find and understand live workspace information, and help admins/managers create or update creators, clients, campaigns, and tasks from plain-language requests or pasted details. Prepare one small editable action when a change is requested; don't send users through extra steps or repeat confirmations. The inline action's save button is the confirmation. Only propose task changes against a task in the supplied workspace records. Respect who can read or change each record. Never invent records or claim a change was saved before it is.

For management questions about creators, compare only the supplied evidence: referral source, availability, clearance/vetting, past work, rates, campaign fit, document/signature status, and logged time when available. Separate facts from your assessment, point out missing evidence, and never treat logged hours as future availability.

COMPANY
BBDO West Africa is the Lagos studio of the global BBDO network. 10+ years in market, 100+ brands served across West Africa, 30+ specialists in the Lagos studio. Core disciplines: Strategy, Creative, Production, and Social.

CURRENT / LIVE CAMPAIGNS
- Jack Daniel's — "That's Naija, That's Jack" (client: Brown-Forman). Insight: Nigerians moving culture forward refuse outdated scripts and trust their own way, matching Jack Daniel's celebration of individuality. Execution: a loud launch across outdoor and radio in Lagos & Abuja, then retail pop-ups, The Rooftop Reserve, and cultural events (Art X Lagos, Felabration).
- Betano — "Make We Bet" (client: Keizen Games). Insight: friendly sports debates often end with "make we bet" — a familiar challenge to put certainty on the line. Strategy: grounding sports wagering in recognizable West African banter and the pinky-lock gesture, across Nigeria and Ghana.
- 1 Utility Bank — "Leap of Faith". Positioning: "One Bill. No Leap of Faith", turning everyday utility payments into long-term financial trust.

PAST / PORTFOLIO WORK
- Food & Beverages: Brown-Forman (Jack Daniel's), Guinness / Diageo ("Made of Black", responsible drinking — including the print line "Don't take on more than you can beer"), Orijin ("Live Original"), Pringles ("Cool Days").
- Technology: Google ("Know Google" and "Football Google" campaign films).
- Finance & Payments: Visa ("Rio 2016" & "Not a Tourist"), Interswitch ("Verve Card"), 1 Utility Bank ("Leap of Faith").
- Consumer Goods & Retail: Unilever (Closeup "Closer Is Better"), Chicken Republic.
- Defence & Manufacturing: Proforce Nigeria.

CONTACT
Email hello@bbdowestafrica.com. Studio is in Lagos, Nigeria. There's also a contact form at the bottom of the site.

STYLE
Keep answers clear, warm, and concise without being evasive. Match the user's tone and answer the actual question first. Use separate paragraphs with a blank line, write bullet points as a line starting with "• ", and bold key terms with **double asterisks** when useful. Don't use headings, numbered lists, or code blocks unless the user asks for them.`;

export interface QuickPrompt {
  id: string;
  label: string;
  question: string;
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "company",
    label: "About the company",
    question: "Tell me about BBDO West Africa",
  },
  {
    id: "projects",
    label: "Our projects",
    question: "What projects have you worked on?",
  },
  {
    id: "campaigns",
    label: "Current campaigns",
    question: "What are your current campaigns?",
  },
];

export const STAFF_QUICK_PROMPTS: QuickPrompt[] = [
  { id: "workspace-clients", label: "Our clients", question: "List the clients currently in our workspace." },
  { id: "workspace-creators", label: "Our creators", question: "List the creators currently in our workspace." },
  { id: "team-tasks", label: "Team tasks", question: "Show me the team's open tasks." },
  { id: "add-creator", label: "Add a creator", question: "Add a creator from these profile details:" },
  { id: "new-task", label: "Create a task", question: "Create a task for a creator." },
];

export const PERSONAL_QUICK_PROMPTS: QuickPrompt[] = [
  { id: "my-tasks", label: "My tasks", question: "Show me my open tasks." },
  { id: "my-documents", label: "My documents", question: "What documents are waiting for my signature?" },
];

export function getAnswer(query: string): string {
  const q = query.toLowerCase().trim();

  // 1. Current campaigns
  if (
    q.includes("current campaign") ||
    q.includes("active campaign") ||
    q.includes("live campaign") ||
    q.includes("running campaign") ||
    q.includes("what campaigns are live") ||
    q.includes("current work") ||
    q === "current campaigns"
  ) {
    return [
      "Here are our current and live campaigns:",
      "",
      "• **Jack Daniel’s — ‘That’s Naija, That’s Jack’ (Brown-Forman)**: A high-impact cultural rollout celebrating Nigerian individuality across outdoor, radio, retail pop-ups, The Rooftop Reserve, and sponsorships including Felabration and Art X Lagos.",
      "",
      "• **Betano — ‘Make We Bet’ (Keizen Games)**: Connecting sports wagering with authentic West African banter and the iconic pinky-lock challenge across Nigeria and Ghana.",
      "",
      "• **1 Utility Bank — ‘Leap of Faith’**: A strategic positioning around 'One Bill. No Leap of Faith', turning everyday utility payments into long-term financial trust.",
      "",
      "You can also browse our live campaigns directly in the Work section on this page!"
    ].join("\n");
  }

  // 2. Our projects / Work
  if (
    q.includes("project") ||
    q.includes("work") ||
    q.includes("portfolio") ||
    q.includes("case stud") ||
    q.includes("what have you done") ||
    q.includes("clients") ||
    q === "our projects"
  ) {
    return [
      "BBDO West Africa has delivered transformative work across key industries:",
      "",
      "• **Food & Beverages**: Brown-Forman (Jack Daniel's), Guinness / Diageo ('Made of Black', responsible drinking), Orijin ('Live Original'), and Pringles ('Cool Days').",
      "• **Technology**: Google ('Know Google' and 'Football Google' films).",
      "• **Finance & Payments**: Visa ('Rio 2016' & 'Not a Tourist'), Interswitch ('Verve Card'), and 1 Utility Bank ('Leap of Faith').",
      "• **Consumer Goods & Retail**: Unilever (Closeup 'Closer Is Better') and Chicken Republic.",
      "• **Defence & Manufacturing**: Proforce Nigeria.",
      "",
      "You can explore full case studies, insights, and platform executions in our Work section."
    ].join("\n");
  }

  // 3. About the company
  if (
    q.includes("company") ||
    q.includes("agency") ||
    q.includes("about you") ||
    q.includes("who are you") ||
    q.includes("bbdo") ||
    q.includes("what is bbdo") ||
    q.includes("studio") ||
    q.includes("services") ||
    q.includes("what do you do") ||
    q === "about the company"
  ) {
    return [
      "**BBDO West Africa** is the Lagos studio of the global BBDO network.",
      "",
      "We make work that moves business, culture, and people:",
      "• **10+ Years** in market",
      "• **100+ Brands** served across West Africa",
      "• **30+ Specialists** in our Lagos studio",
      "",
      "Our core disciplines span **Strategy**, **Creative**, **Production**, and **Social**."
    ].join("\n");
  }

  // 4. Specific brand/campaign inquiries
  if (q.includes("jack daniel") || q.includes("naija") || q.includes("brown-forman")) {
    return [
      "**Jack Daniel’s — ‘That’s Naija, That’s Jack’**",
      "",
      "• **Client**: Brown-Forman (Food & Beverages)",
      "• **Insight**: Nigerians moving culture forward refuse outdated scripts and trust their own way—a conviction true to Jack Daniel’s celebration of individuality.",
      "• **Execution**: Two connected phases: a loud launch across outdoor and radio in Lagos & Abuja, followed by retail pop-ups, The Rooftop Reserve, and cultural events (Art X Lagos, Felabration)."
    ].join("\n");
  }

  if (q.includes("betano") || q.includes("make we bet") || q.includes("keizen")) {
    return [
      "**Betano — ‘Make We Bet’**",
      "",
      "• **Client**: Keizen Games (Entertainment)",
      "• **Insight**: Friendly sports debates often end with ‘make we bet’—a familiar challenge to put certainty on the line.",
      "• **Strategy**: Grounding wagering in recognizable West African banter and the classic pinky-lock gesture across Nigeria and Ghana."
    ].join("\n");
  }

  if (q.includes("guinness") || q.includes("made of black") || q.includes("diageo")) {
    return [
      "**Guinness — ‘Made of Black’ & Responsible Drinking**",
      "",
      "• **Client**: Diageo (Food & Beverages)",
      "• **Work**: Supporting Guinness with regional strategy, digital activations, and the memorable print campaign ‘Don’t take on more than you can beer’ alongside network partners including AMV BBDO."
    ].join("\n");
  }

  if (q.includes("google")) {
    return [
      "**Google — ‘Know Google’ & ‘Football Google’**",
      "",
      "• **Client**: Google (Technology)",
      "• **Work**: High-energy campaign films showcasing Google’s search and product utility woven into everyday African culture and football passion."
    ].join("\n");
  }

  if (q.includes("visa")) {
    return [
      "**Visa — ‘Rio 2016’ & ‘Not a Tourist’**",
      "",
      "• **Client**: Visa (Finance)",
      "• **Work**: Campaigns celebrating major sporting moments and seamless cashless payment experiences across the continent."
    ].join("\n");
  }

  if (q.includes("contact") || q.includes("email") || q.includes("reach") || q.includes("hire") || q.includes("address") || q.includes("location")) {
    return [
      "We'd love to connect with you!",
      "",
      "• **Email**: hello@bbdowestafrica.com",
      "• **Studio**: Lagos, Nigeria",
      "• **Website**: You can also reach out through the contact form at the bottom of the page."
    ].join("\n");
  }

  // Fallback
  return [
    "I'm Njeri, your guide to BBDO West Africa. You can ask me simple questions about:",
    "",
    "1. **Our company** (our history, services, and team)",
    "2. **Our projects** (our portfolio and client case studies)",
    "3. **Current campaigns** (live work like Jack Daniel's and Betano)",
    "",
    "You can also click any of the suggestion buttons above!"
  ].join("\n");
}
