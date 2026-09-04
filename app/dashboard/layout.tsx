import type { Metadata } from "next";
import { DashboardChrome } from "@/components/dashboard-chrome";

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
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <DashboardChrome>{children}</DashboardChrome>
    </div>
  );
}
