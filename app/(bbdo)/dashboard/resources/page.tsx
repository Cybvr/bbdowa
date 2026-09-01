import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resources" };

type Resource = { label: string; meta: string; href?: string };

const GROUPS: { title: string; links: Resource[] }[] = [
  {
    title: "BBDO West Africa",
    links: [
      { label: "Website", meta: "bbdowestafrica.com", href: "https://www.bbdowestafrica.com/" },
      {
        label: "Instagram",
        meta: "@bbdo_westafrica",
        href: "https://www.instagram.com/bbdo_westafrica/",
      },
      { label: "X", meta: "@bbdowestafrica", href: "https://x.com/bbdowestafrica" },
      {
        label: "Facebook",
        meta: "BBDOWestAfrica",
        href: "https://www.facebook.com/BBDOWestAfrica/",
      },
      {
        label: "LinkedIn",
        meta: "BBDO West Africa",
        href: "https://www.linkedin.com/company/bbdo-west-africa",
      },
      {
        label: "YouTube",
        meta: "Channel",
        href: "https://www.youtube.com/channel/UCfD-UhFcJtLDmgk-pp2PgOw",
      },
    ],
  },
  {
    title: "Work and profiles",
    links: [
      {
        label: "Lürzer's Archive profile",
        meta: "Selected work",
        href: "https://www.luerzersarchive.com/profiles/all/bbdo-west-africa-lagos/",
      },
    ],
  },
  {
    title: "Casers Group",
    links: [
      { label: "Website", meta: "casersgroup.com", href: "https://www.casersgroup.com/" },
      {
        label: "LinkedIn",
        meta: "Casers Group",
        href: "https://www.linkedin.com/company/casers-group",
      },
      {
        label: "Office",
        meta: "Plot 5 Chief Yesufu Abiodun Oniru Road, Victoria Island, Lagos 106104",
        href: "https://www.google.com/maps/search/?api=1&query=Plot+5+Chief+Yesufu+Abiodun+Oniru+Road+Victoria+Island+Lagos+106104",
      },
    ],
  },
  {
    title: "Internal",
    links: [
      {
        label: "Microsoft Teams",
        meta: "Team link",
        href: "https://teams.microsoft.com/l/team/19%3AFC6ZMVMFoEbe1WWMY555j6wfpeaN-olxhL1bmLmnkHg1%40thread.tacv2/conversations?groupId=863aed4a-20d5-4a27-a83b-38c7a6e0dedb&tenantId=6aa7a9a2-4b93-43c4-8311-ec14d3acf30c",
      },
      { label: "Company resources", meta: "Shared drive" },
    ],
  },
];

const ROW =
  "flex flex-wrap items-baseline gap-x-[18px] gap-y-1.5 py-[15px] text-[clamp(19px,2vw,26px)] leading-[1.2] tracking-[-0.02em] no-underline";
const META = "text-[13px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground";

export default function ResourcesPage() {
  return (
    <main className="flex-1 px-[clamp(20px,3vw,48px)] pb-20 pt-[clamp(30px,4vw,56px)]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-foreground pb-5">
        <h1 className="m-0 text-[clamp(32px,4vw,58px)] uppercase leading-[0.95] tracking-[-0.045em]">
          Resources
        </h1>
        <span className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
          Everything in one place
        </span>
      </div>

      {GROUPS.map((group) => (
        <div key={group.title} className="mt-[clamp(34px,4.5vw,56px)]">
          <h2 className="mb-1 mt-0 text-[13px] font-extrabold uppercase tracking-[0.16em] text-primary">
            {group.title}
          </h2>
          <ul className="m-0 list-none border-t border-foreground p-0">
            {group.links.map((link) => (
              <li key={link.label + link.meta} className="border-b border-border">
                {link.href ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener"
                    className={`${ROW} text-foreground after:ml-auto after:text-[0.8em] after:text-muted-foreground after:content-['↗'] hover:text-primary hover:after:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary max-[720px]:after:ml-0`}
                  >
                    {link.label} <span className={META}>{link.meta}</span>
                  </a>
                ) : (
                  <span
                    className={`${ROW} text-muted-foreground after:ml-auto after:bg-border after:px-2 after:py-1 after:text-[11px] after:font-extrabold after:uppercase after:tracking-[0.12em] after:text-foreground after:content-['Add_link'] max-[720px]:after:ml-0`}
                  >
                    {link.label} <span className={META}>{link.meta}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </main>
  );
}
