import type { Metadata } from "next";
import { Outfit, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BBDO West Africa",
    template: "%s — BBDO West Africa",
  },
  description: "BBDO West Africa — a shared home for agency information and working knowledge.",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${robotoMono.variable} flex min-h-screen flex-col bg-cream font-sans text-ink antialiased`}
      >
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
