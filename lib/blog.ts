export type BlogCategory = "News" | "People" | "Work" | "Industry";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: BlogCategory;
  sourceName: string;
  sourceUrl?: string;
};

/**
 * Curated external coverage and documented work related to BBDO West Africa.
 * Keep excerpts short and paraphrased; when present, the source URL is the
 * canonical place for the full article or campaign record.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "briand-ngondi-interim-group-executive-lead-nigeria",
    title: "Briand Ngondi appointed Interim Group Executive Lead for Nigeria",
    excerpt:
      "Briand Ngondi, currently overseeing WECA operations, will assume responsibility as Interim Group Executive Lead for Nigeria from 14 September 2026. His immediate mandate is to restore stability, strengthen delivery and rebuild confidence across the business.",
    publishedAt: "2026-09-01",
    category: "News",
    sourceName: "BBDO West Africa",
  },
  {
    slug: "bbdo-west-africa-strategy-lead-lagos",
    title: "BBDO West Africa is looking for a strategy lead in Lagos",
    excerpt:
      "A recent role description puts research, behaviour and culture at the centre of the agency’s strategy practice, with responsibility for turning ambiguity into clearer decisions and stronger creative work.",
    publishedAt: "2026",
    category: "People",
    sourceName: "LinkedIn Jobs",
    sourceUrl: "https://ng.linkedin.com/jobs/view/strategy-lead-at-bbdo-west-africa-4364470451",
  },
  {
    slug: "bbdo-west-africa-cannes-lions-young-creatives-2023",
    title: "BBDO West Africa team selected for Nigeria’s Cannes Lions delegation",
    excerpt:
      "Mabayomije Akinyemi-Ekong and Olubukunola Tijani were listed among the Nigerian young creatives selected for the film competition connected to Cannes Lions 2023.",
    publishedAt: "2023",
    category: "People",
    sourceName: "Brand Times",
    sourceUrl:
      "https://www.brandtimes.com.ng/cannes-lions-2023-meet-the-young-creatives-that-will-represent-nigeria/",
  },
  {
    slug: "bbdo-west-africa-nigeria-independence-day",
    title: "Personalising freedom for Nigeria’s Independence Day",
    excerpt:
      "For its 2022 self-promotion work, BBDO West Africa used relatable everyday situations to make the idea of freedom feel personal and close to home.",
    publishedAt: "2022-10",
    category: "Work",
    sourceName: "Ads of the World",
    sourceUrl: "https://www.adsoftheworld.com/campaigns/nigeria-indepedence-day",
  },
  {
    slug: "bbdo-west-africa-young-lions-film-2022",
    title: "BBDO West Africa represented in the Young Lions film competition",
    excerpt:
      "The Pitcher Festival’s 2022 competition page lists Veronica Aidovhioghie Anani and Azolibe Matthew of BBDO West Africa among the Young Lions film entries.",
    publishedAt: "2022",
    category: "People",
    sourceName: "Pitcher Festival",
    sourceUrl: "https://www.pitcherfestival.com/2022-yl-competitions",
  },
  {
    slug: "bbdo-west-africa-stanbic-ibtc-appointment",
    title: "BBDO West Africa appointed Stanbic IBTC’s creative agency",
    excerpt:
      "BusinessDay reported that BBDO West Africa won Stanbic IBTC Holdings’ creative account after a competitive pitch, with the appointment taking effect in January 2020.",
    publishedAt: "2020-01-28",
    category: "News",
    sourceName: "BusinessDay",
    sourceUrl: "https://businessday.ng/brands-advertising/article/bbdo-emerges-stanbic-ibtcs-new-creative-agency/",
  },
  {
    slug: "bbdo-west-africa-the-work",
    title: "The Work turns the creative process into a self-promotion campaign",
    excerpt:
      "The 2018 campaign documented the dynamics of bringing creative work to life, with a BBDO West Africa team spanning creative direction, art direction, photography and copywriting.",
    publishedAt: "2018-06",
    category: "Work",
    sourceName: "Ads of the World",
    sourceUrl: "https://www.adsoftheworld.com/campaigns/the-work",
  },
  {
    slug: "bbdo-west-africa-account-wins-2017",
    title: "BBDO West Africa reported wins for Pringles and SC Johnson",
    excerpt:
      "ThisDay reported two early account wins for the Lagos office: Pringles and SC Johnson, extending the agency’s role across consumer and household brands in the region.",
    publishedAt: "2017-04-30",
    category: "News",
    sourceName: "THISDAY",
    sourceUrl: "https://www.thisdaylive.com/2017/04/30/bbdo-clinches-new-account-foresees-brighter-future/",
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
