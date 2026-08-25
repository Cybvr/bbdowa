import type { Metadata } from "next";
import { changaOne, gtWalsheim } from "./sites/1ub/fonts";
import "./sites/1ub/globals.css";

export const metadata: Metadata = {
  title: "1Utility Bank Launch Campaign Strategy",
  description:
    "DDB Lagos campaign strategy for the launch of OneUtility Bank and Utility Banking in Nigeria.",
  icons: {
    icon: "/sites/1ub/favicon.svg",
    shortcut: "/sites/1ub/favicon.svg",
  },
  openGraph: {
    title: "1Utility Bank Launch Campaign Strategy",
    description:
      "DDB Lagos campaign strategy for the launch of OneUtility Bank and Utility Banking in Nigeria.",
    type: "website",
    images: [
      {
        url: "/sites/1ub/og.png",
        width: 1680,
        height: 944,
        alt: "1Utility Bank Launch Campaign Strategy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "1Utility Bank Launch Campaign Strategy",
    description:
      "DDB Lagos campaign strategy for the launch of OneUtility Bank and Utility Banking in Nigeria.",
    images: ["/sites/1ub/og.png"],
  },
};

export default function SitesRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${gtWalsheim.variable} ${changaOne.variable}`}>
      <body>
        {/* Brand red is hardcoded: this layout loads the 1ub stylesheet, which
            does not define the (bbdo) `brand` token. */}
        <header className="relative z-50 flex h-14 items-center gap-3 overflow-hidden bg-[#e51b23] px-4 md:px-8">
          <a href="/" aria-label="Back to BBDO West Africa" className="flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bbdo-west-africa.png"
              alt="BBDO West Africa"
              className="block h-auto w-[104px] brightness-0 invert sm:w-[120px] md:w-[140px]"
            />
          </a>
          <a
            href="/"
            className="ml-auto inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/70 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#e51b23]"
          >
            <svg
              className="h-4 w-4 flex-none"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="square"
              aria-hidden="true"
            >
              <path d="M2 7.2 8 2.2l6 5" />
              <path d="M3.6 8.4V14h8.8V8.4" />
            </svg>
            Back to home
          </a>
        </header>
        {children}
      </body>
    </html>
  );
}
