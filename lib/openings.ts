/** A careers opening at the agency (not a client job). */
export type Opening = {
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

export function openingHref(slug: string): string {
  return `/dashboard/careers/${slug}`;
}
