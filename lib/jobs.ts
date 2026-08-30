export type Job = {
  slug: string;
  title: string;
  department: string;
  location: string;
  workMode: "Hybrid" | "On-site" | "Remote";
  status: "open" | "closed";
};

export const JOBS: Job[] = [
  {
    slug: "head-of-strategy",
    title: "Head of Strategy",
    department: "Strategy & Intelligence",
    location: "Lagos",
    workMode: "Hybrid",
    status: "open",
  },
  {
    slug: "pr-editorial-lead",
    title: "PR & Editorial Lead",
    department: "Influence & Media",
    location: "Lagos",
    workMode: "On-site",
    status: "closed",
  },
  {
    slug: "creator-partnerships-media-performance",
    title: "Creator Partnerships, Media & Performance",
    department: "Influence & Media",
    location: "Lagos",
    workMode: "Remote",
    status: "closed",
  },
  {
    slug: "head-of-production",
    title: "Head of Production",
    department: "Studio & Production",
    location: "Lagos",
    workMode: "On-site",
    status: "closed",
  },
  {
    slug: "production-motion-editing",
    title: "Production, Motion & Editing",
    department: "Studio & Production",
    location: "Lagos",
    workMode: "On-site",
    status: "closed",
  },
  {
    slug: "art-director",
    title: "Art Director",
    department: "Creative",
    location: "Lagos",
    workMode: "Hybrid",
    status: "open",
  },
  {
    slug: "copywriter",
    title: "Copywriter",
    department: "Creative",
    location: "Lagos",
    workMode: "Remote",
    status: "open",
  },
];

export function getJob(slug: string): Job | undefined {
  return JOBS.find((job) => job.slug === slug);
}

export function jobHref(slug: string): string {
  return `/dashboard/careers/${slug}`;
}
