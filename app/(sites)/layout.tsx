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
      <body>{children}</body>
    </html>
  );
}
