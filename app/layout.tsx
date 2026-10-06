import type { Metadata, Viewport } from "next";
import { Outfit, Roboto_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import Njeri from "@/components/njeri";
import { AuthProvider } from "@/components/auth-provider";
import { SITE_DESCRIPTION, SITE_LOGO, SITE_NAME } from "@/lib/metadata";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bbdowa.vercel.app"),
  title: {
    default: "BBDO West Africa",
    template: "%s | BBDO West Africa",
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    apple: "/pwa/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "BBDO West Africa",
    title: "BBDO West Africa",
    description: SITE_DESCRIPTION,
    type: "website",
    url: "/",
    images: [{ url: SITE_LOGO, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [SITE_LOGO],
  },
};

export const viewport: Viewport = {
  themeColor: "#e51b23",
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: 'try{if(localStorage.getItem("bbdowa-theme")==="dark")document.documentElement.classList.add("dark")}catch{}' }} />
      </head>
      <body
        className={`${outfit.variable} ${robotoMono.variable} flex min-h-screen flex-col bg-background font-sans text-foreground antialiased`}
      >
        <PwaRegister />
        <AuthProvider>
          {children}
          <Njeri />
        </AuthProvider>
      </body>
    </html>
  );
}
