export type Job = {
  slug: string;
  title: string;
  department: string;
  location: string;
  status: string;
};

export const JOBS: Job[] = [
  {
    slug: "account-director",
    title: "Account Director",
    department: "Client Service",
    location: "Lagos",
    status: "open",
  },
  {
    slug: "head-of-strategy",
    title: "Head of Strategy",
    department: "Strategy & Intelligence",
    location: "Lagos",
    status: "open",
  },
  {
    slug: "pr-editorial-lead",
    title: "PR & Editorial Lead",
    department: "Influence & Media",
    location: "Lagos",
    status: "open",
  },
  {
    slug: "creator-partnerships-media-performance",
    title: "Creator Partnerships, Media & Performance",
    department: "Influence & Media",
    location: "Lagos",
    status: "open",
  },
  {
    slug: "head-of-production",
    title: "Head of Production",
    department: "Studio & Production",
    location: "Lagos",
    status: "open",
  },
  {
    slug: "production-motion-editing",
    title: "Production, Motion & Editing",
    department: "Studio & Production",
    location: "Lagos",
    status: "open",
  },
];
