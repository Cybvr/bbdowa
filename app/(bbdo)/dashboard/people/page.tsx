import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "People" };

type Role = { title: string; people: string[] };

const BRANCHES: { name: string; roles: Role[] }[] = [
  {
    name: "Client service",
    roles: [
      { title: "Account Director", people: ["Name"] },
      { title: "Account Manager", people: ["Samiat Basorun"] },
    ],
  },
  {
    name: "Strategy & intelligence",
    roles: [
      { title: "Head of Strategy", people: ["Name"] },
      { title: "Strategy, Research & Measurement", people: ["Jaiprakash Tekwani"] },
    ],
  },
  {
    name: "Creative & culture",
    roles: [
      { title: "Chief Creative Officer", people: ["Jide Pinheiro"] },
      { title: "Creative Director", people: ["Emeka Otoba"] },
      { title: "Art Directors", people: ["Stephen Ifebajo", "Lionel Agbakoba", "Nonso Malogo"] },
      { title: "Copywriter", people: ["Esther Felix"] },
    ],
  },
  {
    name: "Influence & media",
    roles: [
      { title: "PR & Editorial Lead", people: ["Name"] },
      { title: "Creator Partnerships, Media & Performance", people: ["Name"] },
    ],
  },
  {
    name: "Studio & production",
    roles: [
      { title: "Head of Production", people: ["Name"] },
      { title: "Production, Motion & Editing", people: ["Name"] },
    ],
  },
  {
    name: "Agency operations",
    roles: [
      { title: "Finance Manager", people: ["Linda Lysias-Pepple"] },
      { title: "HR & Admin", people: ["Tolulope Badamassi"] },
    ],
  },
];

const POD_ROLES = [
  {
    title: "Client lead",
    copy: "Keeps the client relationship and makes sure the work answers the commercial brief.",
  },
  {
    title: "Strategy lead",
    copy: "Brings together the business context, audience research and cultural insight.",
  },
  {
    title: "Creative lead",
    copy: "Develops the central idea and maintains the creative standard across its different forms.",
  },
  {
    title: "PR & editorial",
    copy: "Defines the public story and works with journalists, editors and relevant communities.",
  },
  {
    title: "Creator lead",
    copy: "Finds suitable creators, agrees how they will contribute and manages the partnership.",
  },
  {
    title: "Media & growth",
    copy: "Plans how the work will reach people, then adjusts media and commerce activity as results come in.",
  },
  {
    title: "Integrated producer",
    copy: "Turns the idea into a workable schedule and manages cost, rights and delivery.",
  },
];

const ICON_CLASS =
  "mb-4 block h-[34px] w-[34px] fill-none stroke-current stroke-[2.1] text-primary [stroke-linecap:square] [stroke-linejoin:miter]";

const CAPABILITIES = [
  {
    title: "Content studio",
    copy: "Makes the copy, design, motion and social content required by each pod.",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect x="3.4" y="6" width="25.2" height="20" rx="1" />
        <path d="M3.4 11.4h25.2" />
        <polygon className="fill-foreground stroke-none" points="13.2,14.6 13.2,22.6 20.6,18.6" />
      </svg>
    ),
  },
  {
    title: "Intelligence",
    copy: "Handles research, listening, audience analysis and campaign measurement.",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <circle cx="14.4" cy="14.4" r="8.8" />
        <circle className="fill-foreground stroke-none" cx="14.4" cy="14.4" r="3.4" />
        <path d="M20.8 20.8 28 28" />
      </svg>
    ),
  },
  {
    title: "Growth",
    copy: "Runs paid media, performance work, retail activity, affiliate programmes and partnerships.",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <polyline points="3.4,25.2 11.6,17 17.2,21 28.6,9.4" />
        <polyline points="21.8,9.4 28.6,9.4 28.6,16" />
        <rect className="fill-foreground stroke-none" x="1.9" y="23.7" width="3" height="3" />
      </svg>
    ),
  },
  {
    title: "Protection",
    copy: "Supports legal review, compliance, usage rights, accessibility and brand safety.",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M16 3.4 27.6 7.8v8.7c0 6.5-5 10.5-11.6 12-6.6-1.5-11.6-5.5-11.6-12V7.8Z" />
        <rect className="fill-foreground stroke-none" x="12.5" y="12.5" width="7" height="7" />
      </svg>
    ),
  },
];

function Person({ name, onDark = false }: { name: string; onDark?: boolean }) {
  return (
    <span
      className={`mt-2 flex items-center gap-2 text-[12px] ${
        onDark ? "justify-center text-white/80 text-[14px]" : "text-muted-foreground"
      }`}
    >
      <span
        className={`relative inline-block h-[26px] w-[26px] flex-none overflow-hidden rounded-full border ${
          onDark ? "border-white/40 bg-white" : "border-border bg-background"
        }`}
      >
        <span
          className={`absolute left-1/2 top-1 h-2 w-2 -translate-x-1/2 rounded-full ${
            onDark ? "bg-foreground" : "bg-muted-foreground"
          }`}
        />
        <span
          className={`absolute bottom-[3px] left-1/2 h-[9px] w-4 -translate-x-1/2 rounded-b-[4px] rounded-t-[10px] ${
            onDark ? "bg-foreground" : "bg-muted-foreground"
          }`}
        />
      </span>
      <span>{name}</span>
    </span>
  );
}

export default function PeoplePage() {
  return (
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-20 pt-[clamp(30px,4vw,56px)]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-foreground pb-5">
        <h1 className="m-0 text-[clamp(32px,4vw,58px)] uppercase leading-[0.95] tracking-[-0.045em]">
          People
        </h1>
        <span className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
          Operating model
        </span>
      </div>

      <p className="my-[clamp(34px,5vw,68px)] max-w-[32ch] text-[clamp(24px,3.2vw,44px)] uppercase leading-[1] tracking-[-0.035em]">
        We build each job around a small core team.{" "}
        <em className="not-italic text-primary">
          Specialists join when their input is needed
        </em>{" "}
        and stay involved through delivery.
      </p>

      <section className="mt-[clamp(36px,5vw,68px)]" aria-label="Agency organogram">
        <div className="mx-auto w-[min(320px,100%)] bg-foreground px-[22px] py-[18px] text-center text-white max-[720px]:mb-6">
          <strong className="block text-[18px] uppercase">Managing Director</strong>
          <Person name="Colin Framer" onDark />
        </div>
        <div
          aria-hidden="true"
          className="mx-auto h-10 w-px bg-foreground max-[720px]:hidden"
        />
        <div className="relative grid grid-cols-6 gap-4 pt-10 before:absolute before:left-[calc(100%/12)] before:right-[calc(100%/12)] before:top-0 before:h-px before:bg-foreground before:content-[''] max-[720px]:grid-cols-2 max-[720px]:pt-0 max-[720px]:before:hidden max-[480px]:grid-cols-1">
          {BRANCHES.map((branch) => (
            <section
              key={branch.name}
              className="relative min-w-0 before:absolute before:-top-10 before:left-1/2 before:h-10 before:w-px before:bg-foreground before:content-[''] max-[720px]:before:hidden"
            >
              <h3 className="m-0 flex min-h-[64px] items-center justify-center bg-primary px-3 py-3.5 text-center text-[13px] uppercase leading-[1.15] tracking-[0.06em] text-white max-[720px]:min-h-0">
                {branch.name}
              </h3>
              <ul className="m-0 list-none p-0">
                {branch.roles.map((role) => (
                  <li
                    key={role.title}
                    className="border border-t-0 border-border bg-white p-3 text-[14px] leading-[1.25]"
                  >
                    <span className="block">{role.title}</span>
                    {role.people.map((person) => (
                      <Person key={person} name={person} />
                    ))}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section
        className="mt-[clamp(56px,8vw,100px)] bg-foreground p-[clamp(30px,4vw,54px)] text-white"
        aria-labelledby="pod-title"
      >
        <div className="grid grid-cols-[0.9fr_1.1fr] items-end gap-10 max-[720px]:grid-cols-1">
          <h2
            id="pod-title"
            className="m-0 max-w-[12ch] text-[clamp(28px,4vw,48px)] uppercase leading-[0.95] tracking-[-0.035em]"
          >
            The client pod
          </h2>
          <p className="m-0 max-w-[50ch] text-[clamp(17px,1.7vw,22px)] leading-[1.35] text-white/[0.76]">
            A typical pod has five to seven people who share the brief and are accountable for the
            result. One person may cover more than one role on smaller jobs.
          </p>
        </div>
        <div className="mt-[clamp(34px,5vw,60px)] grid grid-cols-4 border-t border-border max-[720px]:grid-cols-2 max-[480px]:grid-cols-1">
          {POD_ROLES.map((role) => (
            <div
              key={role.title}
              className="min-h-[180px] border-b border-border pb-6 pr-[22px] pt-[22px] [&:not(:nth-child(4n+1))]:border-l [&:not(:nth-child(4n+1))]:border-border [&:not(:nth-child(4n+1))]:pl-[22px] max-[720px]:min-h-0 max-[720px]:border-l-0 max-[720px]:pb-[22px] max-[720px]:pl-0 max-[720px]:pr-4 max-[720px]:pt-5 max-[720px]:[&:nth-child(even)]:border-l max-[720px]:[&:nth-child(even)]:border-border max-[720px]:[&:nth-child(even)]:pl-4 max-[480px]:border-l-0 max-[480px]:px-0 max-[480px]:pb-5 max-[480px]:pt-[18px] max-[480px]:[&:nth-child(even)]:border-l-0 max-[480px]:[&:nth-child(even)]:pl-0"
            >
              <strong className="block text-[18px] uppercase text-primary">{role.title}</strong>
              <p className="mb-0 mt-3.5 text-[15px] leading-[1.4] text-white/[0.78]">{role.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-[clamp(56px,8vw,100px)]" aria-labelledby="network-title">
        <h2
          id="network-title"
          className="mb-[18px] mt-0 text-[13px] font-extrabold uppercase tracking-[0.14em] text-primary"
        >
          Shared capability network
        </h2>
        <div className="grid grid-cols-4 border-y border-foreground max-[720px]:grid-cols-2 max-[480px]:grid-cols-1">
          {CAPABILITIES.map((capability) => (
            <div
              key={capability.title}
              className="pb-7 pr-[22px] pt-6 [&+&]:border-l [&+&]:border-border [&+&]:pl-[22px] max-[720px]:border-b max-[720px]:border-border max-[720px]:border-l-0 max-[720px]:pb-6 max-[720px]:pl-0 max-[720px]:pr-4 max-[720px]:pt-5 max-[720px]:[&:nth-child(even)]:border-l max-[720px]:[&:nth-child(even)]:border-border max-[720px]:[&:nth-child(even)]:pl-4 max-[480px]:border-l-0 max-[480px]:px-0 max-[480px]:pb-5 max-[480px]:pt-[18px] max-[480px]:[&:nth-child(even)]:border-l-0 max-[480px]:[&:nth-child(even)]:pl-0"
            >
              {capability.icon}
              <h3 className="mb-3.5 mt-0 text-[19px] uppercase">{capability.title}</h3>
              <p className="m-0 text-[15px] leading-[1.45] text-muted-foreground">{capability.copy}</p>
            </div>
          ))}
        </div>
        <Link
          href="/dashboard/workflows/agency"
          className="mt-7 inline-block font-extrabold uppercase text-foreground underline underline-offset-[6px] hover:text-primary focus-visible:text-primary"
        >
          View the agency workflow
        </Link>
      </section>
    </main>
  );
}
