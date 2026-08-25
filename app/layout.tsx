import type { Metadata } from "next";
import { Outfit, Roboto_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BBDO West Africa",
  description:
    "BBDO West Africa is the Lagos studio of the BBDO network: strategy, creative, production and social for brands across the region.",
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "BBDO West Africa",
    description:
      "The Lagos studio of the BBDO network. Strategy, creative, production and social for brands across West Africa.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${robotoMono.variable} flex min-h-screen flex-col bg-white font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
