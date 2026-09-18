"use client";

export const SOCIAL_ICON_ASSETS = {
  Instagram: "/icons/social/instagram.svg",
  LinkedIn: "/icons/social/linkedin.svg",
  TikTok: "/icons/social/tiktok.svg",
  X: "/icons/social/x.svg",
} as const;

export type SocialIconName = keyof typeof SOCIAL_ICON_ASSETS;

export function SocialIcon({ name, className = "h-4 w-4" }: { name: SocialIconName; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={SOCIAL_ICON_ASSETS[name]} alt="" aria-hidden="true" className={`${className} object-contain`} />
  );
}
