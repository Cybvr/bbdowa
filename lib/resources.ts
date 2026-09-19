export type Resource = {
  type: "resource";
  slug: string;
  label: string;
  meta: string;
  group: string;
  image: string | null;
  href?: string;
};

export const RESOURCE_RECORDS: Resource[] = [
  { type: "resource", slug: "bbdo-website", group: "BBDO West Africa", label: "Website", meta: "bbdowestafrica.com", image: null, href: "https://www.bbdowestafrica.com/" },
  { type: "resource", slug: "bbdo-instagram", group: "BBDO West Africa", label: "Instagram", meta: "@bbdo_westafrica", image: null, href: "https://www.instagram.com/bbdo_west_africa/" },
  { type: "resource", slug: "bbdo-x", group: "BBDO West Africa", label: "X", meta: "@bbdowestafrica", image: null, href: "https://x.com/bbdowestafrica" },
  { type: "resource", slug: "bbdo-facebook", group: "BBDO West Africa", label: "Facebook", meta: "BBDOWestAfrica", image: null, href: "https://www.facebook.com/BBDOWestAfrica/" },
  { type: "resource", slug: "bbdo-linkedin", group: "BBDO West Africa", label: "LinkedIn", meta: "BBDO West Africa", image: null, href: "https://www.linkedin.com/company/bbdo-west-africa" },
  { type: "resource", slug: "bbdo-youtube", group: "BBDO West Africa", label: "YouTube", meta: "Channel", image: null, href: "https://www.youtube.com/channel/UCfD-UhFcJtLDmgk-pp2PgOw" },
  { type: "resource", slug: "lurzers-archive", group: "Work and profiles", label: "Lürzer's Archive profile", meta: "Selected work", image: null, href: "https://www.luerzersarchive.com/profiles/all/bbdo-west-africa-lagos/" },
  { type: "resource", slug: "casers-website", group: "Casers Group", label: "Website", meta: "casersgroup.com", image: null, href: "https://www.casersgroup.com/" },
  { type: "resource", slug: "casers-linkedin", group: "Casers Group", label: "LinkedIn", meta: "Casers Group", image: null, href: "https://www.linkedin.com/company/casers-group" },
  { type: "resource", slug: "casers-office", group: "Casers Group", label: "Office", meta: "Plot 5 Chief Yesufu Abiodun Oniru Road, Victoria Island, Lagos 106104", image: null, href: "https://www.google.com/maps/search/?api=1&query=Plot+5+Chief+Yesufu+Abiodun+Oniru+Road+Victoria+Island+Lagos+106104" },
  { type: "resource", slug: "microsoft-teams", group: "Internal", label: "Microsoft Teams", meta: "Team link", image: null, href: "https://teams.microsoft.com/l/team/19%3AFC6ZMVMFoEbe1WWMY555j6wfpeaN-olxhL1bmLmnkHg1%40thread.tacv2/conversations?groupId=863aed4a-20d5-4a27-a83b-38c7a6e0dedb&tenantId=6aa7a9a2-4b93-43c4-8311-ec14d3acf30c" },
  { type: "resource", slug: "company-resources", group: "Internal", label: "Company resources", meta: "Shared drive", image: null },
];
