export type Job = {
  slug: string;
  title: string;
  department: string;
  location: string;
  workMode: "Hybrid" | "On-site" | "Remote";
  status: "open" | "closed";
  summary?: string;
  description?: string;
  qualifications?: string[];
  responsibilities?: string[];
  about?: string[];
  schedule?: string;
  salary?: string;
};

export function jobHref(slug: string): string {
  return `/dashboard/careers/${slug}`;
}
