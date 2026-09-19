import type { Metadata } from "next";
import Link from "next/link";
import { userHref } from "@/lib/users";
import { getUserByName, getUsers } from "@/lib/firebase/content";
import { ImageWithFallback, PageHeader, SectionHeading } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Directory" };

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
      { title: "Art Directors", people: ["Stephen Ifebajo", "Lionel Agbakoba"] },
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
      { title: "HR & Admin", people: ["Tolu Badamassi"] },
    ],
  },
];

const POD_ROLES = [
  { title: "Client lead", copy: "Keeps the client relationship and makes sure the work answers the commercial brief." },
  { title: "Strategy lead", copy: "Brings together the business context, audience research and cultural insight." },
  { title: "Creative lead", copy: "Develops the central idea and maintains the creative standard across its different forms." },
  { title: "PR & editorial", copy: "Defines the public story and works with journalists, editors and relevant communities." },
  { title: "Creator lead", copy: "Finds suitable creators, agrees how they will contribute and manages the partnership." },
  { title: "Media & growth", copy: "Plans how the work will reach people, then adjusts media and commerce activity as results come in." },
  { title: "Integrated producer", copy: "Turns the idea into a workable schedule and manages cost, rights and delivery." },
];

const ICON_CLASS = "mb-3 block h-7 w-7 fill-none stroke-current stroke-2 text-primary [stroke-linecap:round] [stroke-linejoin:round]";

const CAPABILITIES = [
  {
    title: "Content studio",
    copy: "Makes the copy, design, motion and social content required by each pod.",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect x="3.4" y="6" width="25.2" height="20" rx="2" />
        <path d="M3.4 11.4h25.2" />
        <polygon className="fill-primary stroke-none" points="13.2,14.6 13.2,22.6 20.6,18.6" />
      </svg>
    ),
  },
  {
    title: "Intelligence",
    copy: "Handles research, listening, audience analysis and campaign measurement.",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <circle cx="14.4" cy="14.4" r="8.8" />
        <circle className="fill-primary stroke-none" cx="14.4" cy="14.4" r="3.4" />
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
      </svg>
    ),
  },
  {
    title: "Protection",
    copy: "Supports legal review, compliance, usage rights, accessibility and brand safety.",
    icon: (
      <svg className={ICON_CLASS} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M16 3.4 27.6 7.8v8.7c0 6.5-5 10.5-11.6 12-6.6-1.5-11.6-5.5-11.6-12V7.8Z" />
        <rect className="fill-primary stroke-none" x="12.5" y="12.5" width="7" height="7" rx="1" />
      </svg>
    ),
  },
];

async function Person({ name, onDark = false }: { name: string; onDark?: boolean }) {
  const user = await getUserByName(name);
  const className = `mt-1.5 flex items-center gap-2 text-[12px] no-underline ${
    onDark
      ? "justify-center text-[13px] text-background/80 hover:text-background"
      : "text-muted-foreground hover:text-primary"
  }`;
  const content = (
    <>
      <span className={`relative inline-block h-[22px] w-[22px] flex-none overflow-hidden rounded-full border ${onDark ? "border-background/40 bg-background" : "border-border bg-muted"}`}>
        <ImageWithFallback
          src={user?.profileImage}
          alt=""
          className="h-full w-full object-cover"
          fallbackClassName="h-full w-full"
        />
      </span>
      <span>{name}</span>
    </>
  );

  return user ? (
    <Link href={userHref(user)} className={className}>
      {content}
    </Link>
  ) : (
    <span className={className}>{content}</span>
  );
}

export default async function PeoplePage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Directory" meta="Operating model" />

      <section className="mt-10" aria-label="Agency organogram">
        <div className="mx-auto w-[min(300px,100%)] rounded-xl bg-foreground px-5 py-4 text-center text-background max-[720px]:mb-5">
          <strong className="block text-[15px] font-semibold">Casers Group Chairman</strong>
          <Person name="Enyi Odigbo" onDark />
        </div>
        <div aria-hidden="true" className="mx-auto h-6 w-px bg-border max-[720px]:hidden" />
        <div className="mx-auto grid w-[min(680px,100%)] grid-cols-2 gap-3 pt-6 max-[720px]:mb-5 max-[720px]:grid-cols-1 max-[720px]:pt-0">
          <div className="rounded-xl bg-foreground px-5 py-4 text-center text-background">
            <strong className="block text-[15px] font-semibold">Managing Director</strong>
            <Person name="Colin Framer" onDark />
          </div>
          <div className="rounded-xl bg-foreground px-5 py-4 text-center text-background">
            <strong className="block text-[15px] font-semibold">Interim Group Executive Lead — Nigeria</strong>
            <Person name="Briand Ngondi" onDark />
          </div>
        </div>
        <div aria-hidden="true" className="mx-auto h-8 w-px bg-border max-[720px]:hidden" />
        <div className="grid grid-cols-2 gap-3 pt-8 sm:grid-cols-3 lg:grid-cols-6">
          {BRANCHES.map((branch) => (
            <section key={branch.name} className="min-w-0 overflow-hidden rounded-xl border border-border">
              <h3 className="m-0 flex min-h-[56px] items-center justify-center bg-muted px-3 py-3 text-center text-[13px] font-semibold leading-[1.15]">
                {branch.name}
              </h3>
              <ul className="m-0 list-none p-0">
                {branch.roles.map((role) => (
                  <li key={role.title} className="border-t border-border p-3 text-[13px] leading-[1.3]">
                    <span className="block font-medium">{role.title}</span>
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

      <section className="mt-12 rounded-xl bg-foreground p-6 text-background sm:p-8" aria-labelledby="pod-title">
        <div className="grid grid-cols-1 items-end gap-6 sm:grid-cols-[0.9fr_1.1fr]">
          <h2 id="pod-title" className="m-0 text-[22px] font-bold leading-tight tracking-tight sm:text-[28px]">
            The client pod
          </h2>
          <p className="m-0 max-w-[50ch] text-[15px] leading-[1.45] text-background/76">
            A typical pod has five to seven people who share the brief and are accountable for the
            result. One person may cover more than one role on smaller jobs.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 border-t border-background/25 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {POD_ROLES.map((role) => (
            <div key={role.title}>
              <strong className="block text-[15px] font-semibold text-primary">{role.title}</strong>
              <p className="mb-0 mt-2 text-[13px] leading-[1.4] text-background/78">{role.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="network-title">
        <SectionHeading id="network-title">Shared capability network</SectionHeading>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((capability) => (
            <div key={capability.title}>
              {capability.icon}
              <h3 className="mb-1.5 mt-0 text-[15px] font-semibold">{capability.title}</h3>
              <p className="m-0 text-[13px] leading-[1.45] text-muted-foreground">{capability.copy}</p>
            </div>
          ))}
        </div>
        <Link
          href="/dashboard/workflows/agency"
          className="mt-6 inline-block text-[13px] font-semibold text-foreground underline decoration-border underline-offset-4 hover:text-primary focus-visible:text-primary"
        >
          View the agency workflow
        </Link>
      </section>
    </main>
  );
}
