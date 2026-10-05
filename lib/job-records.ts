import { serverTimestamp } from "firebase/firestore";
import type { JobStatus } from "@/lib/jobs";

/** A unique, URL-safe slug from a title. */
export function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "item"}-${Date.now().toString(36)}`;
}

/** The Firestore record for a brand-new job, with placeholder case-study copy. */
export function newJobRecord({
  slug,
  title,
  campaignTitle,
  client,
  category = "General",
  year = null,
  liveDate = null,
  status = "active",
  creatorSlugs = [],
}: {
  slug: string;
  title: string;
  campaignTitle?: string;
  client: { slug: string; name: string };
  category?: string;
  year?: number | null;
  liveDate?: string | null;
  status?: JobStatus;
  creatorSlugs?: string[];
}) {
  return {
    slug,
    name: title,
    title,
    campaignTitle: campaignTitle?.trim() || title,
    clientId: client.slug,
    clientName: client.name,
    category,
    year,
    liveAt: liveDate ? { date: liveDate } : null,
    status,
    leadUserId: null,
    creatorSlugs,
    publishedBy: null,
    fee: "To be confirmed",
    target: "To be confirmed",
    result: "To be confirmed",
    image: "/images/projects/project-placeholder.svg",
    imageAlt: `${title} job placeholder`,
    media: [],
    summary: "Job details will be added.",
    challenge: "Challenge details coming soon.",
    insight: "Insight details coming soon.",
    strategy: "Strategy details coming soon.",
    platform: ["Channels to be confirmed"],
    execution: "Execution details coming soon.",
    outcome: "Outcome details coming soon.",
    placeholder: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
