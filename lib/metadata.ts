import type { Metadata } from "next";

export const SITE_NAME = "BBDO West Africa";
export const SITE_DESCRIPTION = "The Lagos studio of the BBDO network. Strategy, creative, production and social for brands across West Africa.";
export const SITE_LOGO = "/bbdo-west-africa.png";

export function pageMetadata(title: string, description = SITE_DESCRIPTION, path = "/"): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
      images: [{ url: SITE_LOGO, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SITE_LOGO],
    },
  };
}
