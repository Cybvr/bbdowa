import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Agency Workflow" };

const PRINCIPLES = [
  {
    title: "Team setup",
    copy: "The people behind strategy, ideas, influence, distribution, and production all sit around the exact same brief from day one.",
  },
  {
    title: "Idea and expression",
    copy: "Because everyone starts together, the central idea stays clear and recognizable, even as it’s shaped specifically for how real people use each channel.",
  },
  {
    title: "Distribution",
    copy: "With the creative aligned, PR, creators, and brand channels build the initial response first, giving us real momentum before we scale media spend.",
  },
  {
    title: "Ongoing decisions",
    copy: "That early response gives the team live evidence to review during the campaign, so we only adjust the creative or shift budgets when the data actually backs it up.",
  },
];

const STAGES = [
  {
    title: "Set the outcome",
    intro:
      "We kick off by agreeing on the exact problem we’re solving and what proof will show we solved it.",
    items: [
      "Define the business or reputation issue behind the request",
      "Identify the people affected and the specific change required",
      "Confirm the budget, timeline, project lead, and final decision-maker",
      "Agree on the exact metrics that will prove the result",
    ],
    gate: "Gate: Outcome agreed",
  },
  {
    title: "Find the idea",
    intro:
      "With the target clear, the pod uses research and experience to land on a real audience truth and an idea the brand can authentically own.",
    items: [
      "State the customer or cultural insight behind the opportunity",
      "Define the exact role the brand gets to play",
      "Write the main message in plain, straightforward language",
      "Map out how catching attention naturally leads to the desired action",
    ],
    gate: "Gate: Strategic direction approved",
  },
  {
    title: "Build the pod",
    intro:
      "Once the strategic direction is set, the client lead brings in the specific specialists, creators, and partners needed to bring it to life.",
    items: [
      "Assign a named owner to every required discipline",
      "Involve creators and cultural partners early while they can still shape the work",
      "Define the exact purpose of every channel in the plan",
      "Confirm measurement, legal, rights, and brand safety requirements upfront",
    ],
    gate: "Gate: Team and channel plan confirmed",
  },
  {
    title: "Make the work",
    intro:
      "With the right team assembled, production starts with a flexible source idea. Each channel gets an execution built for how it works.",
    items: [
      "Develop creator content tailored to the platform and audience",
      "Adapt the core idea across PR, social, retail, and paid media",
      "Test early prototypes and use the initial response to refine the work",
      "Use approved AI tools for research and fast variation under direct human review",
    ],
    gate: "Gate: Work approved for release",
  },
  {
    title: "Launch the campaign",
    intro:
      "We go live across our planned channels, watching the real-time response like a hawk so we can back what’s working with extra media support.",
    items: [
      "Coordinate the core story, creator content, and brand activity for launch",
      "Supply media and online communities with accurate, timely assets",
      "Jump into active conversations while the topic is hot",
      "Shift performance and retail media budgets toward what’s actively converting",
    ],
    gate: "Gate: Campaign live",
  },
  {
    title: "Review and adjust",
    intro:
      "Because we track performance continuously, reporting guides the live work and captures lessons for the next brief.",
    items: [
      "Track business results, search lift, attention, and sentiment as they happen",
      "Compare how different ideas and creators perform head-to-head",
      "Reallocate budget the moment performance data supports a change",
      "Store audience, creative, and channel findings so future work starts ahead",
    ],
    gate: "Gate: Next action agreed",
  },
];

const RULES = [
  {
    title: "Single accountability:",
    copy: "The client lead stays personally responsible for the agreed outcome from start to finish.",
  },
  {
    title: "Early collaboration:",
    copy: "Creators, publishers, and partners join while they can still genuinely shape the work.",
  },
  {
    title: "Unified voice:",
    copy: "The client receives one consolidated set of feedback for every review cycle.",
  },
  {
    title: "Agile budgets:",
    copy: "Media spend follows the plan, but shifts the second performance warrants it.",
  },
  {
    title: "Proactive safeguards:",
    copy: "The team clears legal, rights, cultural, and safety issues during development, well before the deadline.",
  },
  {
    title: "Human governance:",
    copy: "Approved AI tools can speed up research, but a named human is always accountable for the work.",
  },
];

export default function AgencyWorkflowPage() {
  return (
    <div className="flex-1">
      <header className="flex min-h-[clamp(360px,52vh,580px)] items-center px-[clamp(20px,3vw,48px)] py-[clamp(48px,7vw,88px)]">
        <h1 className="m-0 max-w-[14ch] text-[clamp(40px,5vw,68px)] uppercase leading-[0.9] tracking-[-0.05em]">
          Agency Workflow
        </h1>
      </header>

      <section
        className="grid grid-cols-4 gap-px bg-foreground px-[clamp(20px,3vw,48px)] py-[38px] text-white max-[860px]:grid-cols-2 max-[860px]:gap-x-0 max-[860px]:gap-y-7 max-[560px]:grid-cols-1"
        aria-label="Modern agency principles"
      >
        {PRINCIPLES.map((principle, index) => (
          <div
            key={principle.title}
            className={`border-l border-border px-[clamp(12px,2vw,30px)] py-2.5 ${
              index === 0 ? "border-l-0 pl-0" : ""
            } ${index === 2 ? "max-[860px]:border-l-0 max-[860px]:pl-0" : ""} max-[560px]:border-l-0 max-[560px]:border-t max-[560px]:border-t-border max-[560px]:px-0 max-[560px]:py-[18px] max-[560px]:first:border-t-0`}
          >
            <strong className="mb-[7px] block text-[12px] uppercase tracking-[0.12em] text-primary">
              {principle.title}
            </strong>
            <span className="text-[clamp(16px,1.5vw,21px)] leading-[1.25]">{principle.copy}</span>
          </div>
        ))}
      </section>

      <main className="px-[clamp(20px,3vw,48px)] py-[clamp(52px,7vw,88px)]">
        <div className="mb-[clamp(54px,8vw,100px)] grid grid-cols-[0.8fr_1.2fr] gap-10 max-[860px]:grid-cols-1">
          <h2 className="m-0 text-[clamp(28px,4vw,48px)] uppercase leading-[0.95] tracking-[-0.04em]">
            How a Job Moves
          </h2>
          <p className="m-0 max-w-[650px] text-[clamp(19px,2vw,28px)] leading-[1.25]">
            The same pod handles your project from start to finish. These six connected stages give
            clear ownership and quick approvals, while keeping enough flexibility to pivot as the
            market reacts.
          </p>
        </div>

        {STAGES.map((stage, index) => (
          <section
            key={stage.title}
            className="grid grid-cols-[80px_minmax(180px,0.65fr)_minmax(0,1.35fr)] gap-[clamp(20px,4vw,64px)] border-t border-foreground py-[clamp(32px,4vw,58px)] last:border-b last:border-b-foreground max-[860px]:grid-cols-[44px_1fr] max-[560px]:grid-cols-[34px_1fr] max-[560px]:gap-4"
          >
            <span className="text-[14px] font-extrabold text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="m-0 text-[clamp(24px,3vw,40px)] uppercase leading-[0.95] tracking-[-0.04em]">
              {stage.title}
            </h3>
            <div className="max-[860px]:col-start-2">
              <p className="mb-6 mt-0 max-w-[680px] text-[clamp(18px,1.7vw,24px)] leading-[1.35]">
                {stage.intro}
              </p>
              <ul className="m-0 list-none border-t border-border p-0">
                {stage.items.map((item) => (
                  <li
                    key={item}
                    className="relative border-b border-border py-3 pl-[26px] text-[16px] leading-[1.35] before:absolute before:left-0 before:top-[18px] before:h-2 before:w-2 before:bg-primary before:content-['']"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <span className="mt-[22px] inline-block bg-primary px-[11px] py-2 text-[11px] font-extrabold uppercase tracking-[0.11em] text-white">
                {stage.gate}
              </span>
            </div>
          </section>
        ))}
      </main>

      <section className="bg-primary px-[clamp(20px,3vw,48px)] py-[clamp(52px,7vw,88px)] text-white">
        <h2 className="mb-6 mt-0 max-w-[14ch] text-[clamp(30px,4vw,52px)] uppercase leading-[0.92] tracking-[-0.05em]">
          Working Agreements
        </h2>
        <p className="mb-14 mt-0 max-w-[720px] text-[clamp(18px,1.8vw,25px)] leading-[1.35]">
          To keep this process moving fast and protect the work, the team operates under six simple
          rules:
        </p>
        <div className="grid grid-cols-2 gap-x-12 gap-y-0 max-[560px]:grid-cols-1">
          {RULES.map((rule) => (
            <div
              key={rule.title}
              className="border-t border-white/55 py-[22px] text-[clamp(18px,1.8vw,25px)] leading-[1.25]"
            >
              <strong>{rule.title}</strong> {rule.copy}
            </div>
          ))}
        </div>
      </section>

      <section className="px-[clamp(20px,3vw,48px)] py-14">
        <h2 className="mb-5 mt-0 text-[28px] uppercase tracking-[-0.04em]">
          Why the Team Stays Connected
        </h2>
        <p className="mb-[22px] mt-0 max-w-[760px] text-[16px] leading-[1.5] text-muted-foreground">
          People experience campaigns in different places: a social feed, a creator’s page, search
          results, or an online shop. Keeping the same pod connected helps those touchpoints
          reinforce each other while each channel runs work made for it.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Link
            href="/dashboard/people"
            className="text-[13px] font-extrabold text-foreground underline underline-offset-4 hover:text-primary focus-visible:text-primary"
          >
            View the pod structure
          </Link>
          <a
            href="https://www.iab.com/guidelines/ai-governance-and-risk-management-playbook/"
            target="_blank"
            rel="noopener"
            className="text-[13px] font-extrabold text-foreground underline underline-offset-4 hover:text-primary focus-visible:text-primary"
          >
            IAB AI Governance Playbook
          </a>
          <a
            href="https://business.adobe.com/resources/reports/martech-digital-trends.html"
            target="_blank"
            rel="noopener"
            className="text-[13px] font-extrabold text-foreground underline underline-offset-4 hover:text-primary focus-visible:text-primary"
          >
            Adobe AI &amp; Digital Trends
          </a>
        </div>
      </section>
    </div>
  );
}
