import type { Metadata } from "next";
import { PageHeader, SectionHeading } from "@/components/dashboard/ui";

export const metadata: Metadata = { title: "Resources" };

type Resource = { label: string; meta: string; href?: string };

const GROUPS: { title: string; links: Resource[] }[] = [
  {
    title: "BBDO West Africa",
    links: [
      { label: "Website", meta: "bbdowestafrica.com", href: "https://www.bbdowestafrica.com/" },
      { label: "Instagram", meta: "@bbdo_westafrica", href: "https://www.instagram.com/bbdo_westafrica/" },
      { label: "X", meta: "@bbdowestafrica", href: "https://x.com/bbdowestafrica" },
      { label: "Facebook", meta: "BBDOWestAfrica", href: "https://www.facebook.com/BBDOWestAfrica/" },
      { label: "LinkedIn", meta: "BBDO West Africa", href: "https://www.linkedin.com/company/bbdo-west-africa" },
      { label: "YouTube", meta: "Channel", href: "https://www.youtube.com/channel/UCfD-UhFcJtLDmgk-pp2PgOw" },
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
      { label: "LinkedIn", meta: "Casers Group", href: "https://www.linkedin.com/company/casers-group" },
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

const ROW = "flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3 text-[16px] font-medium leading-[1.3] no-underline";
const META = "text-[13px] text-muted-foreground";

export default function ResourcesPage() {
  return (
    <main className="flex-1 px-5 pb-16 pt-8 sm:px-8">
      <PageHeader title="Resources" description="Everything in one place." />

      {GROUPS.map((group) => (
        <div key={group.title} className="mt-8">
          <SectionHeading>{group.title}</SectionHeading>
          <ul className="m-0 list-none border-t border-border p-0">
            {group.links.map((link) => (
              <li key={link.label + link.meta} className="border-b border-border">
                {link.href ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener"
                    className={`${ROW} text-foreground after:ml-auto after:text-[0.8em] after:text-muted-foreground after:content-['↗'] hover:text-primary hover:after:text-primary focus-visible:text-primary focus-visible:outline-none max-[720px]:after:ml-0`}
                  >
                    {link.label} <span className={META}>{link.meta}</span>
                  </a>
                ) : (
                  <span
                    className={`${ROW} text-muted-foreground after:ml-auto after:rounded-full after:bg-muted after:px-2 after:py-0.5 after:text-[11px] after:font-medium after:text-foreground after:content-['Add_link'] max-[720px]:after:ml-0`}
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
