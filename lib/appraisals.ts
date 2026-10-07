export const APPRAISAL_COLLECTION = "appraisals";

export type AppraisalStatus = "assigned" | "submitted";

/** Job relevance: how much an item matters to the role. */
export const JOB_RELEVANCE_SCALE = [
  { value: 5, label: "Critical" },
  { value: 4, label: "Very important" },
  { value: 3, label: "Average importance" },
  { value: 2, label: "Somewhat important" },
  { value: 1, label: "Of minimal importance" },
] as const;

/** Performance: how well the person does it. */
export const PERFORMANCE_SCALE = [
  { value: 5, label: "Superior" },
  { value: 4, label: "Excellent" },
  { value: 3, label: "Good" },
  { value: 2, label: "Average" },
  { value: 1, label: "Poor" },
] as const;

export type AppraisalSection = { id: string; title: string; items: { id: string; label: string }[] };

export const APPRAISAL_SECTIONS: AppraisalSection[] = [
  {
    id: "creative", title: "Contribution to creative excellence", items: [
      { id: "creative-briefs", label: "Develops and contributes to effective creative briefs" },
      { id: "creative-execution", label: "Recognizes and adds to executional excellence" },
      { id: "creative-client", label: "Builds a receptive client attitude to creative efforts" },
    ],
  },
  {
    id: "strategic", title: "Strategic thinking", items: [
      { id: "strategic-business", label: "Demonstrates good business sense; defines key issues" },
      { id: "strategic-sides", label: "Thinks completely: evaluates several sides of an issue" },
      { id: "strategic-solutions", label: "Recommends solutions to problems and provides persuasive rationale" },
    ],
  },
  {
    id: "research-media", title: "Research and media thinking", items: [
      { id: "research-consumer", label: "Consistently uses research to determine consumer viewpoint" },
      { id: "research-media", label: "Effectively directs media plan development" },
      { id: "research-tll", label: "Thinks “through-the-line”" },
    ],
  },
  {
    id: "organizational", title: "Organizational skills", items: [
      { id: "org-priorities", label: "Understands and establishes priorities" },
      { id: "org-coordination", label: "Coordinates a multitude of functions and produces results in a timely manner" },
      { id: "org-detail", label: "Pays adequate attention to detail" },
      { id: "org-financial", label: "Effectively manages the financial aspects of the business" },
      { id: "org-profit", label: "Demonstrates concern for agency profitability" },
    ],
  },
  {
    id: "communication", title: "Communication skills", items: [
      { id: "comm-oral", label: "Presents orally in an articulate, persuasive manner" },
      { id: "comm-written", label: "Provides written points of view that are clear, concise and persuasive" },
      { id: "comm-spontaneous", label: "Effectively responds to spontaneous issues or questions in meetings" },
      { id: "comm-direction", label: "Clearly and effectively articulates needs and direction to co-workers" },
      { id: "comm-negotiates", label: "Negotiates to the agency’s benefit" },
    ],
  },
  {
    id: "attitude", title: "Attitude", items: [
      { id: "att-initiative", label: "Takes initiative and is pro-active in providing business-building ideas" },
      { id: "att-dedication", label: "Demonstrates dedication, commitment and follow-through to assignments" },
      { id: "att-stress", label: "Responds well and works calmly under stress" },
      { id: "att-learn", label: "Demonstrates desire to learn and improve; accepts constructive criticism" },
      { id: "att-enthusiasm", label: "Projects the enthusiasm and positiveness of a leader" },
      { id: "att-team", label: "Is a “team player”" },
    ],
  },
  {
    id: "business-style", title: "Business style", items: [
      { id: "biz-delegates", label: "Delegates responsibility" },
      { id: "biz-opinions", label: "States opinions and defends them with conviction" },
      { id: "biz-challenges", label: "Challenges client point of view" },
      { id: "biz-confidence", label: "Inspires client confidence" },
      { id: "biz-unsupervised", label: "Meets with clients without supervision" },
      { id: "biz-anticipates", label: "Anticipates client needs and requests" },
      { id: "biz-professional", label: "Presents themselves in a confident, professional manner" },
      { id: "biz-informed", label: "Keeps immediate superior informed on the account’s activities" },
    ],
  },
  {
    id: "coordination", title: "Co-ordination skills", items: [
      { id: "coord-expert", label: "Is the expert on their business region-wide" },
      { id: "coord-leadership", label: "Provides intellectual, emotional and business leadership across the region" },
      { id: "coord-management", label: "Demonstrates an understanding of top-down and bottom-up management" },
      { id: "coord-offices", label: "Readily assumes responsibility for tasks performed in other offices" },
      { id: "coord-network", label: "Merchandises the network to the client" },
    ],
  },
];

export type AppraisalQuestion = { id: string; label: string };

export const QUALITATIVE_QUESTIONS: AppraisalQuestion[] = [
  { id: "overall", label: "What factors contributed to your overall assessment?" },
  { id: "strengths", label: "What are your key strengths?" },
  { id: "improvements", label: "What areas would you like to improve, and by when?" },
  { id: "goals", label: "What are your development goals for the next six months?" },
  { id: "projects", label: "What projects or responsibilities would help you grow and develop?" },
  { id: "training", label: "What formal training, seminars, or other support would benefit you?" },
  { id: "promotable", label: "How ready do you feel for greater responsibility or promotion, and on what timeline?" },
];

export type AppraisalRating = { job: number | null; performance: number | null };

export type Appraisal = {
  id: string;
  status: AppraisalStatus;
  /** Firebase uid of the user assigned to complete this appraisal. */
  assignedTo: string | null;
  assignedToName: string;
  assignedToTitle: string;
  /** Review period, e.g. “January – June 2026”. */
  period: string;
  message: string;
  ratings: Record<string, AppraisalRating>;
  comments: Record<string, string>;
  qualitative: Record<string, string>;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string;
};

/** An item counts only when both the job relevance and the performance are rated. */
export function itemScore(rating: AppraisalRating | undefined): number | null {
  return rating?.job && rating.performance ? rating.job * rating.performance : null;
}

export function scoreAppraisal(ratings: Record<string, AppraisalRating>) {
  let jobTotal = 0;
  let performanceTotal = 0;
  const sections: Record<string, { jobTotal: number; performanceTotal: number }> = {};
  for (const section of APPRAISAL_SECTIONS) {
    const sectionScore = { jobTotal: 0, performanceTotal: 0 };
    for (const item of section.items) {
      const score = itemScore(ratings[item.id]);
      if (score === null) continue;
      sectionScore.jobTotal += ratings[item.id].job as number;
      sectionScore.performanceTotal += score;
    }
    sections[section.id] = sectionScore;
    jobTotal += sectionScore.jobTotal;
    performanceTotal += sectionScore.performanceTotal;
  }
  return { jobTotal, performanceTotal, overall: jobTotal ? performanceTotal / jobTotal : null, sections };
}

export function formatOverall(overall: number | null): string {
  return overall === null ? "—" : overall.toFixed(2);
}

export function overallLabel(overall: number | null): string {
  if (overall === null) return "";
  const nearest = Math.min(5, Math.max(1, Math.round(overall)));
  return PERFORMANCE_SCALE.find((option) => option.value === nearest)?.label ?? "";
}

export function sortAppraisals(appraisals: Appraisal[]): Appraisal[] {
  return [...appraisals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function normalizeAppraisal(id: string, data: Partial<Appraisal>): Appraisal {
  return {
    id,
    status: data.status === "submitted" ? "submitted" : "assigned",
    assignedTo: data.assignedTo ?? null,
    assignedToName: data.assignedToName ?? "",
    assignedToTitle: data.assignedToTitle ?? "",
    period: data.period ?? "",
    message: data.message ?? "",
    ratings: data.ratings ?? {},
    comments: data.comments ?? {},
    qualitative: data.qualitative ?? {},
    createdBy: data.createdBy ?? "",
    createdByName: data.createdByName ?? null,
    createdAt: data.createdAt ?? "",
    updatedAt: data.updatedAt ?? "",
    submittedAt: data.submittedAt ?? "",
  };
}

export function appraisalNeedsCompletion(appraisal: Appraisal): boolean {
  return appraisal.status === "assigned";
}
